"use client";

import { createClient, EventType } from "matrix-js-sdk";
import { useState, useEffect, useRef } from 'react';

export default function MatrixTwitchChat() {
  const [messages, setMessages] = useState([]);
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const matrixClient = createClient({
          baseUrl: "https://matrix.kidnotkin.io",
          useAuthorizationHeader: false,
        });

        // Register guest user
        const guestCreds = await matrixClient.registerGuest();
        matrixClient.setCredentials(guestCreds);
        
        await matrixClient.startClient();
        
        // Join your live chat room
        await matrixClient.joinRoom("!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io");

        // Listen for new messages
        matrixClient.on("Room.timeline", (event, room) => {
          if (event.getType() === EventType.RoomMessage) {
            const message = {
              id: event.getId(),
              user: event.getSender().split(':')[0].substring(1),
              text: event.getContent().body,
              timestamp: event.getTs()
            };
            
            setMessages(prev => [...prev.slice(-99), message]);
          }
        });

        setClient(matrixClient);
        setIsConnecting(false);
      } catch (error) {
        console.error("Matrix connection failed:", error);
        setIsConnecting(false);
      }
    };

    initClient();

    return () => {
      client?.stopClient();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white">
        <div>Connecting to chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
      <div className="p-2 bg-[#18181b] border-b border-gray-700">
        <h3 className="text-white font-semibold">STREAM CHAT</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {messages.map((msg) => (
          <div key={msg.id} className="leading-tight">
            <span className="text-[#9147ff] font-bold">{msg.user}</span>
            <span className="text-white">: {msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-gray-700 bg-[#18181b]">
        <div className="text-xs text-gray-400 text-center">
          <a href="https://cinny.kidnotkin.io" target="_blank" className="text-[#9147ff] hover:underline">
            Join chat to participate →
          </a>
        </div>
      </div>
    </div>
  );
}
