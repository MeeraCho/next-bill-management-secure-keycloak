"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

async function keycloakSessionLogOut() {
    try {
        await fetch(`/api/auth/logout`, { method: "GET" });
    } catch (err) {
        console.error(err);
    }
}

export default function AuthStatus() {
    const { data: session, status } = useSession();

    useEffect(() => {

        if (
            status != "loading" &&
            session &&
            session?.error === "RefreshAccessTokenError"
        ) {
            signOut({ callbackUrl: "/signin" });
        }
    }, [session, status]);


    if (status == "loading") {
        return <div className="my-3">Loading...</div>;
    } else if (session) {
        return (
            <div className="my-3">
                Hello, {session.user?.name}
            <button
                className="border border-red-600 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition ml-2"
                onClick={() => {
                    keycloakSessionLogOut().then(() => signOut({ callbackUrl: "/" }));
                }}>
                Log out
            </button>
        </div>
    );
    }

    return (
        <div className="mb-4">
            <button
                className="border border-blue-700 text-blue-900 px-4 py-2 rounded-md hover:bg-blue-50 transition"
                onClick={() => signIn("keycloak")}
            >
                Log in
            </button>
        </div>
    );

}