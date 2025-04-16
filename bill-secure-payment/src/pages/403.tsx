import ErrorPage from '@/components/ErrorPage';
import { ERROR_TYPES } from '@/constants/errors';

export default function ForbiddenError() {
    return <ErrorPage {...ERROR_TYPES.FORBIDDEN} />;
} 