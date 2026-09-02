<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Audit Trail - {{ $contract->form_no }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; font-size: 8pt; color: #334155; margin: 0; padding: 10px; line-height: 1.4; font-weight: 400; }
        .header { border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; }
        .header h1 { font-size: 14pt; margin: 0; font-weight: 500; letter-spacing: -0.02em; color: #334155; }
        
        .info-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .info-table td { padding: 4px 0; vertical-align: top; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .info-table td.label { width: 110px; color: #334155; text-transform: uppercase; font-size: 7.5pt; }
        .info-table td.value { color: #334155; }
        
        .timeline-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .timeline-table th { border: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; font-weight: 500; font-size: 7.5pt; text-transform: uppercase; background-color: #f8fafc; color: #334155; }
        .timeline-table td { border: 1px solid #e2e8f0; padding: 8px 6px; font-size: 8pt; vertical-align: top; color: #334155; }

        .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 7pt; font-weight: 500; text-transform: uppercase; display: inline-block; }
        .status-approved { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .status-pending { background-color: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
        .status-rejected { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        .status-waiting { background-color: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

        .footer { position: fixed; bottom: -10px; left: 0; right: 0; height: 30px; text-align: center; font-size: 7.5pt; color: #94a3b8; }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>
    <div class="header">
        <h1>CATATAN AUDIT KONTRAK</h1>
    </div>

    <table class="info-table">
        <tr>
            <td class="label">No. Pengajuan</td>
            <td class="value">: {{ $contract->form_no }}</td>
            <td class="label">Tanggal Cetak</td>
            <td class="value">: {{ $generated_at }}</td>
        </tr>
        <tr>
            <td class="label">Judul Kontrak</td>
            <td class="value">: {{ $contract->title }}</td>
            <td class="label">Dicetak Oleh</td>
            <td class="value">: {{ $generated_by }} @if(!empty($generated_by_id) && $generated_by_id !== '-') (ID: {{ $generated_by_id }}) @endif</td>
        </tr>
        <tr>
            <td class="label">Initiator</td>
            <td class="value">: {{ $contract->creator->name ?? '-' }}</td>
            <td class="label">Status Kontrak</td>
            <td class="value">: {{ strtoupper($contract->status) }}</td>
        </tr>
    </table>

    <table class="timeline-table">
        <thead>
            <tr>
                <th style="width: 120px;">Waktu (WIB)</th>
                <th style="width: 150px;">Aktor</th>
                <th style="width: 120px;">Aksi</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($histories as $h)
            <tr>
                <td>{{ \Carbon\Carbon::parse($h->created_at)->format('d/m/Y H:i') }}</td>
                <td>
                    {{ $h->actor->name ?? 'System' }}
                    @if($h->actor && $h->actor->id)
                        <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">UID: {{ substr($h->actor->id, 0, 8) }}</div>
                    @endif
                </td>
                <td>
                    @php
                        $actionClass = 'status-waiting';
                        if (str_contains($h->action, 'APPROVE')) $actionClass = 'status-approved';
                        else if (str_contains($h->action, 'REJECT')) $actionClass = 'status-rejected';
                        else if (str_contains($h->action, 'SUBMIT') || str_contains($h->action, 'SEND') || str_contains($h->action, 'RECALL')) $actionClass = 'status-pending';
                    @endphp
                    <span class="status-badge {{ $actionClass }}">{{ str_replace('_', ' ', $h->action) }}</span>
                </td>
                <td>{{ $h->description }}</td>
            </tr>
            @endforeach
            @if(count($histories) === 0)
            <tr>
                <td colSpan="4" style="text-align: center; padding: 20px; color: #94a3b8;">
                    Belum ada riwayat audit
                </td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        Halaman <span class="page-number"></span> &bull; Dicetak melalui CMS oleh: {{ $generated_by }} @if(!empty($generated_by_id) && $generated_by_id !== '-') (User ID: {{ $generated_by_id }}) @endif &bull; Waktu: {{ $generated_at }}
    </div>
    <div id="pdf-render-complete"></div>
</body>
</html>
