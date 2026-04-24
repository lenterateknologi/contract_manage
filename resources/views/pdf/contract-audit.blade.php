<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Audit Trail - {{ $contract->contract_no }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 9pt; color: #000; margin: 0; padding: 0; }
        .header { border-bottom: 1px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { font-size: 16pt; margin: 0; }
        
        .info-table { width: 100%; margin-bottom: 30px; }
        .info-table td { padding: 4px 0; vertical-align: top; }
        .info-table td.label { font-weight: bold; width: 130px; }
        
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th { border: 0.5px solid #000; padding: 8px; text-align: left; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; }
        .audit-table td { border: 0.5px solid #000; padding: 8px; font-size: 8.5pt; vertical-align: top; }

        .footer { position: fixed; bottom: -30px; left: 0; right: 0; height: 30px; text-align: center; font-size: 7.5pt; color: #555; }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>
    <div class="header">
        <h1>CATATAN AUDIT KONTRAK</h1>
    </div>

    <table class="info-table">
        <tr>
            <td class="label">No. Kontrak</td>
            <td>: {{ $contract->contract_no }}</td>
            <td class="label">Tanggal Cetak</td>
            <td>: {{ $generated_at }}</td>
        </tr>
        <tr>
            <td class="label">Judul Kontrak</td>
            <td>: {{ $contract->title }}</td>
            <td class="label">Dicetak Oleh</td>
            <td>: {{ $generated_by }}</td>
        </tr>
        <tr>
            <td class="label">Tipe</td>
            <td>: {{ $contract->contractType->name ?? '-' }}</td>
            <td class="label">Status</td>
            <td>: {{ strtoupper($contract->status) }}</td>
        </tr>
    </table>

    <table class="audit-table">
        <thead>
            <tr>
                <th style="width: 110px;">Waktu (WIB)</th>
                <th style="width: 140px;">Aktor</th>
                <th style="width: 100px;">Aksi</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($histories as $h)
            <tr>
                <td>{{ \Carbon\Carbon::parse($h->created_at)->format('d/m/Y H:i') }}</td>
                <td>{{ $h->actor->name ?? 'System' }}</td>
                <td>{{ strtoupper(str_replace('_', ' ', $h->action)) }}</td>
                <td>{{ $h->description }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Halaman <span class="page-number"></span> &bull; Dicetak melalui Contract Management System
    </div>
</body>
</html>
