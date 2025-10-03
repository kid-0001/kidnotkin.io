"use client";

import { useState, useEffect } from 'react';

export default function MatrixConnectionTest() {
    const [status, setStatus] = useState('Starting...');
    const [log, setLog] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLog(prev => [...prev, `${new Date().toTimeString()}: ${message}`]);
    };

    useEffect(() => {
        async function testConnection() {
            try {
                addLog('Step 1: Testing guest registration...');
                setStatus('Testing guest registration...');
                
                const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}'
                });
                
                if (!response.ok) {
                    throw new Error(`Guest registration failed: ${response.status} ${response.statusText}`);
                }
                
                const guestData = await response.json();
                addLog(`Step 1 SUCCESS: Guest user ${guestData.user_id}`);
                
                addLog('Step 2: Loading Matrix SDK...');
                setStatus('Loading Matrix SDK...');
                
                const { createClient } = await import("matrix-js-sdk");
                addLog('Step 2 SUCCESS: Matrix SDK loaded');
                
                addLog('Step 3: Creating Matrix client...');
                const client = createClient({
                    baseUrl: "https://matrix.kidnotkin.io",
                    accessToken: guestData.access_token,
                    userId: guestData.user_id,
                });
                
                addLog('Step 3 SUCCESS: Client created');
                addLog('Step 4: Starting client...');
                setStatus('Starting Matrix client...');
                
                await client.startClient();
                addLog('Step 4 SUCCESS: Client started');
                
                setStatus('✅ Connected successfully!');
                addLog('ALL STEPS COMPLETED - Matrix connection working!');
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                addLog(`❌ ERROR: ${errorMessage}`);
                setStatus(`❌ Failed: ${errorMessage}`);
                console.error('Matrix connection error:', error);
            }
        }
        
        testConnection();
    }, []);

    return (
        <div className="p-4 bg-[#0e0e10] text-white text-xs">
            <h3 className="text-sm font-bold mb-2">Matrix Connection Debug</h3>
            <div className="mb-4">
                <strong>Status:</strong> {status}
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-900 p-2 rounded">
                {log.map((entry, i) => (
                    <div key={i} className="font-mono text-xs">
                        {entry}
                    </div>
                ))}
            </div>
        </div>
    );
}
