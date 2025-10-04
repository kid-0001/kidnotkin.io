"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export default function MatrixLiveChat() {
    const [sessionState, setSessionState] = useState('initializing');
    const [messages, setMessages] = useState([]);
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const syncIntervalRef = useRef(null);
    const popupRef = useRef(null);

    // Matrix server configuration
    const MATRIX_BASE_URL = 'https://matrix.kidnotkin.io';
    const ROOM_ALIAS = '#live-chat:kidnotkin.io';
    const ROOM_ID = '!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io';

    // Cleanup function
    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }
        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
        }
    }, []);

    // Auto-scroll to latest messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    // Initialize Matrix connection
    useEffect(() => {
        initializeConnection();
    }, []);

    const initializeConnection = async () => {
        try {
            setSessionState('connecting');
            setError(null);
            
            // Test server connectivity first
            const serverTest = await fetch(`${MATRIX_BASE_URL}/_matrix/client/versions`, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!serverTest.ok) {
                throw new Error(`Server unavailable: ${serverTest.status}`);
            }

            // Check for existing authenticated session
            const authToken = checkExistingAuth();
            if (authToken && await validateToken(authToken)) {
                await setupAuthenticatedClient(authToken);
                return;
            }

            // Fallback to guest access
            await setupGuestClient();
            
        } catch (err) {
            console.error('Matrix initialization failed:', err);
            setError(err.message);
            setSessionState('error');
        }
    };

    const checkExistingAuth = () => {
        // Check standard Matrix client storage locations
        const storageKeys = [
            'mx_access_token',
            `mx_access_token_${MATRIX_BASE_URL}`,
            'mx_user_id',
            'mx_device_id'
        ];
        
        for (const key of storageKeys) {
            const token = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (token && token.length > 10) {
                return token;
            }
        }
        return null;
    };

    const validateToken = async (token) => {
        try {
            const response = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/account/whoami`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch {
            return false;
        }
    };

    const setupAuthenticatedClient = async (token) => {
        try {
            const whoamiResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/account/whoami`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (whoamiResponse.ok) {
                const userData = await whoamiResponse.json();
                const newClient = {
                    accessToken: token,
                    userId: userData.user_id,
                    type: 'authenticated'
                };
                
                setClient(newClient);
                setSessionState('authenticated');
                await joinRoomAndStartSync(newClient);
            }
        } catch (err) {
            console.error('Authenticated setup failed:', err);
            await setupGuestClient();
        }
    };

    const setupGuestClient = async () => {
        try {
            abortControllerRef.current = new AbortController();
            
            const guestResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/register?kind=guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
                signal: abortControllerRef.current.signal
            });
            
            if (!guestResponse.ok) {
                const errorData = await guestResponse.json();
                throw new Error(`Guest registration failed: ${errorData.error || guestResponse.status}`);
            }
            
            const guestData = await guestResponse.json();
            const newClient = {
                accessToken: guestData.access_token,
                userId: guestData.user_id,
                deviceId: guestData.device_id,
                type: 'guest'
            };
            
            setClient(newClient);
            setSessionState('guest');
            await joinRoomAndStartSync(newClient);
            
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Guest setup failed:', err);
                setError(err.message);
                setSessionState('error');
            }
        }
    };

    const joinRoomAndStartSync = async (clientData) => {
        try {
            // Join room
            const joinResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/join/${encodeURIComponent(ROOM_ALIAS)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${clientData.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });

            if (!joinResponse.ok && joinResponse.status !== 403) {
                console.warn('Room join failed, but continuing...');
            }

            // Start message sync
            await fetchMessages(clientData);
            startMessageSync(clientData);
            
        } catch (err) {
            console.error('Room join/sync failed:', err);
        }
    };

    const fetchMessages = async (clientData) => {
        try {
            const response = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/messages?dir=b&limit=20`, {
                headers: { 'Authorization': `Bearer ${clientData.accessToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                const matrixMessages = data.chunk
                    .filter(event => event.type === 'm.room.message' && event.content?.body)
                    .map(event => ({
                        id: event.event_id,
                        sender: event.sender.split(':')[0].substring(1),
                        body: event.content.body,
                        timestamp: event.origin_server_ts,
                        isOwn: event.sender === clientData.userId
                    }))
                    .reverse();

                setMessages(matrixMessages);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const startMessageSync = (clientData) => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }
        
        syncIntervalRef.current = setInterval(() => {
            fetchMessages(clientData);
        }, 5000);
    };

    const openElementClient = () => {
        const baseUrl = sessionState === 'authenticated' 
            ? 'https://app.element.io/#/room/'
            : 'https://app.element.io/#/login';
            
        const url = sessionState === 'authenticated' 
            ? `${baseUrl}${encodeURIComponent(ROOM_ALIAS)}`
            : baseUrl;
            
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            window.open(url, '_blank');
        } else {
            popupRef.current = window.open(url, 'element', 'width=1000,height=700,scrollbars=yes,resizable=yes');
            
            // Monitor popup closure to check for auth changes
            const checkClosed = setInterval(() => {
                if (popupRef.current?.closed) {
                    clearInterval(checkClosed);
                    setTimeout(() => {
                        initializeConnection();
                    }, 2000);
                }
            }, 1000);
        }
    };

    const getStatusDisplay = () => {
        switch (sessionState) {
            case 'initializing':
            case 'connecting':
                return { dot: 'bg-yellow-500', text: 'Connecting...' };
            case 'guest':
                return { dot: 'bg-blue-500', text: 'Guest Access' };
            case 'authenticated':
                return { dot: 'bg-green-500', text: 'Connected' };
            case 'error':
                return { dot: 'bg-red-500', text: 'Connection Error' };
            default:
                return { dot: 'bg-gray-500', text: 'Unknown' };
        }
    };

    const status = getStatusDisplay();
    const displayName = client?.userId?.split(':')[0]?.substring(1) || 'Anonymous';

    if (sessionState === 'initializing' || sessionState === 'connecting') {
        return (
            <div className="flex flex-col h-full bg-[#0e0e10] text-white">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <div className="text-gray-400 text-sm">Connecting to chat...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            {/* Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold flex items-center">
                        LIVE CHAT 
                        <span className={`ml-2 w-2 h-2 rounded-full ${status.dot}`} title={status.text}></span>
                    </h3>
                    <div className="text-xs text-gray-400">
                        {messages.length} msgs
                    </div>
                </div>
                
                {sessionState === 'guest' && (
                    <div className="mt-1 text-xs text-blue-400">
                        Viewing as guest
                    </div>
                )}
                
                {sessionState === 'authenticated' && (
                    <div className="mt-1 text-xs text-green-400">
                        Signed in as {displayName}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {error && (
                    <div className="text-center text-red-400 text-sm p-4">
                        <div className="mb-2">Connection failed</div>
                        <button 
                            onClick={initializeConnection}
                            className="text-xs underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}
                
                {!error && messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        No recent messages
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div key={msg.id} className="text-sm leading-tight">
                        <span className={`font-bold ${msg.isOwn ? 'text-blue-400' : 'text-[#9147ff]'}`}>
                            {msg.sender}
                        </span>
                        <span className="text-white">: {msg.body}</span>
                    </div>
                ))}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b]">
                <div className="text-center space-y-2">
                    {sessionState === 'error' ? (
                        <button 
                            onClick={initializeConnection}
                            className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
                        >
                            Retry Connection
                        </button>
                    ) : sessionState === 'guest' ? (
                        <>
                            <div className="text-xs text-gray-400 mb-2">
                                Sign in to participate in chat
                            </div>
                            <button 
                                onClick={openElementClient}
                                className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded text-sm transition-colors"
                            >
                                Sign In / Create Account
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={openElementClient}
                            className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded text-sm transition-colors"
                        >
                            Open Chat Client
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
