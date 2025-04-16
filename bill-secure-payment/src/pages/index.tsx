'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut} from "next-auth/react";
import {jwtDecode} from "jwt-decode";
import { useRouter } from 'next/router';

import '../app/globals.css';
import AuthStatus from "@/components/authStatus";
import { ERROR_TYPES } from '@/constants/errors';

interface DecodedToken {
    realm_access?: {
        roles?: string[];
    };
    preferred_username?: string;
    email?: string;
    upn?: string;
    [key: string]: unknown;
}

interface Bill {
    id: number;
    payeeName: string;
    dueDate: string;
    paymentDue: number;
    paid: boolean;
    createdBy: string;
}

// format date to YYYY-MM-DD
const formatDate = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export default function Home() {
    const { data: session } = useSession();
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [userUpn, setUserUpn] = useState<string>('');
    const [newBill, setNewBill] = useState<Bill>({
        id: 0,
        payeeName: '',
        dueDate: '',
        paymentDue: 0,
        paid: false,
        createdBy: ''
    });

    useEffect(() => {
        if (session?.accessToken) {
            const decodedToken = jwtDecode<DecodedToken>(session.accessToken as string);
            setUserRoles(decodedToken.realm_access?.roles || []);
            setUserUpn(decodedToken.preferred_username || decodedToken.email || decodedToken.upn || '');
            fetchBills();
        }
    }, [session]);

    // Add role-based rendering
    const canEdit = userRoles.includes('ActiveStudent');
    const isAccounting = userRoles.includes('Accounting');

    const fetchBills = async () => {
        try {
            const response = await fetch('/api/bills', {
                headers:{
                    Authorization: `Bearer ${session?.accessToken}`,
                }
            });

            if (response.status === 401) {
                router.push('/401');
                return;
            }
            
            if (response.status === 403) {
                router.push('/403');
                return;
            }

            if (!response.ok) {
                router.push('/500');
                return;
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error('Unexpected data format:', data);
                router.push('/500');
                return;
            }
            setBills(data);
        } catch (error) {
            console.error('Error fetching bills:', error);
            router.push('/500');
        }
    };

    // Add a new bill
    const handleAddBill = async () => {
        if (!canEdit) {
            router.push('/403');
            return;
        }

        if (newBill.payeeName && newBill.dueDate && newBill.paymentDue) {
            try {
                const response = await fetch('/api/bills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                    body: JSON.stringify(newBill),
                });

                if (response.status === 401) {
                    router.push('/401');
                    return;
                }
                
                if (response.status === 403) {
                    router.push('/403');
                    return;
                }

                if (!response.ok) {
                    router.push('/500');
                    return;
                }

                const data = await response.json();
                setBills((prevBills) => [...prevBills, data]);
                setNewBill({
                    id: 0,
                    payeeName: '',
                    dueDate: '',
                    paymentDue: 0,
                    paid: false,
                    createdBy: ''
                });
            } catch (error) {
                console.error('Error adding bill:', error);
                router.push('/500');
            }
        }
    };

    // Open the bill in edit mode
    const handleEditClick = (bill: Bill) => {
        setEditingBill(bill);
    };

    const handleCancelEdit = () => {
        setEditingBill(null);
    };

    const handleEditBill = async () => {
        if (!editingBill) return;

        try {
            const response = await fetch(`/api/bills/${editingBill.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(editingBill),
            });

            if (response.status === 401) {
                router.push('/error/401');
                return;
            }
            
            if (response.status === 403) {
                router.push('/error/403');
                return;
            }

            if (!response.ok) {
                router.push('/error/500');
                return;
            }

            const data = await response.json();
            setBills((prevBills) =>
                prevBills.map((bill) =>
                    bill.id === editingBill.id ? data : bill
                )
            );

            // Close the edit form
            setEditingBill(null); 
            
            // Refresh the bills after update
            fetchBills();
        } catch (error) {
            console.error('Error updating bill:', error);
            router.push('/error/500');
        }
    };

    // Handle changes in the edit form
    const handleBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingBill) {
            const { name, value, type, checked } = e.target;
            setEditingBill({
                ...editingBill,
                [name]: type === 'checkbox' ? checked : value,
            });
        }
    };

    // delete a bill
    const handleDeleteBill = async (id: number) => {
        try {
            const response = await fetch(`/api/bills/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (response.status === 401) {
                router.push('/error/401');
                return;
            }
            
            if (response.status === 403) {
                router.push('/error/403');
                return;
            }

            if (!response.ok) {
                router.push('/error/500');
                return;
            }

            setBills((prevBills) => prevBills.filter((bill) => bill.id !== id));
        } catch (error) {
            console.error('Error deleting bill:', error);
            router.push('/error/500');
        }
    };

    // Search bills
    const filteredBills = bills.filter(
        (bill) =>
            bill.payeeName &&
            bill.payeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-5xl mx-auto">

            {/* Title and Sign Out */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-semibold">
                    Bill List
                </h1>

                <AuthStatus />
            </div>

            {/* Search bar */}
            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    placeholder="Search by Payee Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-3 w-1/2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Add new bill form */}
            {canEdit && (
                <div className="mb-8 p-6 bg-gray-50 border border-gray-300 rounded-lg shadow-md">
                    <h2 className="text-xl font-medium mb-4">Add New Bill</h2>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                        <input
                            type="text"
                            placeholder="Payee Name"
                            value={newBill.payeeName}
                            onChange={(e) =>
                                setNewBill({
                                    ...newBill,
                                    payeeName: e.target.value,
                                })
                            }
                            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-1"
                        />
                        <input
                            type="date"
                            value={newBill.dueDate}
                            onChange={(e) =>
                                setNewBill({ ...newBill, dueDate: e.target.value })
                            }
                            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-1"
                        />
                        <input
                            type="number"
                            placeholder="Payment Due"
                            value={newBill.paymentDue}
                            onChange={(e) =>
                                setNewBill({
                                    ...newBill,
                                    paymentDue: parseFloat(e.target.value),
                                })
                            }
                            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-1"
                        />
                        <button
                            onClick={handleAddBill}
                            className="p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 col-span-1"
                        >
                            Add Bill
                        </button>
                    </div>
                </div>
            )}


            {/* Edit Bill Form */}
            {editingBill ? (
                <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg shadow-md">
                    <h2 className="text-xl font-medium mb-4">Edit Bill</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            <div>
                                <label className="block text-sm">
                                    Payee Name
                                </label>
                                <input
                                    type="text"
                                    name="payeeName"
                                    value={editingBill.payeeName}
                                    onChange={handleBillChange}
                                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={
                                        editingBill.dueDate
                                            ? new Date(editingBill.dueDate)
                                                .toISOString()
                                                .split('T')[0]
                                            : ''
                                    }
                                    onChange={handleBillChange}
                                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm">
                                    Payment Due
                                </label>
                                <input
                                    type="number"
                                    name="paymentDue"
                                    value={editingBill.paymentDue}
                                    onChange={handleBillChange}
                                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm">Paid</label>
                                <input
                                    type="checkbox"
                                    name="paid"
                                    checked={editingBill.paid}
                                    onChange={handleBillChange}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleEditBill}
                                className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300"
                            >
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-gray-500 text-white p-3 rounded-md hover:bg-gray-600 transition duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <table className="min-w-full mt-8 bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left">ID</th>
                            <th className="py-3 px-4 text-left">Payee Name</th>
                            <th className="py-3 px-4 text-left">Due Date</th>
                            <th className="py-3 px-4 text-left">Payment Due</th>
                            <th className="py-3 px-4 text-left">Paid</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBills.length > 0 ? (
                            filteredBills.map((bill) => (
                                <tr key={bill.id} className="border-t">
                                    <td className="py-3 px-4">{bill.id}</td>
                                    <td className="py-3 px-4">
                                        {bill.payeeName}
                                    </td>
                                    <td className="py-3 px-4">
                                        {formatDate(bill.dueDate)}
                                    </td>
                                    <td className="py-3 px-4">
                                        {bill.paymentDue}
                                    </td>
                                    <td className="py-3 px-4">
                                        {bill.paid ? '✅' : '❌'}
                                    </td>
                                    <td className="py-3 px-4 flex justify-center gap-2">
                                        {(bill.createdBy === userUpn || isAccounting) && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleEditClick(bill)
                                                    }
                                                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-300"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteBill(bill.id)
                                                    }
                                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-4">
                                    No bills found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
