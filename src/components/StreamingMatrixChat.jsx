"use client";

import { useState, useEffect, useRef } from 'react';

export default function StreamingMatrixChat() {
    const [messages, setMessages] = useState([]);
    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const messagesEndRef = useRef(null);

    const roomId = "#live-chat:kidnotkin.io";

    useEffect(() => {
        loadMatrixSDK();
    }, []);

    async function loadMatrixSDK() {
        try {
            if (!window.matrixcs) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/matrix-js-sdk@latest/dist/browser-matrix.js';
                script.onload = () => initializeViewOnlyChat();
                document.head.appendChild(script);
            } else {
                initializeViewOnlyChat();
            }
        } catch (error) {
            console.error('SDK loading error:', error);
        }
    }

    async function initializeViewOnlyChat() {
        try {
            // Register guest for READ-ONLY access
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            const guestCreds = await response.json();
            
            const matrixClient = window.matrixcs.createClient({
                baseUrl: "https://matrix.kidnotkin.io",
                accessToken: guestCreds.access_token,
                userId: guestCreds.user_id
            });

            await matrixClient.startClient({ initialSyncLimit: 50 });
            
            // Join for viewing only
            await matrixClient.joinRoom(roomId);

            // Listen for new messages (READ-ONLY)
            matrixClient.on("Room.timeline", (event, room) => {
                if (event.getType() === "m.room.message" && room.roomId === roomId) {
                    const content = event.getContent();
                    if (content && content.body) {
                        const message = {
                            id: event.getId() || Date.now().toString(),
                            user: event.getSender()?.split(':')[0].substring(1) || 'Unknown',
                            text: content.body,
                            timestamp: event.getTs() || Date.now()
                        };
                        
                        setMessages(prev => [...prev.slice(-99), message]);
                    }
                }
            });

            // Get viewer count
            matrixClient.on("RoomState.events", (event) => {
                if (event.getType() === "m.room.member") {
                    const room = matrixClient.getRoom(roomId);
                    if (room) {
                        setViewerCount(room.getJoinedMemberCount());
                    }
                }
            });

            setClient(matrixClient);
            setConnected(true);
            
        } catch (error) {
            console.error("Matrix connection failed:", error);
            setConnected(false);
        }
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const openElementToJoin = () => {
        const elementUrl = "https://app.element.io/#/room/#live-chat:kidnotkin.io";
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            window.open(elementUrl, '_blank');
        } else {
            window.open(elementUrl, 'element', 'width=800,height=600');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center">
                    LIVE CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
                {viewerCount > 0 && (
                    <span className="text-xs text-gray-400">
                        {viewerCount} viewers
                    </span>
                )}
            </div>

            {/* Messages Area - READ-ONLY for viewers */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {!connected && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        Connecting to chat...
                    </div>
                )}
                
                {connected && messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        Chat will appear here when active
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

            {/* Join Prompt - Account Required for Messaging */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b]">
                <div className="text-center space-y-3">
                    <div className="text-xs text-gray-400">
                        Create account to join the discussion
                    </div>
                    <button 
                        onClick={openElementToJoin}
                        className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded font-medium transition-colors text-sm"
                    >
                        Join Chat (Create Account)
                    </button>
                    <div className="text-xs text-gray-500">
                        Free Matrix account • No phone required
                    </div>
                </div>
            </div>
        </div>
    );
}
