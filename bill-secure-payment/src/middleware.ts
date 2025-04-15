import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {jwtDecode} from "jwt-decode";

interface DecodedToken {
    realm_access: {
        roles: string[];
    };
    [key: string]: unknown;
}

export default withAuth(
    async function middleware(req) {
        const token = req.nextauth?.token;

        if (!token) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401 }
            );
        }

        try {
            // Decode JWT to get roles
            const decodedToken = await jwtVerify(token.accessToken as string, new TextEncoder().encode(process.env.KEYCLOAK_CLIENT_SECRET!));

            // assign decodedToken.payload as DecodedToken type
            const roles = (decodedToken.payload as DecodedToken).realm_access?.roles || [];

            // Check permissions based on the route
            const path = req.nextUrl.pathname;

            if (path.startsWith('/api/bills')) {
                if (req.method === 'GET') {
                    if (!roles.includes('ActiveStudent') && !roles.includes('Accounting')) {
                        return new NextResponse(
                            JSON.stringify({ error: 'Insufficient permissions' }),
                            { status: 403 }
                        );
                    }
                } else {
                    // POST, PUT, DELETE operations require ActiveStudent role
                    if (!roles.includes('ActiveStudent')) {
                        return new NextResponse(
                            JSON.stringify({ error: 'Insufficient permissions' }),
                            { status: 403 }
                        );
                    }
                }
            }

            return NextResponse.next();
        } catch (error) {
            console.error('Failed to response:', error);
            return new NextResponse(
                JSON.stringify({ error: 'Invalid token' }),
                { status: 401 }
            );
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ['/api/bills/:path*'],
};

