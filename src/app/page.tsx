"use client";

import { useState } from 'react';
import MatrixConnectionTest from '../components/MatrixConnectionTest';

export default function StreamingPage() {
    const [chatVisible, setChatVisible] = useState(true);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-blue-400">kidnotkin.io - Debug Mode</h1>
            </header>
            
            <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
                
                <div className="flex-1 p-4 lg:pr-2">
                    <div className="relative w-full h-full bg-black rounded overflow-hidden" style={{ minHeight: '40vh' }}>
                        <iframe
                            src="https://stream.place/embed/kidnotkin.bsky.social"
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                            style={{ minHeight: '400px' }}
                        />
                    </div>
                </div>
                
                <div className="lg:w-80 lg:flex-shrink-0 flex flex-col border-l border-gray-700">
                    <MatrixConnectionTest />
                </div>
            </div>
        </div>
    );
}
