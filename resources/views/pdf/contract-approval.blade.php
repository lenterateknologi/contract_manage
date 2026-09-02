<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Alur Approval - {{ $contract->contract_no }}</title>
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

        .note-box { margin-top: 4px; padding: 6px 8px; background-color: #f8fafc; border-left: 2px solid #cbd5e1; font-style: italic; font-size: 7.5pt; color: #475569; border-radius: 0 3px 3px 0; }

        .footer { position: fixed; bottom: -10px; left: 0; right: 0; height: 30px; text-align: center; font-size: 7.5pt; color: #94a3b8; }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>
    <div class="header">
        <h1>ALUR PERSETUJUAN KONTRAK</h1>
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
                <th style="width: 40px;">Seq</th>
                <th style="width: 150px;">Role / Jabatan</th>
                <th style="width: 150px;">Approver</th>
                <th style="width: 100px;">Status</th>
                <th>Waktu & Catatan</th>
            </tr>
        </thead>
        <tbody>
            {{-- Initiator Step --}}
            <tr>
                <td style="text-align: center;">0</td>
                <td>Pengajuan Awal</td>
                <td>{{ $contract->creator->name ?? '-' }}</td>
                <td><span class="status-badge status-approved">SUBMITTED</span></td>
                <td>
                    <div style="margin-bottom: 2px; color: #334155;">Diajukan:</div>
                    {{ ($contract->submitted_at ?: $contract->created_at) ? \Carbon\Carbon::parse($contract->submitted_at ?: $contract->created_at)->format('d/m/Y H:i') : '-' }}
                </td>
            </tr>

            @foreach($approvals as $a)
            <tr>
                <td style="text-align: center;">
                    <div style="font-size: 7pt; color: #334155; margin-bottom: 2px;">SEQ</div>
                    {{ $a->sequence }}
                </td>
                <td>
                    {{ $a->role }}
                    <div style="font-size: 7.5pt; color: #334155; margin-top: 2px;">{{ $a->department_name ?? 'Matching Dept' }}</div>
                </td>
                <td>
                    @if($a->approver)
                        {{ $a->approver->name }}
                    @else
                        <span style="color: #334155; font-style: italic;">Wait for {{ $a->role }}</span>
                    @endif
                </td>
                <td>
                    @php
                        $statusClass = 'status-waiting';
                        if ($a->status === 'approved') $statusClass = 'status-approved';
                        else if ($a->status === 'pending') $statusClass = 'status-pending';
                        else if ($a->status === 'rejected') $statusClass = 'status-rejected';
                        
                        $statusText = strtoupper($a->status);
                        if ($a->status === 'pending') $statusText = 'WAITING';
                    @endphp
                    <span class="status-badge {{ $statusClass }}">{{ $statusText }}</span>
                    
                    @if($a->status === 'waiting' || $a->status === 'pending')
                        <div style="font-size: 7pt; color: #334155; margin-top: 4px;">
                            Menunggu {{ $a->role }}
                        </div>
                    @endif
                </td>
                <td>
                    @if($a->decided_at)
                        <div style="margin-bottom: 4px;">{{ \Carbon\Carbon::parse($a->decided_at)->format('d/m/Y H:i') }}</div>
                    @endif
                    
                    @if($a->comment)
                        <div class="note-box">
                            "{{ $a->comment }}"
                        </div>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Halaman <span class="page-number"></span> &bull; Dicetak melalui CMS oleh: {{ $generated_by }} @if(!empty($generated_by_id) && $generated_by_id !== '-') (User ID: {{ $generated_by_id }}) @endif &bull; Waktu: {{ $generated_at }}
    </div>
    <div id="pdf-render-complete"></div>
</body>
</html>
