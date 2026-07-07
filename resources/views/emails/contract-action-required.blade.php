<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tindakan Diperlukan: Persetujuan Kontrak</title>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="brand">
                <h1>Persetujuan Kontrak Baru</h1>
            </div>

            <div class="content">
                <p>Halo {{ $approval->approver->name }},</p>

                <p>Sebuah kontrak baru telah memasuki tahapan alur kerja yang membutuhkan persetujuan atau tindakan dari Anda:</p>

                <div class="meta">
                    <p><strong>Judul Kontrak</strong><br>{{ $approval->contract->title }}</p>
                    <p><strong>Nomor Pengajuan</strong><br>{{ $approval->contract->form_no }}</p>
                    <p><strong>Jenis Kontrak</strong><br>{{ $approval->contract->contractType->name ?? $approval->contract->contract_type }}</p>
                    <p><strong>Tahap Alur Kerja</strong><br>Tahap {{ $approval->workflowStep->step }}: {{ $approval->workflowStep->description }} (Peran: {{ $approval->role }})</p>
                    <p><strong>Diajukan Oleh</strong><br>{{ $approval->contract->initiator->name ?? $approval->contract->creator->name }}</p>
                </div>

                <a href="{{ url('/admin/contracts?detail=' . $approval->contract_id) }}" class="button" style="color: #ffffff !important; text-decoration: none;">Lihat & Putuskan Kontrak</a>

                <p class="footer">Terima kasih,<br>{{ config('app.name') }}</p>
            </div>
        </div>
    </div>
</body>
</html>
