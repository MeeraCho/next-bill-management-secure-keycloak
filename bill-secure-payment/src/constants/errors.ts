export const ERROR_TYPES = {
    UNAUTHORIZED: {
        code: '401',
        title: 'Unauthorized Access',
        message: 'Please log in to access this resource.'
    },
    FORBIDDEN: {
        code: '403',
        title: 'Access Forbidden',
        message: 'You don't have permission to access this resource.'
    },
    NOT_FOUND: {
        code: '404',
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.'
    },
    SERVER_ERROR: {
        code: '500',
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.'
    }
} as const; 