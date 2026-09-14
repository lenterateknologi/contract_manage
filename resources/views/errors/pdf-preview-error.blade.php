<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Dokumen Tidak Ditemukan' }}</title>
    <script>
        // Sync theme with parent window or localStorage
        (function() {
            try {
                var isDark = false;
                if (window.parent && window.parent !== window && window.parent.document.documentElement) {
                    isDark = window.parent.document.documentElement.classList.contains('dark');
                } else if (localStorage.getItem('theme') === 'dark') {
                    isDark = true;
                }
                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch(e) {}
        })();
    </script>
    <style>
        :root {
            --fg-primary: #000000;
            --fg-muted: #1e293b;
            --icon-color: #000000;
            --btn-bg: #000000;
            --btn-fg: #ffffff;
            --btn-hover: #1f2937;
            --btn-sec-bg: #f1f5f9;
            --btn-sec-fg: #000000;
            --btn-sec-hover: #e2e8f0;
            --btn-sec-border: #cbd5e1;
            --bg-color: transparent;
        }

        html.dark {
            --fg-primary: #fafafa;
            --fg-muted: #a1a1aa;
            --icon-color: #a1a1aa;
            --btn-bg: #fafafa;
            --btn-fg: #18181b;
            --btn-hover: #f4f4f5;
            --btn-sec-bg: #27272a;
            --btn-sec-fg: #d4d4d8;
            --btn-sec-hover: #3f3f46;
            --btn-sec-border: transparent;
            --bg-color: transparent;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--fg-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }

        .wrapper {
            width: 100%;
            max-width: 360px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .icon {
            color: var(--icon-color) !important;
            margin-bottom: 14px;
        }

        .icon svg {
            width: 42px;
            height: 42px;
            stroke-width: 1.5;
            color: var(--icon-color) !important;
            stroke: var(--icon-color) !important;
        }

        h1 {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: var(--fg-primary) !important;
            margin-bottom: 6px;
        }

        p {
            font-size: 12px;
            color: var(--fg-muted) !important;
            line-height: 1.5;
            margin-bottom: 18px;
        }

        .actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 32px;
            padding: 0 14px;
            border-radius: 8px;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            text-decoration: none;
            border: none;
            outline: none;
        }

        .btn-primary {
            background: var(--btn-bg) !important;
            color: var(--btn-fg) !important;
        }

        .btn-primary:hover {
            background: var(--btn-hover) !important;
        }

        .btn-secondary {
            background: var(--btn-sec-bg) !important;
            color: var(--btn-sec-fg) !important;
            border: 1px solid var(--btn-sec-border);
        }

        .btn-secondary:hover {
            background: var(--btn-sec-hover) !important;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        </div>

        <h1>{{ $title ?? 'Dokumen Tidak Ditemukan' }}</h1>
        <p>{{ $message ?? 'Berkas fisik dokumen belum tersedia atau tidak ditemukan di penyimpanan server.' }}</p>

        <div class="actions">
            <button type="button" class="btn btn-secondary" onclick="window.history.length > 1 ? window.history.back() : window.close()">
                Kembali
            </button>
            <button type="button" class="btn btn-primary" onclick="window.location.reload()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                    <path d="M16 16h5v5"/>
                </svg>
                Muat Ulang
            </button>
        </div>
    </div>
</body>
</html>
