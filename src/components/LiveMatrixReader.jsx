"use client";

import { useState, useEffect, useRef } from 'react';

export default function LiveMatrixReader() {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        // Refresh messages every 10 seconds for live updates
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, []);

    async function fetchMessages() {
        try {
            // Get guest token for API access
            const guestResponse = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            const guestCreds = await guestResponse.json();
            
            // Join room and get recent messages
            const joinResponse = await fetch(`https://matrix.kidnotkin.io/_matrix/client/v3/join/%23live-chat%3Akidnotkin.io`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${guestCreds.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });

            if (joinResponse.ok) {
                // Fetch recent messages
                const messagesResponse = await fetch(`https://matrix.kidnotkin.io/_matrix/client/v3/rooms/${encodeURIComponent('#live-chat:kidnotkin.io')}/messages?dir=b&limit=20`, {
                    headers: {
                        'Authorization': `Bearer ${guestCreds.access_token}`
                    }
                });

                if (messagesResponse.ok) {
                    const data = await messagesResponse.json();
                    const matrixMessages = data.chunk.filter(event => 
                        event.type === 'm.room.message' && event.content?.body
                    ).map(event => ({
                        id: event.event_id,
                        user: event.sender.split(':')[0].substring(1),
                        text: event.content.body,
                        timestamp: event.origin_server_ts
                    })).reverse(); // Show in chronological order

                    setMessages(matrixMessages);
                    setConnected(true);
                }
            }
            
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }

    const openElementChat = () => {
        const elementUrl = "https://app.element.io/#/room/#live-chat:kidnotkin.io";
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            window.open(elementUrl, '_blank');
        } else {
            window.open(elementUrl, 'element', 'width=800,height=600,scrollbars=yes,resizable=yes');
        }
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white">
                <div className="text-sm text-gray-400">Loading chat...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center">
                    LIVE CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
                <div className="text-xs text-gray-400">
                    {messages.length} recent
                </div>
            </div>

            {/* Messages Area - REAL Matrix messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {!connected && !loading && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        Chat offline
                    </div>
                )}
                
                {connected && messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        No recent messages
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div key={msg.id} className="text-sm leading-tight">
                        <span className="text-[#9147ff] font-bold">{msg.user}</span>
                        <span className="text-white">: {msg.text}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Join to Participate */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b]">
                <div className="text-center space-y-3">
                    <div className="text-xs text-gray-400">
                        {connected ? 'Viewing live chat • Account needed to participate' : 'Chat currently offline'}
                    </div>
                    <button 
                        onClick={openElementChat}
                        className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded font-medium transition-colors text-sm"
                    >
                        Join Discussion
                    </button>
                    <div className="text-xs text-gray-500">
                        Opens Element • Free Matrix account • No phone required
                    </div>
                </div>
            </div>
        </div>
    );
}
