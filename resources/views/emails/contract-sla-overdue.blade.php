<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pemberitahuan SLA Kontrak</title>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px; }
        .card { background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); padding: 32px; border: 1px solid #e2e8f0; }
        .badge-overdue { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #fecaca; }
        .badge-warning { display: inline-block; background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #fde68a; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0; }
        .content { color: #334155; line-height: 1.6; font-size: 14px; }
        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .meta-row { margin-bottom: 10px; }
        .meta-row:last-child { margin-bottom: 0; }
        .meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 2px; }
        .meta-value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .btn-action { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 10px; padding: 12px 24px; font-weight: 600; font-size: 13px; text-align: center; }
        .footer { color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div>
                @if($alertType === 'warning')
                    <span class="badge-warning">Peringatan Mendekati Batas Waktu</span>
                @else
                    <span class="badge-overdue">SLA Terlewat / Overdue</span>
                @endif
            </div>

            <h1 class="title">
                @if($alertType === 'warning')
                    Peringatan Batas Waktu SLA Pengajuan
                @else
                    Pengajuan Kontrak Melewati Batas Waktu (Overdue)
                @endif
            </h1>

            <div class="content">
                <p>Halo <strong>{{ $recipient->name ?? 'Pengguna' }}</strong>,</p>

                <p>
                    @if($alertType === 'warning')
                        Pengajuan kontrak berikut telah mendekati batas waktu target SLA tahapan dan memerlukan perhatian segera:
                    @else
                        Pengajuan kontrak berikut telah <strong>melewati batas waktu SLA yang telah ditentukan</strong> dan belum diselesaikan pada tahapan saat ini:
                    @endif
                </p>

                <div class="meta-box">
                    <div class="meta-row">
                        <div class="meta-label">Judul Dokumen / Kontrak</div>
                        <div class="meta-value">{{ $contract->title }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Nomor Pengajuan</div>
                        <div class="meta-value">{{ $contract->form_no }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Kategori Kontrak</div>
                        <div class="meta-value">{{ $contract->contractType->name ?? $contract->contract_type_id ?? '-' }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Status Saat Ini</div>
                        <div class="meta-value">{{ strtoupper($contract->status) }}</div>
                    </div>
                    @if($contract->current_stage_due_at)
                    <div class="meta-row">
                        <div class="meta-label">Target Batas Waktu Tahap Ini</div>
                        <div class="meta-value" style="color: #dc2626;">{{ \Carbon\Carbon::parse($contract->current_stage_due_at)->format('d M Y, H:i') }} WIB</div>
                    </div>
                    @endif
                    @if($contract->initiator)
                    <div class="meta-row">
                        <div class="meta-label">Diajukan Oleh</div>
                        <div class="meta-value">{{ $contract->initiator->name }} ({{ $contract->initiator->department?->name ?? $contract->initiator->division?->name ?? 'User' }})</div>
                    </div>
                    @endif
                </div>

                <div style="margin-top: 24px; text-align: center;">
                    <a href="{{ url('/admin/contracts?detail=' . $contract->id) }}" class="btn-action">
                        Buka & Tinjau Pengajuan Kontrak &rarr;
                    </a>
                </div>

                <div class="footer">
                    Email ini dikirim secara otomatis oleh sistem <strong>{{ config('app.name') }}</strong> berdasarkan konfigurasi SLA dan matriks otoritas eskalasi notifikasi.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
