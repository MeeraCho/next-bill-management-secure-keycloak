// src/pages/signin.tsx
'use client';
import { useState } from 'react';



export default function SignInPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });



        const data = await res.json();

        if (!res.ok) {
            setError(data.message || 'Login failed');
        } else {
            // store token or redirect
            localStorage.setItem('access_token', data.access_token);
            window.location.href = '/'; // or navigate programmatically
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded-md shadow-md">
            <h1 className="text-xl font-semibold mb-4">Sign In</h1>

            {error && <p className="text-red-600 mb-3">{error}</p>}

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mb-3 p-3 border rounded-md"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-3 p-3 border rounded-md"
            />
            <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700"
            >
                Sign In
            </button>
        </div>
    );
}

