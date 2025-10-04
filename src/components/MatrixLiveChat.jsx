"use client";

import { useState, useEffect, useRef } from 'react';

export default function MatrixLiveChat() {
    const [messages, setMessages] = useState([]);
    const [connectionState, setConnectionState] = useState('connecting');
    const [client, setClient] = useState(null);
    
    const messagesEndRef = useRef(null);
    const syncIntervalRef = useRef(null);

    const MATRIX_BASE_URL = 'https://matrix.kidnotkin.io';
    const ROOM_ID = '!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io';
    const ROOM_ALIAS = '#live-chat:kidnotkin.io';

    useEffect(() => {
        initializeChat();
        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeChat = async () => {
        try {
            // Register as guest
            const response = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/register?kind=guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            if (!response.ok) throw new Error('Connection failed');
            
            const data = await response.json();
            const guestClient = {
                accessToken: data.access_token,
                userId: data.user_id
            };
            
            setClient(guestClient);
            setConnectionState('connected');
            
            // Join room and start syncing
            await joinRoom(guestClient);
            await fetchMessages(guestClient);
            startSync(guestClient);
            
        } catch (error) {
            setConnectionState('error');
        }
    };

    const joinRoom = async (client) => {
        try {
            await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/join/${encodeURIComponent(ROOM_ALIAS)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${client.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });
        } catch (error) {
            // Continue even if join fails
        }
    };

    const fetchMessages = async (client) => {
        try {
            const response = await fetch(`${MATRIX_BASE_URL}/_matrix/client/v3/rooms/${encodeURIComponent(ROOM_ID)}/messages?dir=b&limit=15`, {
                headers: { 'Authorization': `Bearer ${client.accessToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                const newMessages = data.chunk
                    .filter(event => event.type === 'm.room.message' && event.content?.body)
                    .map(event => ({
                        id: event.event_id,
                        sender: event.sender.split(':')[0].substring(1),
                        body: event.content.body
                    }))
                    .reverse();

                setMessages(newMessages);
            }
        } catch (error) {
            // Silent fail
        }
    };

    const startSync = (client) => {
        syncIntervalRef.current = setInterval(() => {
            fetchMessages(client);
        }, 5000);
    };

    const openElementRoom = () => {
        window.open(`https://app.element.io/#/room/${encodeURIComponent(ROOM_ALIAS)}`, '_blank');
    };

    if (connectionState === 'connecting') {
        return (
            <div className="flex flex-col h-full bg-[#0e0e10] text-white">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <div className="text-gray-400 text-sm">Connecting...</div>
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
                    <h3 className="text-sm font-semibold">LIVE CHAT</h3>
                    <div className="text-xs text-gray-400">{messages.length} msgs</div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {connectionState === 'error' ? (
                    <div className="text-center text-red-400 text-sm p-4">
                        <div>Connection failed</div>
                        <button 
                            onClick={initializeChat}
                            className="text-xs underline hover:no-underline mt-2"
                        >
                            Retry
                        </button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm p-4">
                        No recent messages
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="text-sm leading-tight">
                            <span className="font-bold text-[#9147ff]">{msg.sender}</span>
                            <span className="text-white">: {msg.body}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Join Button */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b]">
                <button 
                    onClick={openElementRoom}
                    className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded text-sm transition-colors"
                >
                    Join Chat
                </button>
            </div>
        </div>
    );
}
