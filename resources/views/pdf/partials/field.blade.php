@php
    $type = $field->type;
    $options = $field->options ?? [];
    $resolvedLabel = str_replace(['{{Mode Transaksi}}', '{{Transaction Mode}}'], $contract->transaction_type ?? '', $field->label);

    $isContainer = in_array($type, ['group', 'grid_x', 'grid_y', 'grid_view']);

    // Spacing logic matching FormElement.tsx
    $getVal = function($val, $fallback = 0) {
        return (isset($val) && $val !== '') ? (int)$val : $fallback;
    };

    $marginTop = $getVal($options['margin_top'] ?? null, $getVal($options['margin_y'] ?? null, $getVal($options['margin_all'] ?? null, 0)));
    $marginBottom = $getVal($options['margin_bottom'] ?? null, $getVal($options['margin_y'] ?? null, $getVal($options['margin_all'] ?? null, 0)));
    $marginLeft = $getVal($options['margin_left'] ?? null, $getVal($options['margin_x'] ?? null, $getVal($options['margin_all'] ?? null, 0)));
    $marginRight = $getVal($options['margin_right'] ?? null, $getVal($options['margin_x'] ?? null, $getVal($options['margin_all'] ?? null, 0)));

    $style = [
        'display: inline-block',
        'vertical-align: top',
        'box-sizing: border-box',
        'margin-top: ' . $marginTop . 'px',
        'margin-bottom: ' . $marginBottom . 'px',
        'margin-left: ' . $marginLeft . 'px',
        'margin-right: ' . $marginRight . 'px',
    ];

    $customWidth = $options['width'] ?? null;
    $customHeight = $options['height'] ?? null;

    if (!empty($customWidth)) {
        $styleWidth = is_numeric($customWidth) ? $customWidth . 'px' : $customWidth;
        $style[] = 'width: ' . $styleWidth;
        if ($isContainer) {
            $style[] = 'min-width: ' . $styleWidth;
        }
    } else {
        if (!$isContainer) {
            $style[] = 'width: ' . ($field->width ?? '100') . '%';
        } else {
            $style[] = 'min-width: ' . ($field->width ?? '100') . '%';
        }
    }

    if (!empty($customHeight)) {
        $styleHeight = is_numeric($customHeight) ? $customHeight . 'px' : $customHeight;
        $style[] = 'height: ' . $styleHeight;
    }

    if (isset($options['grid_col_span'])) {
        $style[] = 'grid-column: span ' . $options['grid_col_span'];
    }
    if (isset($options['grid_row_span'])) {
        $style[] = 'grid-row: span ' . $options['grid_row_span'];
    }

    $paddingTop = $getVal($options['padding_top'] ?? null, $getVal($options['padding_y'] ?? null, 0)) . 'px';
    $paddingBottom = $getVal($options['padding_bottom'] ?? null, $getVal($options['padding_y'] ?? null, 0)) . 'px';
    $paddingLeft = $getVal($options['padding_left'] ?? null, $getVal($options['padding_x'] ?? null, 0)) . 'px';
    $paddingRight = $getVal($options['padding_right'] ?? null, $getVal($options['padding_x'] ?? null, 0)) . 'px';
    $paddingStyle = "padding: {$paddingTop} {$paddingRight} {$paddingBottom} {$paddingLeft}";

    $value = $formData[$field->name] ?? null;
@endphp

