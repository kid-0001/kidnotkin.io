"use client";

import { useState, useEffect, useRef } from 'react';

export default function MatrixLiveChat() {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);
    const [client, setClient] = useState(null);
    
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

    const initializeMatrix = async () => {
        try {
            setStatus('connecting');
            setError(null);

            // Register guest user
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
            const newClient = {
                accessToken: guestData.access_token,
                userId: guestData.user_id
            };

            setClient(newClient);
            console.log('Guest registered:', guestData.user_id);

            // Join the chatroom
            await joinRoom(newClient);
            
            // Fetch messages
            await fetchMessages(newClient);
            
            setStatus('connected');
            
            // Start polling
            startPolling(newClient);

        } catch (err) {
            console.error('Matrix initialization failed:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    const joinRoom = async (clientData) => {
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
                console.warn('Room join failed:', errorData);
                // Don't throw - try to fetch messages anyway
            }
        } catch (err) {
            console.warn('Room join error:', err);
        }
    };

    const fetchMessages = async (clientData) => {
        if (!clientData) return;

        try {
            const response = await fetch(
                `${MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/messages?dir=b&limit=20`,
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
                        timestamp: event.origin_server_ts
                    }))
                    ?.reverse() || [];

                setMessages(newMessages);
                console.log('Fetched messages from chatroom:', newMessages.length);
            } else {
                const errorData = await response.json();
                console.error('Message fetch failed:', response.status, errorData);
                
                if (response.status === 403) {
                    setError('Room access denied. Trying different approach...');
                }
            }
        } catch (err) {
            console.error('Message fetch error:', err);
        }
    };

    const startPolling = (clientData) => {
        intervalRef.current = setInterval(() => {
            fetchMessages(clientData);
        }, 10000);
    };

    const openElementRoom = () => {
        window.open(`https://app.element.io/#/room/${encodeURIComponent(ROOM_ALIAS)}`, '_blank');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                    <h3 className="text-sm font-semibold">CHAT</h3>
                    <span className="text-xs text-gray-400">{messages.length}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    {ROOM_ALIAS}
                    {client && ` • ${client.userId.split(':')[0].substring(1)}`}
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
                        <div className="text-xs mt-2">Be the first to chat!</div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                            <span className="font-bold text-[#9147ff]">{msg.sender}</span>
                            <span className="text-gray-300">: </span>
                            <span className="text-white">{msg.body}</span>
                        </div>
                    ))
                )}
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
