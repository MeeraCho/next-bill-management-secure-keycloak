import { useRouter } from 'next/router';

export default function UnauthorizedError() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-4xl font-bold text-red-600 mb-4">401</h1>
                <h2 className="text-2xl font-semibold mb-4">Unauthorized Access</h2>
                <p className="text-gray-600 mb-6">Please log in to access this resource.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
} 