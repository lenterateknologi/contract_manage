<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->name }}</title>
    <style>
        @page { 
            margin-top: 2.5cm; 
            margin-bottom: 2.5cm; 
            margin-left: 2.5cm; 
            margin-right: 2.2cm; 
        }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 8.5pt; 
            line-height: 1.4; 
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
        table { border-collapse: collapse; width: 100%; table-layout: fixed; border: none; }
        td { vertical-align: top; border: none; padding: 0; }
        
        .field-cell { padding: 6pt 0; }
        .label { 
            font-weight: 900; 
            font-size: 7.5pt; 
            text-transform: uppercase; 
            color: #1e293b; 
            margin-bottom: 2pt; 
            display: block;
        }
        .value-text { 
            font-size: 8.5pt;
            color: #334155;
            line-height: 1.6;
        }
        
        /* Kop & Title specifically at 100% */
        .full-width-section { width: 100%; margin-bottom: 20pt; }
        .kop-surat { border-bottom: 2.25pt solid #0f172a; padding-bottom: 12pt; margin-bottom: 25pt; width: 100%; }
        .kop-logo-box { text-align: center; vertical-align: middle; }
        .kop-logo-text { font-weight: 900; color: #cbd5e1; font-style: italic; }
        .kop-text-box { padding-left: 20pt; vertical-align: middle; }
        .kop-text-box h1 { margin: 0; font-size: 16pt; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; line-height: 1.1; }
        .kop-details { margin-top: 4pt; font-size: 8pt; color: #475569; font-weight: 700; text-transform: uppercase; line-height: 1.4; letter-spacing: 0.02em; }
        
        .form-title { text-align: center; margin-bottom: 30pt; padding-top: 10pt; }
        .form-title h2 { margin: 0; font-size: 22pt; font-weight: 900; color: #0f172a; text-transform: uppercase; }

        .nested-table { margin-left: 15pt; border-left: 2pt solid #f1f5f9; width: auto; }
    </style>
</head>
    <div class="container">
        @php
            $rootFields = $fields->where('parent_id', null)->sortBy('order');
            $currentWeight = 0;
            $rows = [];
            $currentRow = [];
            
            foreach($rootFields as $f) {
                $w = 12;
                if($f->width === '1/2') $w = 6;
                if($f->width === '1/3') $w = 4;
                if($f->width === '1/4') $w = 3;
                
                // Kop and title always new row
                if($f->type === 'kop_surat' || $f->type === 'form_title' || ($currentWeight + $w) > 12) {
                    if(!empty($currentRow)) $rows[] = $currentRow;
                    $currentRow = [];
                    $currentWeight = 0;
                }
                
                $currentRow[] = ['field' => $f, 'weight' => $w];
                $currentWeight += $w;
                
                if($f->type === 'kop_surat' || $f->type === 'form_title') {
                    $rows[] = $currentRow;
                    $currentRow = [];
                    $currentWeight = 0;
                }
            }
            if(!empty($currentRow)) $rows[] = $currentRow;
        @endphp

        <table cellpadding="0" cellspacing="0" style="width: 100%; table-layout: fixed;">
            <colgroup>
                @for($i=0; $i<12; $i++) <col width="8.333%"> @endfor
            </colgroup>
            @foreach($rows as $row)
                <tr>
                    @foreach($row as $item)
                        <td colspan="{{ $item['weight'] }}" style="vertical-align: top;">
                            @include('pdf.partials.field', ['field' => $item['field'], 'fields' => $fields, 'formData' => $formData])
                        </td>
                    @endforeach
                    @php $rowWeight = collect($row)->sum('weight'); @endphp
                    @if($rowWeight < 12)
                        <td colspan="{{ 12 - $rowWeight }}"></td>
                    @endif
                </tr>
            @endforeach
        </table>
    </div>
</html>
