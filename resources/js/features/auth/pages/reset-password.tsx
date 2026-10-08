import { ResetPasswordForm, type ResetPasswordProps } from '@/features/auth';

export default function ResetPassword(props: Readonly<ResetPasswordProps>) {
    return <ResetPasswordForm {...props} />;
}
