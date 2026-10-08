<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.meta_title') ?: (config('app.name', 'corixa') . ' - ' . config('app.tagline', 'Legal Management System')) }}</title>
        <meta name="title" content="{{ config('app.meta_title') ?: (config('app.name', 'corixa') . ' - ' . config('app.tagline', 'Legal Management System')) }}">
        <meta name="theme-color" content="#4f46e5">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Corixa">

        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="{{ config('app.favicon', '/images/logo.png') }}">
        <link rel="shortcut icon" href="{{ config('app.favicon', '/images/logo.png') }}">
        <link rel="apple-touch-icon" href="{{ config('app.logo', '/images/logo.png') }}">

        <script>
            (function() {
                try {
                    var appearance = localStorage.getItem('appearance') || 'system';
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (appearance === 'dark' || (appearance === 'system' && prefersDark)) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                } catch (e) {}
            })();
        </script>

        <style>
            html, body {
                background-color: #f8fafc;
                color: #0f172a;
                margin: 0;
                padding: 0;
            }
            html.dark, html.dark body {
                background-color: #09090b;
                color: #f4f4f5;
            }
            @keyframes init-spin {
                to { transform: rotate(360deg); }
            }
        </style>

        {{-- ponytail: reset static flag to prevent Ziggy from rendering merge script on persistent PHP processes --}}
        @php \Tighten\Ziggy\BladeRouteGenerator::$generated = false; @endphp
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 selection:bg-primary selection:text-white">
        <div id="initial-preloader" style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;background-color:inherit;transition:opacity 0.25s ease-out;">
            <div style="width:36px;height:36px;border:3px solid rgba(99,102,241,0.2);border-top-color:#4f46e5;border-radius:50%;animation:init-spin 0.8s linear infinite;"></div>
            <span style="margin-top:14px;font-size:12px;font-weight:600;letter-spacing:0.025em;opacity:0.7;font-family:system-ui,-apple-system,sans-serif;">Memuat Corixa...</span>
        </div>
        @inertia
    </body>
</html>
