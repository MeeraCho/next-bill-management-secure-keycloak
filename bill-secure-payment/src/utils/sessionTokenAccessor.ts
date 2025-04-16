import { getServerSession } from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth]";


export async function getAccessToken() {

    const session = await getServerSession(authOptions);
    if(session){
        return session.accessToken
    }
    return null;
}

export async function getIdToken() {

    const session = await getServerSession(authOptions);
    if(session){
       return session.idToken
    }
    return null;
}