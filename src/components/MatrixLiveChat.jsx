"use client";

import { useState, useEffect, useRef } from 'react';

export default function MatrixLiveChat() {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);
    const [client, setClient] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [userType, setUserType] = useState('guest');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    const messagesEndRef = useRef(null);
    const intervalRef = useRef(null);

    const MATRIX_BASE_URL = 'https://matrix.kidnotkin.io';
    const ROOM_ALIAS = '#chatroom:kidnotkin.io';
    const ROOM_ID = '!V5tqxDzedaH1raG7qTMVwVpkjxeUfvghiMWECXCx1w8';

    useEffect(() => {
        initializeMatrix();
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeMatrix = async () => {
        try {
            setStatus('connecting');
            setError(null);

            // Try multiple methods to find existing session
            let sessionClient = await findExistingSession();
            
            if (sessionClient) {
                console.log('Found existing session:', sessionClient.userId);
                setClient(sessionClient);
                setUserType('authenticated');
            } else {
                // Fallback to guest
                sessionClient = await registerGuest();
                setClient(sessionClient);
                setUserType('guest');
                setShowLoginPrompt(true);
            }

            await joinRoom(sessionClient);
            await fetchMessages(sessionClient);
            
            setStatus('connected');
            startPolling(sessionClient);

        } catch (err) {
            console.error('Matrix initialization failed:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    const findExistingSession = async () => {
        // Check multiple possible Element localStorage keys
        const possibleKeys = [
            'mx_access_token',
            `mx_access_token_${MATRIX_BASE_URL}`,
            'mx_access_token_https://matrix.kidnotkin.io',
            '@riot-web/access-token',
            'mx_user_id',
            'mx_device_id'
        ];

        const sessionData = {};
        
        // Collect all possible session data
        for (const key of possibleKeys) {
            const value = localStorage.getItem(key);
            if (value) {
                console.log('Found localStorage key:', key, '=', value.substring(0, 20) + '...');
                if (key.includes('access_token')) {
                    sessionData.accessToken = value;
                }
                if (key.includes('user_id')) {
                    sessionData.userId = value;
                }
            }
        }

        // Try to find token/user ID pairs
        if (!sessionData.accessToken || !sessionData.userId) {
            // Look for any token-like strings
            for (const [key, value] of Object.entries(localStorage)) {
                if (key.toLowerCase().includes('token') && value.length > 50) {
                    console.log('Potential token found:', key);
                    sessionData.accessToken = sessionData.accessToken || value;
                }
                if (key.toLowerCase().includes('user') && value.startsWith('@')) {
                    console.log('Potential user ID found:', key, value);
                    sessionData.userId = sessionData.userId || value;
                }
            }
        }

        // Test the session if we have a token
        if (sessionData.accessToken) {
            return await validateSession(sessionData.accessToken, sessionData.userId);
        }

        return null;
    };

    const validateSession = async (token, userId) => {
        try {
            console.log('Validating session with token:', token.substring(0, 20) + '...');
            
            const response = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/account/whoami`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Session validation successful:', data);
                
                return {
                    accessToken: token,
                    userId: data.user_id || userId,
                    type: 'authenticated'
                };
            } else {
                console.log('Session validation failed:', response.status);
                return null;
            }
        } catch (err) {
            console.error('Session validation error:', err);
            return null;
        }
    };

    const manualLogin = async () => {
        try {
            // Prompt user for their access token
            const tokenPrompt = `To connect your existing Matrix account:
1. Go to Element settings
2. Find "Access Token" in Advanced settings
3. Copy and paste it here:`;
            
            const token = prompt(tokenPrompt);
            if (!token || token.length < 10) {
                return;
            }

            const validatedSession = await validateSession(token);
            if (validatedSession) {
                // Store for future use
                localStorage.setItem('kidnotkin_matrix_token', token);
                localStorage.setItem('kidnotkin_matrix_user', validatedSession.userId);
                
                setClient(validatedSession);
                setUserType('authenticated');
                setShowLoginPrompt(false);
                
                await joinRoom(validatedSession);
                await fetchMessages(validatedSession);
                startPolling(validatedSession);
                
                alert(`Successfully connected as ${validatedSession.userId}!`);
            } else {
                alert('Invalid access token. Please check and try again.');
            }
        } catch (err) {
            alert(`Login failed: ${err.message}`);
        }
    };

    const registerGuest = async () => {
        const response = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/register?kind=guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Guest registration failed: ${errorData.error || response.status}`);
        }

        const guestData = await response.json();
        return {
            accessToken: guestData.access_token,
            userId: guestData.user_id,
            type: 'guest'
        };
    };

    const joinRoom = async (clientData) => {
        if (!clientData) return;

        try {
            const joinResponse = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/join/${encodeURIComponent(ROOM_ALIAS)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${clientData.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });

            if (joinResponse.ok) {
                console.log('Successfully joined chatroom');
            }
        } catch (err) {
            console.warn('Room join error:', err);
        }
    };

    const fetchMessages = async (clientData) => {
        if (!clientData) return;

        try {
            const response = await fetch(
                `${MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/messages?dir=b&limit=25`,
                {
                    headers: { 'Authorization': `Bearer ${clientData.accessToken}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const newMessages = data.chunk
                    ?.filter(event => event.type === 'm.room.message' && event.content?.body)
                    ?.map(event => ({
                        id: event.event_id,
                        sender: event.sender.split(':')[0].substring(1),
                        body: event.content.body,
                        timestamp: event.origin_server_ts,
                        isOwn: event.sender === clientData.userId
                    }))
                    ?.reverse() || [];

                setMessages(newMessages);
            }
        } catch (err) {
            console.error('Message fetch error:', err);
        }
    };

    const sendMessage = async () => {
        if (!messageText.trim() || !client || sending) return;

        setSending(true);
        try {
            const response = await fetch(
                `${MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/send/m.room.message`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${client.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        msgtype: 'm.text',
                        body: messageText.trim()
                    })
                }
            );

            if (response.ok) {
                setMessageText('');
                await fetchMessages(client);
            } else {
                const errorData = await response.json();
                setError(`Send failed: ${errorData.error || 'Permission denied'}`);
            }
        } catch (err) {
            setError(`Send error: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const startPolling = (clientData) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            fetchMessages(clientData);
        }, 5000);
    };

    const openElementRoom = () => {
        window.open(`https://app.element.io/#/room/${encodeURIComponent(ROOM_ALIAS)}`, '_blank');
    };

    if (status === 'connecting') {
        return (
            <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white p-4">
                <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-400">Detecting Matrix session...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white">
            {/* Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">LIVE CHAT</h3>
                    <div className="text-xs text-gray-400">{messages.length}</div>
                </div>
                <div className="text-xs mt-1 flex justify-between items-center">
                    <span className={userType === 'authenticated' ? 'text-green-400' : 'text-blue-400'}>
                        {userType === 'authenticated' ? '✓ Logged In' : '👁️ Guest'}
                        {client && ` • ${client.userId.split(':')[0].substring(1)}`}
                    </span>
                    <div className="flex space-x-2">
                        {userType === 'guest' && (
                            <button 
                                onClick={manualLogin}
                                className="text-green-400 hover:text-green-300 text-xs underline"
                            >
                                Connect Account
                            </button>
                        )}
                        <button 
                            onClick={openElementRoom}
                            className="text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                            Element
                        </button>
                    </div>
                </div>
            </div>

            {/* Login Prompt */}
            {showLoginPrompt && userType === 'guest' && (
                <div className="p-2 bg-yellow-900/50 border-b border-yellow-600/50 text-yellow-200 text-xs text-center">
                    Already have a Matrix account? 
                    <button 
                        onClick={manualLogin}
                        className="ml-1 underline hover:no-underline"
                    >
                        Connect it here
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                        <div className="mb-2">💬</div>
                        <div>No recent messages</div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                            <span className={`font-bold ${msg.isOwn ? 'text-blue-400' : 'text-[#9147ff]'}`}>
                                {msg.sender}
                            </span>
                            <span className="text-gray-300">: </span>
                            <span className="text-white">{msg.body}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b] flex-shrink-0">
                {error && (
                    <div className="text-red-400 text-xs mb-2 text-center">
                        {error}
                    </div>
                )}
                
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={userType === 'authenticated' ? 'Send a message...' : 'Send message (guest mode)...'}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        disabled={sending}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!messageText.trim() || sending}
                        className="bg-[#9147ff] hover:bg-purple-600 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        {sending ? '⏳' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
