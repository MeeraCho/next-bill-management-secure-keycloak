import { promisePool } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';
import { NextApiRequest, NextApiResponse } from 'next';
import { jwtDecode }  from 'jwt-decode';
import { getSession } from "next-auth/react";

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
    const userUpn = decodedToken.upn as string;

    const { id } = req.query;

    // Verify bill ownership
    const [bill] = await promisePool.query<RowDataPacket[]>(
        'SELECT * FROM BillDtos WHERE id = ?',
        [id]
    );

    if (!bill[0]) {
        return res.status(404).json({ message: 'Bill not found' });
    }

    // Check if user owns the bill or is Accounting
    if (bill[0].createdBy !== userUpn && !roles.includes('Accounting')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (req.method === 'GET') {
        res.status(200).json(bill[0]);
    }

    if (req.method === 'PUT') {
        if (!roles.includes('ActiveStudent')) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { payeeName, dueDate, paymentDue, paid } = req.body;
        const formattedDueDate = new Date(dueDate).toISOString().split('T')[0];

        try {
            await promisePool.query(
                'UPDATE BillDtos SET payeeName=?, dueDate=?, paymentDue=?, paid=? WHERE id=? AND createdBy=?',
                [payeeName, formattedDueDate, paymentDue, paid, id, userUpn]
            );
            res.status(200).json({ message: 'Bill updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Database error', error });
        }
    }

    if (req.method === 'DELETE') {
        if (!roles.includes('ActiveStudent')) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        try {
            await promisePool.query(
                'DELETE FROM BillDtos WHERE id=? AND createdBy=?',
                [id, userUpn]
            );
            res.status(200).json({ message: 'Bill deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Database error', error });
        }
    }
}