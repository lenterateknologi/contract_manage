@php
    $type = $field->type;
@endphp

@if($type === 'kop_surat')
    @php 
        $logoSize = ($field->options['logo_size'] ?? 80) * 0.75; 
        $isRight = ($field->options['logo_position'] ?? 'left') === 'right'; 
    @endphp
    <div class="kop-surat">
        <table style="width: 100%; border: none; table-layout: fixed;">
            <tr>
                @if(!$isRight)
                <td style="width: 12%; border: none; vertical-align: middle;">
                    <div class="kop-logo-box">
                        @if(!empty($field->options['logo_url']))
                            <img src="{{ $field->options['logo_url'] }}" style="width: {{ $logoSize }}pt; max-height: {{ $logoSize }}pt; object-fit: contain; display: block;" />
                        @else
                            <div style="width: 40pt; height: 40pt; background: #0f172a; color: white; display: table-cell; vertical-align: middle; text-align: center; font-weight: bold; border-radius: 4pt;">LT</div>
                        @endif
                    </div>
                </td>
                @endif
                
                <td style="border: none; vertical-align: middle; padding-left: {{ !$isRight ? '15pt' : '0' }}; padding-right: {{ $isRight ? '15pt' : '0' }}; text-align: {{ $isRight ? 'right' : 'left' }};">
                    <h1>{{ $field->label ?: 'COMPANY NAME' }}</h1>
                    <div class="kop-details">
                        {!! nl2br(e($field->options['description'] ?? 'Address and Contact Details')) !!}
                    </div>
                </td>

                @if($isRight)
                <td style="width: 12%; border: none; vertical-align: middle; text-align: right;">
                    <div class="kop-logo-box">
                        @if(!empty($field->options['logo_url']))
                            <img src="{{ $field->options['logo_url'] }}" style="width: {{ $logoSize }}pt; max-height: {{ $logoSize }}pt; object-fit: contain; display: block; margin-left: auto;" />
                        @else
                            <div style="float: right; width: 40pt; height: 40pt; background: #0f172a; color: white; display: table-cell; vertical-align: middle; text-align: center; font-weight: bold; border-radius: 4pt;">LT</div>
                        @endif
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
@elseif($type === 'form_title')
    <div class="form-title">
        <h2>{{ $field->label }}</h2>
    </div>
@elseif($type === 'sub_content')
    <div style="margin: 6pt 0 3pt 0; padding: 2pt 6pt; background: #f8fafc; border-left: 2pt solid #cbd5e1;">
        <p style="color: #475569; font-weight: 600; line-height: 1.3; margin: 0; font-size: 9pt;">{{ $field->label }}</p>
    </div>
@elseif($type === 'group')
    <div class="{{ !empty($field->label) ? 'group-container' : '' }}">
        @if(!empty($field->label))
            <div class="group-header">
                <span class="group-title">{{ $field->label }}</span>
            </div>
        @endif
        <div class="{{ !empty($field->label) ? 'group-body' : '' }}">
            @php
                $childFields = $fields->where('parent_id', $field->id)->sortBy('order');
            @endphp
            
            @if($childFields->count() > 0)
                <table style="width: 100%; border: none; table-layout: fixed; border-collapse: collapse;">
                    @php
                        $childWeight = 0;
                        $childRows = [];
                        $currentChildRow = [];
                        foreach($childFields as $cf) {
                            $cw = 12;
                            if($cf->width === '1/2') $cw = 6;
                            if(($childWeight + $cw) > 12) {
                                if(!empty($currentChildRow)) $childRows[] = $currentChildRow;
                                $currentChildRow = [];
                                $childWeight = 0;
                            }
                            $currentChildRow[] = ['field' => $cf, 'weight' => $cw];
                            $childWeight += $cw;
                        }
                        if(!empty($currentChildRow)) $childRows[] = $currentChildRow;
                    @endphp

                    @foreach($childRows as $cRow)
                        <tr>
                            @foreach($cRow as $cItem)
                                @php 
                                    $f = $cItem['field']; 
                                    $isFullWidth = $cItem['weight'] == 12;
                                @endphp
                                <td colspan="{{ $isFullWidth ? '2' : '1' }}" style="width: 90pt; vertical-align: top; padding: 2.5pt 0;">
                                    <span class="label" style="display: inline; word-wrap: break-word;">{!! wordwrap($f->label, 15, "<br/>", true) !!} :</span>
                                </td>
                                <td colspan="{{ $isFullWidth ? '2' : '1' }}" style="vertical-align: top; padding: 2.5pt {{ !$loop->last ? '10pt' : '0' }} 2.5pt 0; width: auto;">
                                    <div class="value-text" style="overflow: hidden;">
                                        @if($f->type === 'checkbox')
                                            <span style="font-family: DejaVu Sans, sans-serif;">{{ ($formData[$f->name] ?? false) ? '☑' : '☐' }}</span>
                                            <span style="font-weight: 700; margin-left: 2pt;">{{ ($formData[$f->name] ?? false) ? 'YES' : 'NO' }}</span>
                                        @elseif(isset($formData[$f->name]) && $formData[$f->name] !== '')
                                            {!! nl2br(e($formData[$f->name])) !!}
                                        @endif
                                    </div>
                                </td>
                            @endforeach
                            @php $rowW = collect($cRow)->sum('weight'); @endphp
                            @if($rowW < 12)
                                <td colspan="2"></td>
                            @endif
                        </tr>
                    @endforeach
                </table>
            @endif
        </div>
    </div>
