"use client";

import { useState, useEffect } from 'react';

export default function TestMatrixChat() {
    const [status, setStatus] = useState('Starting...');
    const [error, setError] = useState(null);

    useEffect(() => {
        testMatrixConnection();
    }, []);

    async function testMatrixConnection() {
        try {
            setStatus('Testing guest registration...');
            
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const guestCreds = await response.json();
            setStatus(`Guest registered: ${guestCreds.user_id}`);
            
            // Test Matrix SDK import
            const { createClient } = await import("matrix-js-sdk");
            setStatus('Matrix SDK loaded successfully!');
            
        } catch (error) {
            setError(error.message);
            setStatus('Connection failed');
        }
    }

    return (
        <div className="p-4 bg-[#0e0e10] text-white">
            <h3 className="text-sm font-bold mb-2">Matrix Connection Test</h3>
            <div className="text-xs space-y-2">
                <div>Status: {status}</div>
                {error && <div className="text-red-400">Error: {error}</div>}
            </div>
        </div>
    );
}
