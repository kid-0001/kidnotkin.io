"use client";

import { useState, useEffect, useRef } from 'react';

export default function MatrixLiveChat() {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);
    const [client, setClient] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [userType, setUserType] = useState('guest'); // 'guest', 'registered'
    
    const messagesEndRef = useRef(null);
    const intervalRef = useRef(null);
    const inputRef = useRef(null);

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

            // Try to get existing user session first
            const existingSession = checkExistingSession();
            if (existingSession) {
                setClient(existingSession);
                setUserType('registered');
                console.log('Using existing session:', existingSession.userId);
            } else {
                // Register guest user
                const guestClient = await registerGuest();
                setClient(guestClient);
                setUserType('guest');
            }

            // Join room and fetch messages
            await joinRoom(client || existingSession);
            await fetchMessages(client || existingSession);
            
            setStatus('connected');
            startPolling(client || existingSession);

        } catch (err) {
            console.error('Matrix initialization failed:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    const checkExistingSession = () => {
        // Check for existing Matrix session in localStorage
        const token = localStorage.getItem('mx_access_token') || 
                     localStorage.getItem('mx_access_token_https://matrix.kidnotkin.io');
        const userId = localStorage.getItem('mx_user_id') || 
                      localStorage.getItem('mx_user_id_https://matrix.kidnotkin.io');
        
        if (token && userId) {
            return { accessToken: token, userId, type: 'registered' };
        }
        return null;
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
        console.log('Guest registered:', guestData.user_id);
        
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
            } else {
                const errorData = await joinResponse.json();
                console.warn('Room join failed but continuing:', errorData);
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
            } else {
                const errorData = await response.json();
                console.error('Message fetch failed:', errorData);
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
                // Fetch messages to show the new message
                await fetchMessages(client);
            } else {
                const errorData = await response.json();
                if (errorData.errcode === 'M_FORBIDDEN') {
                    setError('Message sending not allowed. Try creating an account.');
                } else {
                    setError(`Send failed: ${errorData.error || 'Unknown error'}`);
                }
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
        intervalRef.current = setInterval(() => {
            fetchMessages(clientData);
        }, 5000);
    };

    const openElementRoom = () => {
        window.open(`https://app.element.io/#/room/${encodeURIComponent(ROOM_ALIAS)}`, '_blank');
    };

    const promptRegistration = () => {
        window.open('https://app.element.io/#/register', '_blank');
    };

    if (status === 'connecting') {
        return (
            <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white p-4">
                <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-400">Connecting to chat...</div>
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
                <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                    <span>
                        {userType === 'guest' ? '👁️ Viewing' : '✓ Connected'}
                        {client && ` • ${client.userId.split(':')[0].substring(1)}`}
                    </span>
                    <button 
                        onClick={openElementRoom}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                        Open Element
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {status === 'error' ? (
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
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                        <div className="mb-2">💬</div>
                        <div>No recent messages</div>
                        <div className="text-xs mt-2">Start the conversation!</div>
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
                        {error.includes('not allowed') && (
                            <button 
                                onClick={promptRegistration}
                                className="ml-2 text-blue-400 hover:text-blue-300 underline"
                            >
                                Create Account
                            </button>
                        )}
                    </div>
                )}
                
                <div className="flex space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={userType === 'guest' ? 'Send a message (guest)...' : 'Send a message...'}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={sending}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!messageText.trim() || sending}
                        className="bg-[#9147ff] hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        {sending ? '⏳' : 'Send'}
                    </button>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 text-center">
                    {userType === 'guest' && 'Guest access • '}
                    Press Enter to send • Matrix-powered chat
                </div>
            </div>
        </div>
    );
}
