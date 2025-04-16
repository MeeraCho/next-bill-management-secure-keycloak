import { promisePool } from '@/lib/mysql';
import { ResultSetHeader } from 'mysql2';
import { NextApiRequest, NextApiResponse } from 'next';
import { jwtDecode }  from 'jwt-decode';
import {getSession} from "next-auth/react";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth]";


interface DecodedToken {
    realm_access?: {
        roles?: string[];
    };
    upn?: string;
    [key: string]: unknown;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getSession({ req });

    if (!session?.accessToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const decodedToken = jwtDecode<DecodedToken>(session.accessToken as string);
    const roles = decodedToken.realm_access?.roles || [];
    const userUpn = decodedToken.upn ?? '';



    if (req.method === 'GET') {
        try {
            let query = 'SELECT * FROM BillDtos';
            const params = [];

            // If user is Accounting, show all bills
            if (roles.includes('Accounting')) {
                query;
            }

            // If user is ActiveStudent, only show their bills
            if (roles.includes('ActiveStudent')) {
                query += ' WHERE createdBy = ?';
                params.push(userUpn);
            }

            const [rows] = await promisePool.query(query, params);
            res.status(200).json(rows);
        } catch (error) {
            res.status(500).json({ message: 'Database error', error });
        }
    }

    if (req.method === 'POST') {
        if (!roles.includes('ActiveStudent')) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { payeeName, dueDate, paymentDue, paid } = req.body;
        try {
            const [result] = await promisePool.query<ResultSetHeader>(
                'INSERT INTO BillDtos (payeeName, dueDate, paymentDue, paid, createdBy) VALUES (?, ?, ?, ?, ?)',
                [payeeName, dueDate, paymentDue, paid, userUpn]
            );
            res.status(201).json({
                id: result.insertId,
                payeeName,
                dueDate,
                paymentDue,
                paid,
                createdBy: userUpn
            });
        } catch (error) {
            res.status(500).json({ message: 'Database error', error });
        }
    }
}
