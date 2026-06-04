<!-- <!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>F2 - Resume dan Persetujuan</title>
    <style>
        @page { 
            margin-top: 2.5cm; 
            margin-bottom: 2.5cm; 
            margin-left: 2.5cm; 
            margin-right: 2.2cm; 
        }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 9pt; 
            line-height: 1.5; 
            color: #1e293b; 
            background-color: #ffffff;
            margin: 0; 
            padding: 0; 
        }
        .container { 
            width: 100%; 
            background-color: #ffffff; 
            padding: 0;
        }

        /* ── Kop Surat ── */
        .kop-surat {
            border-bottom: 2.25pt solid #0f172a;
            padding-bottom: 12pt;
            margin-bottom: 25pt;
            width: 100%;
        }
        .kop-surat td { border: none; padding: 0; }
        .kop-text-box { padding-left: 20pt; vertical-align: middle; }
        .kop-text-box h1 { margin: 0; font-size: 16pt; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; line-height: 1.1; }
        .kop-details { margin-top: 4pt; font-size: 8pt; color: #475569; font-weight: 700; text-transform: uppercase; line-height: 1.4; letter-spacing: 0.02em; }

        /* ── Title ── */
        .form-title { 
            text-align: center; 
            margin-bottom: 30pt; 
            padding-top: 10pt; 
        }
        .form-title h2 { 
            margin: 0; 
            font-size: 18pt; 
            font-weight: 900; 
            color: #0f172a; 
            text-transform: uppercase; 
        }
        .form-subtitle {
            margin-top: 4pt;
            font-size: 8pt;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* ── Table Layout ── */
        table { border-collapse: collapse; width: 100%; border: none; }
        td { vertical-align: top; border: none; padding: 0; }

        .field-row { 
            border-bottom: 1pt solid #e2e8f0;
        }
        .field-row:last-child {
            border-bottom: none;
        }
        .field-label { 
            font-weight: 800; 
            font-size: 7.5pt; 
            text-transform: uppercase; 
            color: #64748b; 
            padding: 8pt 10pt 3pt 0;
            width: 35%;
            letter-spacing: 0.03em;
        }
        .field-value { 
            font-size: 9pt; 
            color: #1e293b; 
            padding: 8pt 0 8pt 0;
            font-weight: 500;
            line-height: 1.6;
        }
        .field-value-empty {
            color: #cbd5e1;
            font-style: italic;
        }

        /* ── Section divider ── */
        .section-divider {
            margin-top: 18pt;
            margin-bottom: 10pt;
            padding-bottom: 4pt;
            border-bottom: 1.5pt solid #0f172a;
        }
        .section-divider h3 {
            margin: 0;
            font-size: 10pt;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        /* ── Footer ── */
        .footer-note {
            margin-top: 30pt;
            padding-top: 10pt;
            border-top: 1pt solid #e2e8f0;
            font-size: 7pt;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- Kop Surat --}}
        <table class="kop-surat" cellpadding="0" cellspacing="0">
            <tr>
                <td style="width: 15%; text-align: center; vertical-align: middle;">
                    <div style="font-weight: 900; color: #cbd5e1; font-style: italic; font-size: 28pt;">LOGO</div>
                </td>
                <td class="kop-text-box" style="width: 85%;">
                    <h1>PT. Lentera Kreasi Teknologi</h1>
                    <div class="kop-details">
                        Jl. Contoh Alamat No. 123, Jakarta · Telp: (021) 123-4567
                    </div>
                </td>
            </tr>
        </table>

        {{-- Title --}}
        <div class="form-title">
            <h2>Resume dan Persetujuan</h2>
            <div class="form-subtitle">
                Dokumen F2 — Ringkasan data dari Formulir Permintaan (F1)
            </div>
        </div>

        {{-- Contract Info --}}
        @if(!empty($contractNo) || !empty($contractTitle))
        <table cellpadding="0" cellspacing="0" style="margin-bottom: 15pt; width: 100%;">
            <tr>
                <td style="width: 50%; padding-right: 10pt;">
                    <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.03em;">No. Kontrak</span><br>
                    <span style="font-size: 9pt; font-weight: 600; color: #1e293b;">{{ $contractNo ?? '—' }}</span>
                </td>
                <td style="width: 50%;">
                    <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.03em;">Judul Kontrak</span><br>
                    <span style="font-size: 9pt; font-weight: 600; color: #1e293b;">{{ $contractTitle ?? '—' }}</span>
                </td>
            </tr>
        </table>
        @endif

        {{-- Section: Informasi Perjanjian --}}
        <div class="section-divider"><h3>Informasi Perjanjian</h3></div>
        <table cellpadding="0" cellspacing="0">
            @foreach($sections['info'] as $item)
            <tr class="field-row">
                <td class="field-label">{{ $item['label'] }}</td>
                <td class="field-value">
                    @if(!empty($item['value']))
                        {{ $item['value'] }}
                    @else
                        <span class="field-value-empty">—</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </table>

        {{-- Section: Para Pihak --}}
        <div class="section-divider"><h3>Para Pihak</h3></div>
        <table cellpadding="0" cellspacing="0">
            @foreach($sections['parties'] as $item)
            <tr class="field-row">
                <td class="field-label">{{ $item['label'] }}</td>
                <td class="field-value">
                    @if(!empty($item['value']))
                        {{ $item['value'] }}
                    @else
                        <span class="field-value-empty">—</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </table>

        {{-- Section: Jangka Waktu & Komersial --}}
        <div class="section-divider"><h3>Jangka Waktu & Komersial</h3></div>
        <table cellpadding="0" cellspacing="0">
            @foreach($sections['commercial'] as $item)
            <tr class="field-row">
                <td class="field-label">{{ $item['label'] }}</td>
                <td class="field-value">
                    @if(!empty($item['value']))
                        {{ $item['value'] }}
                    @else
                        <span class="field-value-empty">—</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </table>

        {{-- Footer --}}
        <div class="footer-note">
            Dokumen ini digenerate secara otomatis dari sistem Contract Management · {{ now()->format('d M Y H:i') }}
        </div>
    </div>
</body>
</html> -->
