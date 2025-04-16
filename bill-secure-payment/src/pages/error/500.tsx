import { useRouter } from 'next/router';

export default function ServerError() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-4xl font-bold text-red-600 mb-4">500</h1>
                <h2 className="text-2xl font-semibold mb-4">Server Error</h2>
                <p className="text-gray-600 mb-6">Something went wrong on our end. Please try again later.</p>
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