<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $stepTitle ?? 'Persetujuan Kontrak' }}</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
            background-color: #f4f6fb;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-sizing: border-box;
        }
        .card {
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(31, 49, 76, .06);
            padding: 28px 32px;
            box-sizing: border-box;
            border: 1px solid #e5e7eb;
        }
        .brand { display: inline-flex; align-items: center; margin-bottom: 20px; }
        .brand h1 { font-size: 20px; margin: 0; color: #1f2937; }
        .content { color: #374151; line-height: 1.7; font-size: 14px; width: 100%; }
        .button { display: inline-flex; align-items: center; justify-content: center; background: #4f46ed; color: #ffffff !important; text-decoration: none; border-radius: 10px; padding: 12px 24px; font-weight: 600; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 13px; margin-top: 24px; }
        .meta { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin-top: 20px; box-sizing: border-box; }
        .meta p { margin: 10px 0; font-size: 13.5px; }
        .meta strong { color: #111827; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="brand">
                <h1>{{ $stepTitle ?? 'Persetujuan Kontrak' }}</h1>
            </div>

            <div class="content">
                <p>Halo {{ $recipientUser->name ?? $approval->approver?->name ?? 'Bapak/Ibu' }},</p>

                @php
                    $isAutoReview = in_array(strtolower($approval->action_code ?? ''), ['auto', 'automation']) || strtolower($approval->action_alias ?? '') === 'review';
                @endphp

                @if(!empty($note))
                    <p style="font-size: 15px; color: #1f2937; background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
                        {{ $note }}
                    </p>
                    <p>{{ $isAutoReview ? 'Berikut adalah rincian kontrak yang telah ditinjau/ditembuskan kepada Anda:' : 'Kontrak berikut memerlukan tindakan atau persetujuan dari Anda:' }}</p>
                @else
                    <p>{{ $isAutoReview ? 'Berikut adalah rincian kontrak yang telah ditinjau/ditembuskan kepada Anda:' : 'Sebuah kontrak telah memasuki tahapan alur kerja yang membutuhkan persetujuan atau tindakan dari Anda:' }}</p>
                @endif

                <div class="meta">
                    <p><strong>Judul Kontrak</strong><br>{{ $approval->contract->title }}</p>
                    <p><strong>Nomor Pengajuan</strong><br>{{ $approval->contract->form_no }}</p>
                    <p><strong>Jenis Kontrak</strong><br>{{ $approval->contract->contractType->name ?? $approval->contract->contract_type }}</p>
                    <p><strong>Tahap Alur Kerja</strong><br>Tahap {{ $approval->workflowStep->step }}: {{ $approval->workflowStep->label ?: ($approval->workflowStep->name ?: $approval->workflowStep->description) }} (Peran: {{ $approval->role }})</p>
                    @if(!empty($actionLabel))
                        <p><strong>Aksi Alur Kerja</strong><br>{{ $actionLabel }}</p>
                    @endif
                    <p><strong>Diajukan Oleh</strong><br>{{ $approval->contract->initiator->name ?? $approval->contract->creator->name }}</p>
                    @if(!empty($ccNames))
                        <p><strong>Tembusan (CC)</strong><br>{{ is_array($ccNames) ? implode(', ', $ccNames) : $ccNames }}</p>
                    @endif
                    @if(!empty($attachmentName))
                        <p><strong>Lampiran</strong><br>
                            @if(!empty($attachmentUrl))
                                <a href="{{ $attachmentUrl }}" target="_blank" style="color: #4f46ed; text-decoration: underline; font-weight: 500;">{{ $attachmentName }}</a>
                            @else
                                {{ $attachmentName }}
                            @endif
                        </p>
                    @endif
                </div>

                <a href="{{ url('/admin/contracts?detail=' . $approval->contract_id) }}" class="button" style="color: #ffffff !important; text-decoration: none;">Lihat & Putuskan Kontrak</a>

                <p class="footer">Terima kasih,<br>{{ config('app.name') }}</p>
            </div>
        </div>
    </div>
</body>
</html>
