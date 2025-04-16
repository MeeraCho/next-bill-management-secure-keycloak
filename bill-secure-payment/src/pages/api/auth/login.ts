import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { username, password } = req.body;


    try {
        const response = await fetch(`http://localhost:8180/realms/dmit2015-realm/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                username,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(401).json({ message: data.error_description || 'Invalid credentials' });
        }

        // Store token in a cookie or session (e.g., with next-auth or iron-session)
        res.setHeader('Set-Cookie', `accessToken=${data.access_token}; Path=/; HttpOnly`);


        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}




