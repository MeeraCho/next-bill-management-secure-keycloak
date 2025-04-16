import ErrorPage from '@/components/ErrorPage';
import { ERROR_TYPES } from '@/constants/errors';

export default function NotFoundError() {
    return <ErrorPage {...ERROR_TYPES.NOT_FOUND} />;
} 