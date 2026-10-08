import { ForgotPasswordForm, type ForgotPasswordProps } from '@/features/auth';

export default function ForgotPassword(props: Readonly<ForgotPasswordProps>) {
    return <ForgotPasswordForm {...props} />;
}
