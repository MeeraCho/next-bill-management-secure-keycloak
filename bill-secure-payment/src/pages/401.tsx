import ErrorPage from '@/components/ErrorPage';
import { ERROR_TYPES } from '@/constants/errors';

export default function UnauthorizedError() {
    return <ErrorPage {...ERROR_TYPES.UNAUTHORIZED} />;
} 