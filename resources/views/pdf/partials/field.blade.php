@if($field->type === 'kop_surat')
    @php 
        $logoSize = ($field->options['logo_size'] ?? 80) * 0.75; // Convert px to pt (approx)
        $isRight = ($field->options['logo_position'] ?? 'left') === 'right'; 
    @endphp
    <div class="kop-surat">
        <table style="width: 100%; border: none;">
            <tr>
                @if(!$isRight)
                <td style="width: 15%; border: none; vertical-align: middle;">
                    <div class="kop-logo-box" style="width: 100%; border: none; line-height: 0;">
                        @if(!empty($field->options['logo_url']))
                            <img src="{{ $field->options['logo_url'] }}" style="width: {{ $logoSize }}pt; max-height: {{ $logoSize }}pt; object-fit: contain; display: block;" />
                        @else
                            <span class="kop-logo-text" style="font-size: {{ $logoSize / 2 }}pt;">LT</span>
                        @endif
                    </div>
                </td>
                @endif
                
                <td class="kop-text-box" style="width: 85%; border: none; text-align: {{ $isRight ? 'right' : 'left' }}; padding-{{ $isRight ? 'right' : 'left' }}: 25pt; vertical-align: middle;">
                    <h1>{{ $field->label ?: 'Company Name' }}</h1>
                    <div class="kop-details">
                        {!! nl2br(e($field->options['description'] ?? 'Address and Contact Details')) !!}
                    </div>
                </td>

                @if($isRight)
                <td style="width: 15%; border: none; vertical-align: middle; text-align: right;">
                    <div class="kop-logo-box" style="width: 100%; margin-left: auto; border: none; line-height: 0;">
                        @if(!empty($field->options['logo_url']))
                            <img src="{{ $field->options['logo_url'] }}" style="width: {{ $logoSize }}pt; max-height: {{ $logoSize }}pt; object-fit: contain; display: block; margin-left: auto;" />
                        @else
                            <span class="kop-logo-text" style="font-size: {{ $logoSize / 2 }}pt;">LT</span>
                        @endif
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
@elseif($field->type === 'form_title')
    <div class="form-title">
        <h2>{{ $field->label }}</h2>
    </div>
@elseif($field->type === 'sub_content')
    <div class="field-cell col-12">
        <p style="color: #475569; font-weight: 500; line-height: 1.6; margin: 0; font-size: 10pt;">{{ $field->label }}</p>
    </div>
@elseif($field->type === 'image')
    <div class="field-cell col-12" style="text-align: center;">
        <img src="{{ $field->label }}" style="width: {{ $field->options['image_scale'] ?? 100 }}%; max-height: 500px; border-radius: 8pt; border: 1px solid #e2e8f0; object-fit: contain;" />
    </div>
@elseif($field->type === 'signature_box')
    @php
        $role = $field->options['role'] ?? 'Disetujui oleh :';
        $namePlaceholder = $field->options['name_placeholder'] ?? '[nama]';
        $actualName = isset($formData[$field->name]) && $formData[$field->name] !== '' ? $formData[$field->name] : $namePlaceholder;
    @endphp
    <div class="field-cell" style="padding: 5pt;">
        <table style="width: 100%; border-collapse: collapse; border: 1pt solid #000; text-align: center;">
            <tr>
                <td style="border-bottom: 1pt solid #000; padding: 4pt 2pt; font-size: 8pt; font-weight: bold;">
                    {{ $role }}
                </td>
            </tr>
            <tr>
                <td style="height: 60pt; vertical-align: bottom; padding-bottom: 2pt;">
                    <span style="font-size: 9pt; font-weight: bold;">{{ $actualName }}</span>
                </td>
            </tr>
            <tr>
                <td style="border-top: 1pt solid #000; padding: 4pt 2pt; text-align: left; font-size: 8pt;">
                    Tgl.
                </td>
            </tr>
        </table>
    </div>
@else
    <div class="field-cell">
        <table style="width: 100%; border: none;">
            <tr>
                <td style="width: 30%; border: none; vertical-align: top;">
                    <span class="label" style="margin: 0; line-height: 1.6;">{{ $field->label }}@if($field->is_required)*@endif</span>
                </td>
                <td style="width: 2%; border: none; vertical-align: top; text-align: center;">:</td>
                <td style="width: 68%; border: none; vertical-align: top; padding-left: 5pt;">
                    <div class="value-text" style="font-size: 9pt; line-height: 1.6; color: #334155;">
                        @if($field->type === 'checkbox')
                            <span style="font-family: DejaVu Sans, sans-serif;">{{ ($formData[$field->name] ?? false) ? '☑' : '☐' }}</span>
                            <span style="font-weight: bold; margin-left: 5pt; font-size: 8pt; text-transform: uppercase;">
                                {{ ($formData[$field->name] ?? false) ? 'Setuju / Ya' : 'Tidak Setuju / Tidak' }}
                            </span>
                        @else
                            @if(isset($formData[$field->name]) && $formData[$field->name] !== '')
                                {!! nl2br(e($formData[$field->name])) !!}
                            @else
                                <span style="color: #e2e8f0;">..................................................................</span>
                            @endif
                        @endif
                    </div>
                </td>
            </tr>
        </table>
        
        {{-- Recursive rendering for children --}}
        @php
            $childFields = $fields->where('parent_id', $field->id)->sortBy('order');
        @endphp
        
        @if($childFields->count() > 0)
            <div class="nested-table" style="margin-top: 5pt;">
                @php
                    $childWeight = 0;
                    $childRows = [];
                    $currentChildRow = [];
                    
                    foreach($childFields as $cf) {
                        $cw = 12;
                        if($cf->width === '1/2') $cw = 6;
                        if($cf->width === '1/3') $cw = 4;
                        if($cf->width === '1/4') $cw = 3;
                        
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

                <table cellpadding="0" cellspacing="0" style="width: 100%; table-layout: fixed;">
                    <colgroup>
                        @for($i=0; $i<12; $i++) <col width="8.333%"> @endfor
                    </colgroup>
                    @foreach($childRows as $cRow)
                        <tr>
                            @foreach($cRow as $cItem)
                                <td colspan="{{ $cItem['weight'] }}" style="vertical-align: top;">
                                    @include('pdf.partials.field', ['field' => $cItem['field'], 'fields' => $fields, 'formData' => $formData])
                                </td>
                            @endforeach
                            @php $cRowW = collect($cRow)->sum('weight'); @endphp
                            @if($cRowW < 12)
                                <td colspan="{{ 12 - $cRowW }}"></td>
                            @endif
                        </tr>
                    @endforeach
                </table>
            </div>
        @endif
    </div>
@endif
