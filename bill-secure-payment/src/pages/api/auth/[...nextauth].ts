import {NextAuthOptions} from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { JWT } from 'next-auth/jwt';
import { jwtDecode }  from 'jwt-decode';
import NextAuth from "next-auth";


interface Token extends JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: string;
}

interface Account {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_at: number;
    [key: string]: unknown;
}

interface DecodedAccessToken {
    realm_access?: {
        roles?: string[];
    };
    [key: string]: unknown;
}

export const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER,
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            const typedToken = token as Token;

            // Initial sign in
            if (account) {
                const typedAccount = account as Account;
                return {
                    ...typedToken,
                    accessToken: typedAccount.access_token,
                    refreshToken: typedAccount.refresh_token,
                    idToken: typedAccount.id_token,
                    expiresAt: typedAccount.expires_at * 1000, // Convert to milliseconds

                };
            }

            // Return previous token if the access token has not expired
            if (typedToken.expiresAt && Date.now() < typedToken.expiresAt) {
                return typedToken;
            }

            // Access token has expired, try to refresh it
            return refreshAccessToken(typedToken);
        },
        async session({ session, token }) {
            const typedToken = token as Token;

            // let roles: string[] = [];
            // if (typedToken.accessToken) {
            //     try {
            //         const decoded = jwtDecode<DecodedAccessToken>(typedToken.accessToken);
            //         roles = decoded?.realm_access?.roles || [];
            //     } catch (error) {
            //         console.error('Failed to decode access token:', error);
            //     }
            // }

            let roles: string[] = [];
            if (typedToken.accessToken) {
                try {
                    const decoded = jwtDecode<DecodedAccessToken>(typedToken.accessToken);
                    roles = decoded?.realm_access?.roles || [];
                } catch (error) {
                    console.error('Failed to decode access token:', error);
                }
            }

            return {
                ...session,
                accessToken: typedToken.accessToken,
                idToken: typedToken.idToken,
                roles,
                error: typedToken.error,
            };
        },
    },
    pages: {
        signIn: 'auth/login',
        signOut: '/auth/logout',
        error: '/auth/error',
    },
};

async function refreshAccessToken(token: Token): Promise<Token> {
    try {
        if (!token.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            expiresAt: Date.now() + (refreshedTokens.expires_in * 1000),
        };
    } catch (error) {
        console.error('Failed to refresh token:', error);
        return {
            ...token,
            error: 'RefreshAccessTokenError',
        };
    }
}

export default NextAuth(authOptions);

