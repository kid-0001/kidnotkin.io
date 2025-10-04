"use client";

import { useState, useEffect, useRef } from 'react';

export default function MatrixLiveChat() {
    const [messages, setMessages] = useState([]);
    const [loadingState, setLoadingState] = useState('initializing'); // 'initializing', 'loading', 'loaded', 'error', 'iframe-fallback'
    const [error, setError] = useState(null);
    
    const messagesEndRef = useRef(null);
    const clientRef = useRef(null);
    const iframeRef = useRef(null);

    const MATRIX_BASE_URL = 'https://matrix.kidnotkin.io';
    const ROOM_ID = '!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io';
    const ROOM_ALIAS = '#live-chat:kidnotkin.io';

    useEffect(() => {
        initializeMatrix();
        return cleanup;
    }, []);

    const cleanup = () => {
        if (clientRef.current?.interval) {
            clearInterval(clientRef.current.interval);
        }
    };

    const initializeMatrix = async () => {
        setLoadingState('loading');
        
        try {
            console.log('Testing Matrix server connectivity...');
            
            // Test server connectivity
            const versionsResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/versions`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!versionsResponse.ok) {
                throw new Error(`Matrix server returned ${versionsResponse.status}: ${versionsResponse.statusText}`);
            }
            
            const versionsData = await versionsResponse.json();
            console.log('Matrix server versions:', versionsData.versions);

            // Test guest registration
            console.log('Attempting guest registration...');
            const guestResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/register?kind=guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!guestResponse.ok) {
                const errorText = await guestResponse.text();
                console.error('Guest registration failed:', guestResponse.status, errorText);
                
                // Try iframe fallback if guest registration fails
                console.log('Falling back to iframe embedding...');
                setLoadingState('iframe-fallback');
                return;
            }

            const guestData = await guestResponse.json();
            console.log('Guest registered successfully:', guestData.user_id);

            clientRef.current = {
                accessToken: guestData.access_token,
                userId: guestData.user_id
            };

            // Test room access
            await testRoomAccess();
            
            // Start message fetching
            await fetchMessages();
            startPolling();
            
            setLoadingState('loaded');

        } catch (err) {
            console.error('Matrix initialization failed:', err);
            setError(err.message);
            
            // Fallback to iframe if API fails
            console.log('Falling back to iframe embedding due to error...');
            setLoadingState('iframe-fallback');
        }
    };

    const testRoomAccess = async () => {
        if (!clientRef.current) return;

        try {
            // Try to join the room
            console.log('Attempting to join room...');
            const joinResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/join/${encodeURIComponent(ROOM_ALIAS)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${clientRef.current.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (joinResponse.ok) {
                console.log('Successfully joined room');
            } else {
                const errorText = await joinResponse.text();
                console.log('Room join failed (continuing anyway):', joinResponse.status, errorText);
            }

        } catch (err) {
            console.log('Room join error (continuing):', err.message);
        }
    };

    const fetchMessages = async () => {
        if (!clientRef.current) return;

        try {
            console.log('Fetching messages...');
            const response = await fetch(
                `${MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/messages?dir=b&limit=15`,
                {
                    headers: {
                        'Authorization': `Bearer ${clientRef.current.accessToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('Raw messages response:', data);
                
                const newMessages = data.chunk
                    ?.filter(event => event.type === 'm.room.message' && event.content?.body)
                    ?.map(event => ({
                        id: event.event_id,
                        sender: event.sender.split(':')[0].substring(1),
                        body: event.content.body,
                        timestamp: event.origin_server_ts
                    }))
                    ?.reverse() || [];

                console.log('Processed messages:', newMessages);
                setMessages(newMessages);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch messages:', response.status, errorText);
            }
        } catch (err) {
            console.error('Message fetch error:', err);
        }
    };

    const startPolling = () => {
        if (clientRef.current?.interval) {
            clearInterval(clientRef.current.interval);
        }
        
        clientRef.current.interval = setInterval(() => {
            fetchMessages();
        }, 10000); // Poll every 10 seconds
    };

    const openElementRoom = () => {
        const url = `https://app.element.io/#/room/${encodeURIComponent(ROOM_ALIAS)}`;
        window.open(url, '_blank');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Loading state
    if (loadingState === 'initializing' || loadingState === 'loading') {
        return (
            <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white p-4">
                <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-400">
                        {loadingState === 'initializing' ? 'Initializing...' : 'Connecting to Matrix...'}
                    </div>
                </div>
            </div>
        );
    }

    // Iframe fallback
    if (loadingState === 'iframe-fallback') {
        return (
            <div className="h-full bg-[#0e0e10]">
                <div className="p-2 bg-[#18181b] border-b border-gray-700 text-center">
                    <div className="text-xs text-yellow-400">Loading Element Chat...</div>
                </div>
                <iframe
                    ref={iframeRef}
                    src={`https://app.element.io/#/room/${encodeURIComponent(ROOM_ALIAS)}`}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox"
                    onLoad={() => {
                        console.log('Element iframe loaded');
                    }}
                    onError={(e) => {
                        console.error('Element iframe failed to load:', e);
                    }}
                />
            </div>
        );
    }

    // API-based chat view
    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white">
            {/* Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">LIVE CHAT</h3>
                    <div className="text-xs text-gray-400">
                        {messages.length} msgs {clientRef.current?.userId && `• ${clientRef.current.userId.split(':')[0].substring(1)}`}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {error && (
                    <div className="text-center text-red-400 text-sm p-4">
                        <div className="mb-2">Connection Error</div>
                        <div className="text-xs text-gray-400 mb-3">{error}</div>
                        <button 
                            onClick={initializeMatrix}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!error && messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        <div className="mb-2">💬</div>
                        <div>No recent messages</div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                        <span className="font-bold text-[#9147ff]">{msg.sender}</span>
                        <span className="text-gray-300">: </span>
                        <span className="text-white">{msg.body}</span>
                    </div>
                ))}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Join Button */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b] flex-shrink-0">
                <button 
                    onClick={openElementRoom}
                    className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    Join Chat
                </button>
            </div>
        </div>
    );
}
