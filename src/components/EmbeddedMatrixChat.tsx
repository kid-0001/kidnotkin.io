"use client";

import { createClient } from "matrix-js-sdk";
import { useState, useEffect, useRef } from 'react';

interface Message {
    id: string;
    user: string;
    text: string;
    timestamp: number;
}

interface GuestCredentials {
    access_token: string;
    user_id: string;
    device_id: string;
}

export default function EmbeddedMatrixChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [client, setClient] = useState<any>(null); // Simplified typing to avoid SDK type issues
    const [connected, setConnected] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [userCount, setUserCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const roomId = "!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io";

    useEffect(() => {
        initializeChat();
        
        return () => {
            if (client) {
                client.stopClient();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function initializeChat() {
        try {
            // Register guest user (verified working!)
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            const guestCreds: GuestCredentials = await response.json();
            
            // Create Matrix client
            const matrixClient = createClient({
                baseUrl: "https://matrix.kidnotkin.io",
                accessToken: guestCreds.access_token,
                userId: guestCreds.user_id,
                deviceId: guestCreds.device_id
            });

            await matrixClient.startClient({ initialSyncLimit: 20 });
            
            // Join the chat room
            await matrixClient.joinRoom(roomId);

            // Listen for new messages - simplified event handling
            matrixClient.on("Room.timeline" as any, (event: any, room: any) => {
                if (event.getType() === "m.room.message" && room.roomId === roomId) {
                    const content = event.getContent();
                    if (content && content.body) {
                        const message: Message = {
                            id: event.getId() || '',
                            user: event.getSender()?.split(':')[0].substring(1) || 'Unknown',
                            text: content.body,
                            timestamp: event.getTs() || Date.now()
                        };
                        
                        setMessages(prev => [...prev.slice(-99), message]); // Keep last 100
                    }
                }
            });

            // Listen for user count changes
            matrixClient.on("RoomState.events" as any, (event: any) => {
                if (event.getType() === "m.room.member") {
                    const room = matrixClient.getRoom(roomId);
                    if (room) {
                        setUserCount(room.getJoinedMemberCount());
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

    // Auto-scroll to bottom
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

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center">
                    STREAM CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
                {userCount > 0 && (
                    <span className="text-xs text-gray-400">
                        {userCount} viewers
                    </span>
                )}
            </div>

            {/* Messages Area - Twitch Style */}
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

            {/* Input Area */}
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
                        <a href="https://cinny.kidnotkin.io" target="_blank" className="text-[#9147ff] hover:underline">
                            Connection failed - Open full client →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