<div class="relative transition-all duration-200" style="{{ implode('; ', $style) }}">
    <div style="{{ $paddingStyle }}; position: relative; {{ !empty($customHeight) ? 'height: 100%; box-sizing: border-box;' : '' }}">

        @if($type === 'group')
            <div class="{{ ($options['group_style'] ?? '') !== 'frameless' ? 'p-0.5' : '' }} {{ ($options['border_style'] ?? '') === 'solid' ? 'border border-[#000]' : '' }}"
                 style="border-style: {{ $options['border_style'] ?? 'none' }};
                        border-width: {{ isset($options['border_width']) ? $options['border_width'].'px' : (($options['border_style'] ?? '') === 'solid' ? '1px' : '0') }};
                        border-color: {{ $options['border_color'] ?? 'transparent' }};
                        background-color: {{ $options['background_color'] ?? 'transparent' }};">

                <div class="flex flex-wrap items-start content-start gap-0">
                    @php
                        $childFields = $fields->where('parent_id', $field->id)->sortBy('order');
                    @endphp
                    @foreach($childFields as $cf)
                        @include('pdf.partials.field', ['field' => $cf, 'fields' => $fields, 'formData' => $formData])
                    @endforeach
                </div>
            </div>

        @elseif($type === 'grid_x')
            @php
                $colSizes = $options['col_sizes'] ?? [];
                $gridTemplate = count($colSizes) > 0 ? implode(' ', array_filter($colSizes)) : 'repeat(' . ($options['grid_cols'] ?? 1) . ', 1fr)';
            @endphp
            <div class="grid w-full gap-0"
                 style="grid-template-columns: {{ $gridTemplate }};
                        gap: {{ $options['gap'] ?? 16 }}px;
                        border-style: {{ $options['border_style'] ?? 'none' }};
                        border-width: {{ isset($options['border_width']) ? $options['border_width'].'px' : '0' }};
                        border-color: {{ $options['border_color'] ?? 'transparent' }};
                        background-color: {{ $options['background_color'] ?? 'transparent' }};
                        min-height: {{ isset($options['height']) ? $options['height'].'px' : 'auto' }};">
                @php
                    $childFields = $fields->where('parent_id', $field->id)->sortBy('order');
                @endphp
                @foreach($childFields as $cf)
                    @include('pdf.partials.field', ['field' => $cf, 'fields' => $fields, 'formData' => $formData])
                @endforeach
            </div>

        @elseif($type === 'grid_y')
            <div class="flex flex-col w-full"
                 style="gap: {{ $options['gap'] ?? 16 }}px;
                        justify-content: {{ $options['justify_content'] ?? 'flex-start' }};
                        align-items: {{ $options['align_items'] ?? 'stretch' }};
                        border-style: {{ $options['border_style'] ?? 'none' }};
                        border-width: {{ isset($options['border_width']) ? $options['border_width'].'px' : '0' }};
                        border-color: {{ $options['border_color'] ?? 'transparent' }};
                        background-color: {{ $options['background_color'] ?? 'transparent' }};
                        min-height: {{ isset($options['height']) ? $options['height'].'px' : 'auto' }};">
                @php
                    $childFields = $fields->where('parent_id', $field->id)->sortBy('order');
                @endphp
                @foreach($childFields as $cf)
                    @include('pdf.partials.field', ['field' => $cf, 'fields' => $fields, 'formData' => $formData])
                @endforeach
            </div>

        @elseif($type === 'image' || $type === 'f1_header')
            <div class="flex w-full {{ $options['alignment'] === 'center' ? 'justify-center' : ($options['alignment'] === 'right' ? 'justify-end' : 'justify-start') }}">
                <img src="{{ url($options['logo_url'] ?? $options['url'] ?? '/storage/fr_logo.png') }}"
                      style="width: {{ $options['width'] ?? $options['logo_size'] ?? $options['size'] ?? 120 }}{{ is_numeric($options['width'] ?? $options['logo_size'] ?? $options['size'] ?? 120) ? 'px' : '' }};
                             height: {{ isset($options['height']) && $options['height'] !== '' ? (is_numeric($options['height']) ? $options['height'] . 'px' : $options['height']) : 'auto' }};
                             aspect-ratio: {{ $options['aspect_ratio'] ?? 'auto' }};
                             object-fit: {{ $options['object_fit'] ?? 'contain' }};"
                     alt="document logo" />
            </div>

        @elseif($type === 'static_text')
            <div class="w-full"
                 style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};
                        font-size: {{ $options['font_size'] ?? 14 }}px;
                        font-weight: {{ $options['font_weight'] ?? 'normal' }};
                        font-style: {{ $options['font_style'] ?? 'normal' }};
                        text-align: {{ $options['alignment'] ?? 'left' }};
                        text-decoration: {{ $options['text_decoration'] ?? 'none' }};
                        color: {{ $options['color'] ?? '#000' }};
                        white-space: pre-wrap;
                        line-height: {{ $options['line_height'] ?? 1.2 }};
                        background-color: {{ $options['background_color'] ?? 'transparent' }};
                        border-style: {{ $options['border_style'] ?? 'none' }};
                        border-width: {{ isset($options['border_width']) ? $options['border_width'].'px' : '0' }};
                        border-color: {{ $options['border_color'] ?? 'transparent' }};">
                {{ $field->label }}
            </div>

        @elseif(in_array($type, ['textfield', 'number', 'date']))
            <div class="flex w-full items-baseline gap-2 py-0.5" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                @if(!empty($resolvedLabel))
                    <span class="text-[10px] font-black tracking-tight text-slate-500 whitespace-nowrap min-w-[120px] shrink-0"
                          style="font-size: {{ isset($options['font_size']) ? ($options['font_size'] * 0.8).'px' : '10px' }};">
                        {{ $resolvedLabel }} :
                    </span>
                @endif
                <span class="text-[11px] font-bold leading-relaxed text-slate-900 border-b border-dotted border-slate-200 flex-1 min-h-[1.2rem]"
                      style="font-size: {{ $options['font_size'] ?? 11 }}px;">
                    {{ $value ?: '—' }}
                </span>
            </div>

        @elseif($type === 'textarea')
            <div class="w-full py-1" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                @if(!empty($resolvedLabel))
                    <div class="text-[10px] font-black tracking-tight text-slate-500 mb-1"
                         style="font-size: {{ isset($options['font_size']) ? ($options['font_size'] * 0.8).'px' : '10px' }};">
                        {{ $resolvedLabel }}
                    </div>
                @endif
                <div class="text-[11px] font-bold leading-relaxed text-slate-900 bg-slate-50/30 border border-slate-100 p-2 rounded min-h-[40px] whitespace-pre-wrap"
                     style="font-size: {{ $options['font_size'] ?? 11 }}px;">
                    {{ $value ?: '—' }}
                </div>
            </div>

        @elseif($type === 'checkbox')
            <div class="flex items-center gap-2 py-1" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                <div class="h-4 w-4 rounded border flex items-center justify-center transition-colors {{ $value ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300' }}">
                    @if($value)
                        <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                    @endif
                </div>
                <span class="text-[11px] font-bold text-slate-900"
                      style="font-size: {{ $options['font_size'] ?? 11 }}px;">
                    {{ $field->label }}
                </span>
            </div>

        @elseif($type === 'radio')
            <div class="flex flex-col gap-1.5 py-1" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                @if(!empty($resolvedLabel))
                    <div class="text-[10px] font-black tracking-tight text-slate-500 mb-0.5"
                         style="font-size: {{ isset($options['font_size']) ? ($options['font_size'] * 0.8).'px' : '10px' }};">{{ $resolvedLabel }}</div>
                @endif
                <div class="flex flex-wrap gap-4">
                    @foreach($options['items'] ?? [] as $opt)
                        <div class="flex items-center gap-1.5">
                            <div class="h-3.5 w-3.5 rounded-full border flex items-center justify-center {{ $value == $opt['value'] ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300' }}">
                                @if($value == $opt['value'])
                                    <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                                @endif
                            </div>
                            <span class="text-[10px] font-bold {{ $value == $opt['value'] ? 'text-slate-900' : 'text-slate-400' }}"
                                  style="font-size: {{ $options['font_size'] ?? 10 }}px;">
                                {{ $opt['label'] }}
                            </span>
                        </div>
                    @endforeach
                </div>
            </div>

        @elseif(in_array($type, ['select', 'searchable_select']))
            <div class="flex w-full items-baseline gap-2 py-0.5" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                @if(!empty($resolvedLabel))
                    <span class="text-[10px] font-black tracking-tight text-slate-500 whitespace-nowrap min-w-[120px] shrink-0"
                          style="font-size: {{ isset($options['font_size']) ? ($options['font_size'] * 0.8).'px' : '10px' }};">
                        {{ $resolvedLabel }} :
                    </span>
                @endif
                @php
                    $selected = collect($options['items'] ?? [])->firstWhere('value', $value);
                    $displayValue = $selected['label'] ?? ($value ?: '—');
                @endphp
                <span class="text-[11px] font-bold leading-relaxed text-slate-900 border-b border-dotted border-slate-200 flex-1 min-h-[1.2rem]"
                      style="font-size: {{ $options['font_size'] ?? 11 }}px;">
                    {{ $displayValue }}
                </span>
            </div>
        @elseif($type === 'labeled_value')
            @php
                $labelWidth = $options['label_width'] ?? '150px';
                $valueType = $options['value_type'] ?? 'textfield';
                $showColon = ($options['show_colon'] ?? true) !== false;

                $displayValue = $value;
                if (in_array($valueType, ['select', 'searchable_select'])) {
                    $selected = collect($options['items'] ?? [])->firstWhere('value', $value);
                    $displayValue = $selected['label'] ?? ($value ?: '—');
                }
            @endphp
            <div class="flex w-full items-baseline gap-2 py-1" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                @if(!empty($resolvedLabel))
                    <span class="text-slate-500 shrink-0 text-[10px] font-black tracking-tight"
                          style="width: {{ $labelWidth }}; font-size: {{ isset($options['font_size']) ? ($options['font_size'] * 0.8).'px' : '10px' }};">
                        {{ $resolvedLabel }}{{ $showColon ? ' :' : '' }}
                    </span>
                @endif
                <span class="text-[11px] font-bold leading-relaxed text-slate-900 border-b border-dotted border-slate-200 flex-1 min-h-[1.2rem]"
                      style="font-size: {{ $options['font_size'] ?? 11 }}px;">
                    {{ $displayValue ?: '—' }}
                </span>
            </div>

        @elseif($type === 'signature_box')
            <div class="flex flex-col gap-1 w-full max-w-[180px] py-2" style="font-family: {{ $options['font_family'] ?? "'Inter', sans-serif" }};">
                <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
                    <div class="bg-slate-50 border-b border-slate-200 px-3 py-1.5 text-center">
                        <span class="text-[9px] font-black text-slate-600 leading-none"
                              style="font-size: {{ isset($options['font_size']) ? ($options['font_size'] * 0.7).'px' : '9px' }};">
                            {{ $field->label ?: 'Tanda Tangan' }}
                        </span>
                    </div>
                    <div class="h-24 flex flex-col items-center justify-end p-3 text-center">
                        @if($value)
                            <div class="text-slate-900 text-[12px] font-black tracking-tight mb-2">
                                [{{ $value }}]
                            </div>
                        @else
                            <div class="w-full border-b-2 border-slate-100 mb-2 h-4"></div>
                        @endif
                    </div>
                    <div class="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[8px] font-bold text-slate-400 uppercase  text-start flex justify-between">
                        <span>TGL:</span>
                        <span>................</span>
                    </div>
                </div>
            </div>

        @endif

    </div>
</div>