@elseif($type === 'signature_box')
    @php
        $role = $field->options['role'] ?? 'Disetujui oleh :';
        $namePlaceholder = $field->options['name_placeholder'] ?? '';
        $actualName = isset($formData[$field->name]) && $formData[$field->name] !== '' ? $formData[$field->name] : $namePlaceholder;
    @endphp
    <div style="margin: 6pt 4pt; width: 140pt; float: {{ ($field->options['position'] ?? 'left') === 'right' ? 'right' : 'left' }};">
        <table style="width: 100%; border-collapse: collapse; border: 1.2pt solid #0f172a;">
            <tr>
                <td style="border-bottom: 0.8pt solid #e2e8f0; padding: 4pt 3pt; font-size: 8pt; font-weight: bold; background: #f8fafc; text-align: center;">
                    {{ $role }}
                </td>
            </tr>
            <tr>
                <td style="height: 55pt; vertical-align: bottom; padding: 0 4pt 6pt 4pt; text-align: center;">
                    <div style="border-bottom: 0.8pt solid #0f172a; padding-bottom: 1.5pt;">
                        <span style="font-size: 9pt; font-weight: 800; text-transform: uppercase;">{{ $actualName ?: '________________' }}</span>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 3pt 4pt; font-size: 7.5pt; color: #64748b;">
                    Tgl: ________________
                </td>
            </tr>
        </table>
    </div>
@else
    <div class="field-row">
        <table style="width: 100%; border: none; table-layout: fixed; border-collapse: collapse;">
            <tr>
                <td style="width: 90pt; border: none; vertical-align: top; padding-right: 2pt;">
                    <span class="label" style="display: inline; word-wrap: break-word;">{!! wordwrap($field->label, 15, "<br/>", true) !!} :</span>
                </td>
                <td style="border: none; vertical-align: top; width: auto;">
                    <div class="value-text" style="width: 100%; overflow: hidden;">
                        @if($field->type === 'checkbox')
                            <span style="font-family: DejaVu Sans, sans-serif; font-size: 11pt;">{{ ($formData[$field->name] ?? false) ? '☑' : '☐' }}</span>
                            <span style="font-weight: 700; margin-left: 4pt; font-size: 8.5pt;">
                                {{ ($formData[$field->name] ?? false) ? 'YES' : 'NO' }}
                            </span>
                        @else
                            @if(isset($formData[$field->name]) && $formData[$field->name] !== '')
                                {!! nl2br(e($formData[$field->name])) !!}
                            @endif
                        @endif
                    </div>
                </td>
            </tr>
        </table>
        
        @php
            $childFields = $fields->where('parent_id', $field->id)->sortBy('order');
        @endphp
        @if($childFields->count() > 0)
            <div class="nested-section">
                @foreach($childFields as $cf)
                    @include('pdf.partials.field', ['field' => $cf, 'fields' => $fields, 'formData' => $formData])
                @endforeach
            </div>
        @endif
    </div>
@endif
