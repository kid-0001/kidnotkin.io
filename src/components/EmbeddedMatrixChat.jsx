"use client";

import { useState, useEffect, useRef } from 'react';

export default function EmbeddedMatrixChat() {
    const [messages, setMessages] = useState([]);
    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const messagesEndRef = useRef(null);

    const roomId = "!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io";

    useEffect(() => {
        loadMatrixSDK();
    }, []);

    async function loadMatrixSDK() {
        try {
            // Load Matrix SDK from CDN
            if (!window.matrixcs) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/matrix-js-sdk@latest/dist/browser-matrix.js';
                script.onload = () => {
                    setSdkLoaded(true);
                    initializeChat();
                };
                script.onerror = () => {
                    console.error('Failed to load Matrix SDK from CDN');
                };
                document.head.appendChild(script);
            } else {
                setSdkLoaded(true);
                initializeChat();
            }
        } catch (error) {
            console.error('SDK loading error:', error);
        }
    }

    async function initializeChat() {
        try {
            // Register guest user
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            const guestCreds = await response.json();
            
            // Create Matrix client using CDN version
            const matrixClient = window.matrixcs.createClient({
                baseUrl: "https://matrix.kidnotkin.io",
                accessToken: guestCreds.access_token,
                userId: guestCreds.user_id,
                deviceId: guestCreds.device_id
            });

            await matrixClient.startClient({ initialSyncLimit: 20 });
            await matrixClient.joinRoom(roomId);

            // Listen for messages
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

    const sendMessage = async () => {
        if (client && newMessage.trim()) {
            try {
                await client.sendTextMessage(roomId, newMessage.trim());
                setNewMessage('');
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!sdkLoaded) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white">
                <div className="text-center">
                    <div className="text-sm text-gray-400">Loading Matrix SDK...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center">
                    STREAM CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {!connected && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        Connecting to chat...
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

            <div className="p-2 border-t border-gray-700 bg-[#18181b]">
                {connected ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-400"
                            maxLength={500}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-[#9147ff] hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                            Send
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-center text-gray-400">
                        <a href="https://app.element.io/#/room/!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:matrix.kidnotkin.io" target="_blank" className="text-[#9147ff] hover:underline">
                            Open in Element →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
