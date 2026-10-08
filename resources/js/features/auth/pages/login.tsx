import { LoginForm, type LoginProps } from '@/features/auth';

export default function Login(props: Readonly<LoginProps>) {
    return <LoginForm {...props} />;
}
