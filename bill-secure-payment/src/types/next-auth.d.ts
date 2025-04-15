import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        idToken?: string;
        roles?: string[];
        error?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        idToken?: string;
        expiresAt?: number;
        error?: string;
    }
}
