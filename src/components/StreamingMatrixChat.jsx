"use client";

import { useState, useEffect, useRef } from 'react';

export default function StreamingMatrixChat() {
    const [messages, setMessages] = useState([]);
    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const messagesEndRef = useRef(null);

    const roomId = "#live-chat:kidnotkin.io";

    useEffect(() => {
        // Check for stored authentication
        const stored = localStorage.getItem('matrix_credentials');
        if (stored) {
            const creds = JSON.parse(stored);
            initializeWithCredentials(creds);
        } else {
            // Try read-only guest access for viewing
            initializeReadOnlyAccess();
        }
    }, []);

    async function initializeReadOnlyAccess() {
        try {
            // Load Matrix SDK
            if (!window.matrixcs) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/matrix-js-sdk@latest/dist/browser-matrix.js';
                script.onload = () => setupReadOnlyClient();
                document.head.appendChild(script);
            } else {
                setupReadOnlyClient();
            }
        } catch (error) {
            console.error('Failed to load Matrix SDK:', error);
        }
    }

    async function setupReadOnlyClient() {
        try {
            // Guest access for read-only viewing
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

            await matrixClient.startClient({ initialSyncLimit: 20 });
            await matrixClient.joinRoom(roomId);

            // Listen for messages (read-only)
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
            setAuthenticated(false); // Read-only mode
            
        } catch (error) {
            console.error("Failed to connect for read-only access:", error);
        }
    }

    async function initializeWithCredentials(creds) {
        try {
            if (!window.matrixcs) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/matrix-js-sdk@latest/dist/browser-matrix.js';
                script.onload = () => loginWithCredentials(creds);
                document.head.appendChild(script);
            } else {
                loginWithCredentials(creds);
            }
        } catch (error) {
            console.error('Failed to load Matrix SDK:', error);
        }
    }

    async function loginWithCredentials(creds) {
        try {
            const matrixClient = window.matrixcs.createClient({
                baseUrl: "https://matrix.kidnotkin.io"
            });

            const loginResponse = await matrixClient.login("m.login.password", {
                identifier: {
                    type: "m.id.user",
                    user: creds.username
                },
                password: creds.password
            });

            await matrixClient.startClient({ initialSyncLimit: 20 });
            await matrixClient.joinRoom(roomId);

            // Listen for messages with full permissions
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
            setAuthenticated(true); // Can send messages
            
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError("Login failed - check credentials");
            localStorage.removeItem('matrix_credentials');
            // Fall back to read-only access
            initializeReadOnlyAccess();
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        
        try {
            const creds = {
                username: credentials.username,
                password: credentials.password,
                timestamp: Date.now()
            };
            
            localStorage.setItem('matrix_credentials', JSON.stringify(creds));
            await initializeWithCredentials(creds);
            setShowLogin(false);
        } catch (error) {
            setLoginError('Login failed');
        }
    };

    const sendMessage = async () => {
        if (client && authenticated) {
            const messageText = document.getElementById('message-input')?.value;
            if (messageText?.trim()) {
                try {
                    await client.sendTextMessage(roomId, messageText.trim());
                    document.getElementById('message-input').value = '';
                } catch (error) {
                    console.error("Failed to send message:", error);
                }
            }
        }
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700">
                <h3 className="text-sm font-semibold flex items-center">
                    LIVE CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {authenticated && <span className="ml-2 text-xs text-green-400">●</span>}
                </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {!connected && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        Connecting to chat...
                    </div>
                )}
                
                {connected && messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        {authenticated ? 'No recent messages. Say hello!' : 'Waiting for messages...'}
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

            {/* Input/Auth Area */}
            <div className="p-2 border-t border-gray-700 bg-[#18181b]">
                {authenticated ? (
                    // Logged in - can send messages
                    <div className="flex gap-2">
                        <input
                            id="message-input"
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    sendMessage();
                                }
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-[#9147ff] hover:bg-purple-600 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                            Send
                        </button>
                    </div>
                ) : (
                    // Not logged in - viewing only
                    <div className="text-center space-y-2">
                        {!showLogin ? (
                            <>
                                <div className="text-xs text-gray-400">Viewing chat • Account needed to participate</div>
                                <div className="flex gap-2 text-xs">
                                    <button 
                                        onClick={() => setShowLogin(true)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={() => window.open('https://app.element.io/#/register', '_blank')}
                                        className="flex-1 bg-[#9147ff] hover:bg-purple-600 px-3 py-1 rounded transition-colors"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Login form
                            <form onSubmit={handleLogin} className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                />
                                {loginError && <div className="text-red-400 text-xs">{loginError}</div>}
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">
                                        Login
                                    </button>
                                    <button type="button" onClick={() => setShowLogin(false)} className="flex-1 bg-gray-600 px-2 py-1 rounded text-xs">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
