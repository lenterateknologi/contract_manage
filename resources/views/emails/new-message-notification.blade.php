<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesan Baru di Diskusi Kontrak</title>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px; }
        .card { background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(31, 49, 76, .08); padding: 32px; }
        .brand { display: inline-flex; align-items: center; margin-bottom: 24px; }
        .brand h1 { font-size: 20px; margin: 0; color: #1f2937; }
        .content { color: #374151; line-height: 1.7; font-size: 14px; }
        .button { display: inline-flex; align-items: center; justify-content: center; background: #4f46ed; color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 12px 24px; font-weight: 600; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 13px; margin-top: 24px; }
        .meta { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 20px; }
        .meta p { margin: 8px 0; font-size: 13px; }
        .meta strong { color: #111827; }
        .message-box { background: #f1f5f9; border-left: 4px solid #cbd5e1; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="brand">
                <h1>Pesan Baru Diskusi Kontrak</h1>
            </div>

            <div class="content">
                <p>Halo {{ $user->name }},</p>

                <p>Ada pesan baru di dalam ruang diskusi kontrak yang melibatkan Anda:</p>

                <div class="meta">
                    <p><strong>Kontrak</strong><br>{{ $contractMessage->contract->title }} ({{ $contractMessage->contract->form_no }})</p>
                    <p><strong>Pengirim</strong><br>{{ $contractMessage->user->name }}</p>
                </div>

                <div class="message-box">
                    "{{ $contractMessage->message }}"
                </div>

                <a href="{{ url('/admin/contracts?detail=' . $contractMessage->contract_id . '&tab=chat') }}" class="button" style="color: #ffffff !important; text-decoration: none;">Balas Diskusi</a>

                <p class="footer">Terima kasih,<br>{{ config('app.name') }}</p>
            </div>
        </div>
    </div>
</body>
</html>
