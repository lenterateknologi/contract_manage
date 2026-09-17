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

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700|lora:400,500,600,700|montserrat:400,500,600,700,800,900|open-sans:400,500,600,700|roboto:400,500,700|lato:400,700|playfair-display:400,700" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
