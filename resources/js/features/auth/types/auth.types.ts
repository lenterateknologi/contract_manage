export interface LoginFormState {
    email: string;
    password: string;
    remember: boolean;
}

export interface RegisterFormState {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ForgotPasswordFormState {
    email: string;
}

export interface ResetPasswordFormState {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ConfirmPasswordFormState {
    password: string;
}

export interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export interface RegisterProps {
    status?: string;
}

export interface ForgotPasswordProps {
    status?: string;
}

export interface ResetPasswordProps {
    token: string;
    email: string;
    error?: string;
}

export interface ConfirmPasswordProps {
    status?: string;
}

export interface VerifyEmailProps {
    status?: string;
}
