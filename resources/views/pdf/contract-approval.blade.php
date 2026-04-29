<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Alur Approval - {{ $contract->contract_no }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9pt; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
        .header h1 { font-size: 18pt; margin: 0; font-weight: 900; letter-spacing: -0.02em; }
        
        .info-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
        .info-table td { padding: 6px 0; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
        .info-table td.label { font-weight: bold; width: 120px; color: #64748b; text-transform: uppercase; font-size: 8pt; }
        .info-table td.value { font-weight: bold; color: #0f172a; }
        
        .timeline-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .timeline-table th { border: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; font-weight: 900; font-size: 8pt; text-transform: uppercase; background-color: #f8fafc; color: #475569; }
        .timeline-table td { border: 1px solid #e2e8f0; padding: 12px 10px; font-size: 8.5pt; vertical-align: top; color: #334155; }

        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 7.5pt; font-weight: 800; text-transform: uppercase; display: inline-block; }
        .status-approved { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-pending { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .status-waiting { background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

        .note-box { margin-top: 8px; padding: 10px; background-color: #f8fafc; border-left: 3px solid #cbd5e1; font-style: italic; font-size: 8pt; color: #475569; border-radius: 0 4px 4px 0; }

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
            <td class="label">No. Kontrak</td>
            <td class="value">: {{ $contract->contract_no }}</td>
            <td class="label">Tanggal Cetak</td>
            <td class="value">: {{ $generated_at }}</td>
        </tr>
        <tr>
            <td class="label">Judul Kontrak</td>
            <td class="value">: {{ $contract->title }}</td>
            <td class="label">Dicetak Oleh</td>
            <td class="value">: {{ $generated_by }}</td>
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
                <td style="text-align: center; font-weight: bold;">0</td>
                <td><strong>Pengajuan Awal</strong></td>
                <td>{{ $contract->creator->name ?? '-' }}</td>
                <td><span class="status-badge status-approved">SUBMITTED</span></td>
                <td>
                    <div style="font-weight: bold; margin-bottom: 2px;">Diajukan:</div>
                    {{ $contract->submitted_at ? \Carbon\Carbon::parse($contract->submitted_at)->format('d/m/Y H:i') : '-' }}
                </td>
            </tr>

            @foreach($approvals as $a)
            <tr>
                <td style="text-align: center; font-weight: bold;">
                    <div style="font-size: 7pt; color: #64748b; margin-bottom: 2px;">SEQ</div>
                    {{ $a->sequence }}
                </td>
                <td>
                    <strong>{{ $a->role }}</strong>
                    <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">{{ $a->department_name ?? 'Matching Dept' }}</div>
                </td>
                <td>
                    @if($a->approver)
                        {{ $a->approver->name }}
                    @else
                        <span style="color: #64748b; font-style: italic;">Wait for {{ $a->role }}</span>
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
                        <div style="font-size: 7pt; color: #64748b; margin-top: 4px; font-weight: bold;">
                            Menunggu {{ $a->role }}
                        </div>
                    @endif
                </td>
                <td>
                    @if($a->decided_at)
                        <div style="margin-bottom: 4px; font-weight: bold;">{{ \Carbon\Carbon::parse($a->decided_at)->format('d/m/Y H:i') }}</div>
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
        Halaman <span class="page-number"></span> &bull; Dicetak melalui Contract Management System
    </div>
</body>
</html>
