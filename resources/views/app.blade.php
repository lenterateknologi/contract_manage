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


        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
