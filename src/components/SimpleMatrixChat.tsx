"use client";

import { createClient, EventType } from "matrix-js-sdk";
import { useState, useEffect, useRef } from 'react';

export default function SimpleMatrixChat() {
    const [messages, setMessages] = useState([]);
    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        initializeChat();
    }, []);

    async function initializeChat() {
        try {
            // Register guest user (we verified this works!)
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            const guestCreds = await response.json();
            
            // Create Matrix client with guest credentials
            const matrixClient = createClient({
                baseUrl: "https://matrix.kidnotkin.io",
                accessToken: guestCreds.access_token,
                userId: guestCreds.user_id,
                deviceId: guestCreds.device_id
            });

            await matrixClient.startClient();
            
            // Join the main chat room
            await matrixClient.joinRoom("!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io");

            // Listen for new messages
            matrixClient.on("Room.timeline", (event, room) => {
                if (event.getType() === "m.room.message" && 
                    room.roomId === "!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io") {
                    
                    const message = {
                        id: event.getId(),
                        user: event.getSender().split(':')[0].substring(1), // Clean username
                        text: event.getContent().body,
                        timestamp: event.getTs()
                    };
                    
                    setMessages(prev => [...prev.slice(-49), message]); // Keep last 50 messages
                }
            });

            setClient(matrixClient);
            setConnected(true);
            
        } catch (error) {
            console.error("Matrix connection failed:", error);
            setConnected(false);
        }
    }

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (client && newMessage.trim()) {
            try {
                await client.sendTextMessage(
                    "!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io",
                    newMessage.trim()
                );
                setNewMessage('');
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white">
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700">
                <h3 className="text-sm font-semibold flex items-center">
                    STREAM CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
            </div>

            {/* Messages Area */}
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
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            maxLength={500}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-[#9147ff] hover:bg-purple-600 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                            Send
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-center text-gray-400">
                        <a href="https://cinny.kidnotkin.io" target="_blank" className="text-[#9147ff] hover:underline">
                            Full chat client →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
