<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $template->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        inter: ['Inter', 'sans-serif'],
                    },
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Lato:wght@400;700&family=Playfair+Display:wght@400;700&display=swap');

        @page {
            size: A4;
            margin: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            background-color: #f8fafc;
        }

        /* Print-specific overrides to ensure parity with Browsershot */
        @media print {
            body {
                background-color: white;
            }

            .no-print {
                display: none;
            }
        }

        .pdf-container {
            width: 210mm;
            min-height: 297mm;
            background-color: white;
            margin: 0 auto;
            box-sizing: border-box;
            position: relative;
            display: flex;
            flex-direction: column;
        }
    </style>
</head>

<body class="bg-slate-50">
    <div class="pdf-container shadow-sm border border-slate-100"
        style="padding-top: {{ $template->letterhead_json['margins']['top'] ?? 15 }}mm;
                padding-bottom: {{ $template->letterhead_json['margins']['bottom'] ?? 15 }}mm;
                padding-left: {{ $template->letterhead_json['margins']['left'] ?? 15 }}mm;
                padding-right: {{ $template->letterhead_json['margins']['right'] ?? 15 }}mm;">

        <div class="flex-1 relative">
            @php
                $rootFields = $fields->where('parent_id', null)->sortBy('order');
            @endphp

            @foreach ($rootFields as $f)
                @include('pdf.partials.field', [
                    'field' => $f,
                    'fields' => $fields,
                    'formData' => $formData,
                ])
            @endforeach
        </div>

        {{-- Standardized Footer matching InteractiveForm.tsx --}}
        <div
            class="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase  text-slate-300">
            <span>Lentera Teknologi Legal System</span>
            <span>{{ strtoupper($template->document_type ?? 'F2') }} / Official Document</span>
        </div>
    </div>
</body>

</html>
