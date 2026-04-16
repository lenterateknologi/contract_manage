<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $template->name }}</title>
    <style>
        @page { 
            margin-top: 2cm; 
            margin-bottom: 2cm; 
            margin-left: 2cm; 
            margin-right: 2cm; 
        }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 8.5pt; 
            line-height: 1.5; 
            color: #0f172a; 
            background-color: #ffffff;
            margin: 0; 
            padding: 0; 
        }
        .container { width: 100%; }
        
        table { border-collapse: collapse; width: 100%; table-layout: fixed; border: none; }
        td { vertical-align: top; border: none; padding: 0; }
        
        /* Group Box Styles */
        .group-container {
            margin-bottom: 12pt;
            border: 1px solid #e2e8f0;
            border-radius: 4pt;
            overflow: hidden;
            background-color: #ffffff;
        }
        .group-header {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 2pt 6pt;
        }
        .group-title {
            font-size: 8pt;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .group-body {
            padding: 4pt 6pt;
        }

        .field-row {
            padding: 2.5pt 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .field-row:last-child {
            border-bottom: none;
        }

        .label { 
            font-weight: 700; 
            color: #475569;
            text-transform: uppercase;
            font-size: 7.5pt;
            letter-spacing: 0.03em;
            text-align: left;
            display: block;
        }
        .value-text { 
            font-size: 9pt;
            color: #0f172a;
            line-height: 1.4;
        }
        
        .kop-surat { border-bottom: 2pt solid #0f172a; padding-bottom: 12pt; margin-bottom: 20pt; }
        .kop-logo-box { text-align: left; }
        .kop-text-box h1 { margin: 0; font-size: 14pt; font-weight: 900; color: #0f172a; text-transform: uppercase; line-height: 1.1; }
        .kop-details { margin-top: 4pt; font-size: 7.5pt; color: #475569; font-weight: 500; text-transform: uppercase; line-height: 1.3; }
        
        .form-title { text-align: center; margin-bottom: 25pt; }
        .form-title h2 { margin: 0; font-size: 18pt; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2pt; }

        .nested-section { 
            margin-top: 5pt;
            padding-left: 10pt;
            border-left: 1px solid #e2e8f0;
        }
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
