<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atur Ulang Kata Sandi - {{ config('app.name', 'Corixa') }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            margin: 0;
            padding: 0;
            width: 100% !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        .main-wrapper {
            width: 100%;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }
        .content-cell {
            padding: 40px 32px;
            max-width: 640px;
            margin: 0 auto;
        }
        .brand-header {
            padding-bottom: 24px;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 32px;
        }
        .brand-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            letter-spacing: -0.02em;
        }
        .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 4px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 16px;
        }
        .text-p {
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
            margin: 0 0 20px 0;
        }
        .button-container {
            margin: 32px 0;
        }
        .btn-flat {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
        }
        .info-panel {
            background-color: #f8fafc;
            border-left: 3px solid #2563eb;
            padding: 16px 20px;
            margin: 28px 0;
            font-size: 13px;
            color: #334155;
        }
        .info-row {
            margin-bottom: 6px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #475569;
            display: inline-block;
            min-width: 120px;
        }
        .info-value {
            color: #0f172a;
            font-weight: 500;
        }
        .notice-text {
            font-size: 12px;
            line-height: 1.5;
            color: #64748b;
            margin: 24px 0;
            padding: 12px 16px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        .fallback-container {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #64748b;
            word-break: break-all;
            line-height: 1.5;
        }
        .fallback-container a {
            color: #2563eb;
            text-decoration: underline;
        }
        .footer-cell {
            padding-top: 32px;
            margin-top: 32px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <table role="presentation" class="main-wrapper" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="left">
                <div class="content-cell">
                    <!-- Brand Header -->
                    <div class="brand-header">
                        <div class="brand-title">{{ config('app.name', 'Corixa') }}</div>
                        <div class="brand-subtitle">Contract & Legal Management System</div>
                    </div>

                    <!-- Greeting & Content -->
                    <div class="greeting">Halo, {{ $user->name }}</div>

                    <p class="text-p">
                        Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di <strong>{{ config('app.name', 'Corixa') }}</strong>. Silakan gunakan tombol di bawah ini untuk membuat kata sandi baru.
                    </p>

                    <!-- Flat Action Button -->
                    <div class="button-container">
                        <a href="{{ $resetUrl }}" class="btn-flat" target="_blank">Atur Ulang Kata Sandi</a>
                    </div>

                    <!-- Info Panel -->
                    <div class="info-panel">
                        <div class="info-row">
                            <span class="info-label">Alamat Email</span>
                            <span class="info-value">: {{ $user->email }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Batas Waktu</span>
                            <span class="info-value">: {{ $expireAt->format('d M Y, H:i') }} WIB (60 Menit)</span>
                        </div>
                    </div>

                    <!-- Security Disclaimer -->
                    <div class="notice-text">
                        <strong>Pemberitahuan Keamanan:</strong> Jika Anda tidak pernah meminta pengaturan ulang kata sandi, Anda dapat mengabaikan email ini. Kata sandi akun Anda tetap aman dan tidak akan mengalami perubahan.
                    </div>

                    <!-- Fallback URL Link -->
                    <div class="fallback-container">
                        Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke peramban (browser) Anda:<br>
                        <a href="{{ $resetUrl }}">{{ $resetUrl }}</a>
                    </div>

                    <!-- Footer -->
                    <div class="footer-cell">
                        Email ini dikirimkan secara otomatis oleh sistem <strong>{{ config('app.name', 'Corixa') }}</strong>.<br>
                        Harap tidak membalas langsung ke alamat email ini.
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
