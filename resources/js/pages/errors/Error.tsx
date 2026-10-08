import { Button } from '@/components/ui/buttons/Button';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Compass, FileSignature, FileText, LayoutDashboard } from 'lucide-react';
import React from 'react';

interface ErrorPageProps {
    status?: number;
    message?: string;
}

export default function ErrorPage({ status = 404, message }: ErrorPageProps) {
    const errorConfig = {
        404: {
            code: '404',
            title: 'Halaman Tidak Ditemukan',
            subtitle: 'Kontrak atau tautan yang Anda cari tidak tersedia atau ID tidak valid.',
            description: message || 'Pastikan alamat URL sudah sesuai, atau periksa kembali nomor dan ID kontrak yang Anda tuju.',
        },
        403: {
            code: '403',
            title: 'Akses Dibatasi',
            subtitle: 'Anda tidak memiliki hak akses untuk membuka halaman atau data ini.',
            description: message || 'Silakan hubungi PIC alur kerja terkait atau administrator jika Anda memerlukan otorisasi akses.',
        },
        500: {
            code: '500',
            title: 'Terjadi Kendala Sistem',
            subtitle: 'Server sedang mengalami gangguan saat memproses permintaan Anda.',
            description: message || 'Tim teknis telah mencatat kendala ini. Silakan coba muat ulang beberapa saat lagi.',
        },
        503: {
            code: '503',
            title: 'Layanan Dalam Pemeliharaan',
            subtitle: 'Sistem sedang dalam proses peningkatan dan optimalisasi berkala.',
            description: message || 'Kami akan segera kembali dalam beberapa saat. Terima kasih atas kesabaran Anda.',
        },
    };

    const current = errorConfig[status as keyof typeof errorConfig] || errorConfig[404];

    const handleGoBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/contracts';
        }
    };

    return (
        <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden font-sans">
            <Head title={`${current.code} • ${current.title}`} />

            {/* Subtle Deep Ambient Background */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="bg-primary/8 dark:bg-primary/12 absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[140px]" />
                <div className="bg-accent/10 dark:bg-accent/8 absolute right-1/4 bottom-0 h-[400px] w-[600px] rounded-full blur-[140px]" />
                <div className="from-muted/20 absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent opacity-60" />
            </div>

            {/* Top Navigation Bar */}
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
                <Link href="/contracts" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
                    <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
                        <FileSignature className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-foreground text-sm font-semibold tracking-tight">Contract Management</span>
                        <span className="text-muted-foreground text-[11px]">Internal Portal</span>
                    </div>
                </Link>

                <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500/80" />
                    <span>STATUS {current.code}</span>
                </div>
            </header>

            {/* Main Center Hero Section (Expanded, Spacious & Clean) */}
            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
                {/* Massive Clean Status Code */}
                <div className="relative mb-6 select-none">
                    <span className="text-foreground/90 block font-mono text-8xl leading-none font-black tracking-tighter drop-shadow-xs sm:text-[13rem]">
                        {current.code}
                    </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-foreground mb-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">{current.title}</h1>

                {/* Subtitle & Clear Explanations */}
                <p className="text-muted-foreground mb-3 max-w-xl text-base leading-relaxed font-normal sm:text-xl">{current.subtitle}</p>

                <p className="text-muted-foreground/70 mb-12 max-w-lg text-xs leading-relaxed sm:text-sm">{current.description}</p>

                {/* Clean Primary Action Buttons */}
                <div className="mx-auto mb-14 flex w-full max-w-md flex-col items-center justify-center gap-3.5 sm:flex-row">
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-border/80 hover:bg-muted/60 h-12 w-full min-w-[140px] gap-2 rounded-xl px-6 text-sm font-medium sm:w-auto"
                        onClick={handleGoBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>

                    <Link href="/contracts" className="w-full sm:w-auto">
                        <Button
                            variant="default"
                            size="lg"
                            className="h-12 w-full min-w-[160px] gap-2 rounded-xl px-7 text-sm font-medium shadow-sm sm:w-auto"
                        >
                            <FileText className="h-4 w-4" />
                            Daftar Kontrak
                        </Button>
                    </Link>

                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-secondary/70 hover:bg-secondary h-12 w-full min-w-[140px] gap-2 rounded-xl px-6 text-sm font-medium sm:w-auto"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Direct Quick Shortcuts */}
                <div className="border-border/40 text-muted-foreground flex w-full max-w-2xl flex-col items-center justify-center gap-4 border-t pt-8 text-xs sm:flex-row">
                    <span className="text-foreground/80 flex items-center gap-1.5 font-medium">
                        <Compass className="text-primary h-3.5 w-3.5" />
                        Akses Cepat:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/contracts" className="hover:text-foreground underline-offset-4 transition-colors hover:underline">
                            Semua Kontrak
                        </Link>
                        <span>•</span>
                        <Link href="/contracts/mine" className="hover:text-foreground underline-offset-4 transition-colors hover:underline">
                            Kontrak Saya
                        </Link>
                        <span>•</span>
                        <Link href="/contracts/pending" className="hover:text-foreground underline-offset-4 transition-colors hover:underline">
                            Menunggu Persetujuan
                        </Link>
                    </div>
                </div>
            </main>

            {/* Bottom Clean Footer */}
            <footer className="text-muted-foreground/80 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs sm:flex-row sm:px-10">
                <p>&copy; {new Date().getFullYear()} Contract Management System. Hak cipta dilindungi.</p>
                <div className="flex items-center gap-6">
                    <Link href="/contracts" className="hover:text-foreground transition-colors">
                        Daftar Kontrak
                    </Link>
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">
                        Dashboard
                    </Link>
                </div>
            </footer>
        </div>
    );
}

// Full-screen standalone layout without sidebar / topbar wrapper
ErrorPage.layout = (page: React.ReactNode) => <>{page}</>;
