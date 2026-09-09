import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/buttons/Button';
import { 
    ArrowLeft, 
    LayoutDashboard, 
    FileText, 
    FileSignature,
    PlusCircle,
    Compass
} from 'lucide-react';

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
        <div className="relative min-h-screen w-full flex flex-col justify-between bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
            <Head title={`${current.code} • ${current.title}`} />

            {/* Subtle Deep Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/8 dark:bg-primary/12 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-accent/10 dark:bg-accent/8 rounded-full blur-[140px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/20 via-transparent to-transparent opacity-60" />
            </div>

            {/* Top Navigation Bar */}
            <header className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 flex items-center justify-between">
                <Link href="/contracts" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
                    <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                        <FileSignature className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-tight text-foreground">Contract Management</span>
                        <span className="text-[11px] text-muted-foreground">Internal Portal</span>
                    </div>
                </Link>

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
                    <span>STATUS {current.code}</span>
                </div>
            </header>

            {/* Main Center Hero Section (Expanded, Spacious & Clean) */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-16 text-center max-w-4xl mx-auto w-full">
                
                {/* Massive Clean Status Code */}
                <div className="relative select-none mb-6">
                    <span className="text-8xl sm:text-[13rem] font-black tracking-tighter leading-none text-foreground/90 font-mono block drop-shadow-xs">
                        {current.code}
                    </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4 max-w-2xl">
                    {current.title}
                </h1>

                {/* Subtitle & Clear Explanations */}
                <p className="text-base sm:text-xl text-muted-foreground font-normal max-w-xl leading-relaxed mb-3">
                    {current.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-muted-foreground/70 max-w-lg leading-relaxed mb-12">
                    {current.description}
                </p>

                {/* Clean Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mx-auto mb-14">
                    <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full sm:w-auto min-w-[140px] h-12 px-6 rounded-xl text-sm font-medium gap-2 border-border/80 hover:bg-muted/60"
                        onClick={handleGoBack}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>

                    <Link href="/contracts" className="w-full sm:w-auto">
                        <Button 
                            variant="default" 
                            size="lg"
                            className="w-full sm:w-auto min-w-[160px] h-12 px-7 rounded-xl text-sm font-medium gap-2 shadow-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Daftar Kontrak
                        </Button>
                    </Link>

                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button 
                            variant="secondary" 
                            size="lg"
                            className="w-full sm:w-auto min-w-[140px] h-12 px-6 rounded-xl text-sm font-medium gap-2 bg-secondary/70 hover:bg-secondary"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Direct Quick Shortcuts */}
                <div className="pt-8 border-t border-border/40 w-full max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        Akses Cepat:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/contracts" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
                            Semua Kontrak
                        </Link>
                        <span>•</span>
                        <Link href="/contracts/mine" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
                            Kontrak Saya
                        </Link>
                        <span>•</span>
                        <Link href="/contracts/pending" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
                            Menunggu Persetujuan
                        </Link>
                    </div>
                </div>
            </main>

            {/* Bottom Clean Footer */}
            <footer className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/80">
                <p>&copy; {new Date().getFullYear()} Contract Management System. Hak cipta dilindungi.</p>
                <div className="flex items-center gap-6">
                    <Link href="/contracts" className="hover:text-foreground transition-colors">Daftar Kontrak</Link>
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                </div>
            </footer>
        </div>
    );
}

// Full-screen standalone layout without sidebar / topbar wrapper
ErrorPage.layout = (page: React.ReactNode) => <>{page}</>;
