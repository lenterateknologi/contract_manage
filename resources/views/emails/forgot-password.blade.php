<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px; }
        .card { background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(31, 49, 76, .08); padding: 32px; }
        .brand { display: inline-flex; align-items: center; margin-bottom: 24px; }
        .brand h1 { font-size: 24px; margin: 0; color: #1f2937; }
        .content { color: #374151; line-height: 1.7; }
        .button { display: inline-flex; align-items: center; justify-content: center; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; padding: 14px 24px; font-weight: 600; margin: 24px 0; }
        .footer { color: #6b7280; font-size: 13px; }
        .meta { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 24px; }
        .meta strong { color: #111827; }
        a.button{
            color: #ffffff !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="brand">
                <h1>Password Reset Request</h1>
            </div>

            <div class="content">
                <p>Hi {{ $user->name }},</p>

                <p>We received a request to reset your password for your account. Use the link below to choose a new password. This link is valid until <strong>{{ $expireAt->format('F j, Y \a\t g:i A') }}</strong>.</p>

                <a href="{{ $resetUrl }}" class="button">Reset your password</a>

                <p>If the button above does not work, copy and paste the following URL into your browser:</p>
                <p><a href="{{ $resetUrl }}" style="color: #2563eb; word-break: break-all;">{{ $resetUrl }}</a></p>

                <div class="meta">
                    <p><strong>Email</strong><br>{{ $user->email }}</p>
                    <p><strong>Expires at</strong><br>{{ $expireAt->format('F j, Y \a\t g:i A') }}</p>
                </div>

                <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>

                <p class="footer">Thank you,<br>{{ config('app.name') }} Team</p>
            </div>
        </div>
    </div>
</body>
</html>
