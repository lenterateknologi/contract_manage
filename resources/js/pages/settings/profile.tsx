import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    ExternalLink,
    FileText,
    Globe,
    Mail,
    MapPin,
    Palette,
    Phone,
    Settings2,
    User,
    Lock,
    KeyRound,
    Check,
    Loader2,
    Zap,
    Clock,
    ShieldCheck,
    TrendingUp,
    X,
    ChevronRight,
    AtSign,
    Target,
    Calendar,
    Layers,
    Info,
    Smartphone,
    Camera,
    Shield,
    Activity,
    Fingerprint,
    Building,
    Save,
    ArrowUpRight,
    Compass,
    Verified,
    Award,
    Heart,
    Star,
    Layout
} from 'lucide-react';
import { FormEventHandler, useRef, useState, useMemo } from 'react';

import AppearanceToggleTab from '@/components/layout/AppearanceTabs';
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import InputError from '@/components/ui/base/InputError';
import { Label } from '@/components/ui/base/Label';
import DeleteUser from '@/components/user/DeleteUser';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/contracts/ui/ui';
import { StatusBadge } from '@/components/ui/data/StatusBadge';

import { UserProfile as BaseUserProfile } from '@/types/contracts';

interface RecentContract {
    id: string;
    contract_no: string;
    title: string;
    type: string;
    status: string;
    progress: {
        done: number;
        total: number;
        pct: number;
    };
    time_ago: string;
}

interface UserProfile extends BaseUserProfile {
    username?: string;
    phone?: string;
    position?: string;
    company?: string;
    location?: string;
    group?: string;
    region?: string;
    bio?: string;
    created_at?: string;
    is_admin?: boolean;
    stats?: {
        total_created: number;
        pending_approvals: number;
        assigned_active: number;
    };
}

interface ProfileProps {
    department?: string;
    recentContracts: RecentContract[];
}

type TabId = 'general' | 'security' | 'activity' | 'appearance';

export default function Profile({ department, recentContracts = [] }: ProfileProps) {
    const { auth } = usePage<any>().props;
    const user = auth.user as UserProfile;

    const [activeTab, setActiveTab] = useState<TabId>('general');

    const profileForm = useForm({
        name: user.name,
        email: user.email,
        username: user.username || '',
        phone: user.phone || '',
        position: user.position || '',
        company: user.company || '',
        location: user.location || '',
        group: user.group || '',
        region: user.region || '',
        bio: user.bio || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('user.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const isPrivileged = user?.role === 'Admin' || user?.role === 'Super Admin' || !!user?.is_admin;

    const activeStats = useMemo(() => [
        { label: 'Kontrak Dibuat', value: user?.stats?.total_created ?? 0, icon: FileText, color: 'text-primary' },
        { label: 'Persetujuan', value: user?.stats?.pending_approvals ?? 0, icon: Clock, color: 'text-warning' },
        { label: 'Tugas PIC', value: user?.stats?.assigned_active ?? 0, icon: Zap, color: 'text-success' },
    ].filter(s => s.value > 0), [user]);

    return (
        <>
            <Head title="Pusat Kendali Pengguna" />

            <SettingsLayout>
                <div className="w-full bg-white dark:bg-background min-h-screen select-none animate-in fade-in duration-700 md:-m-[9px] md:w-[calc(100%+18px)]">
                    
                    {/* --- MASTER HERO HEADER (Ultra Premium) --- */}
                    <div className="bg-white dark:bg-surface-base border-b border-surface-border/40 relative overflow-hidden">
                        {/* Dynamic Background Accents */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-primary/5 blur-[120px] rounded-full rotate-12" />
                            <div className="absolute bottom-[-20%] left-[-5%] w-[30%] h-[50%] bg-indigo-500/5 blur-[100px] rounded-full -rotate-12" />
                        </div>
                        
                        <div className="max-w-[1600px] mx-auto px-8 md:px-16 pt-16 md:pt-24 pb-12 relative z-10">
                            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-12">
                                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-gradient-to-tr from-primary via-indigo-400 to-purple-400 rounded-[2.5rem] opacity-20 blur-md group-hover:opacity-40 transition-all duration-700 group-hover:rotate-6" />
                                        <div className="relative h-40 w-40 md:h-52 md:w-52 rounded-[2.2rem] overflow-hidden border-4 border-white dark:border-surface-base shadow-2xl z-10 transition-transform duration-700 group-hover:scale-[1.02]">
                                            <Avatar user={user} size="xl" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                                        </div>
                                        <button className="absolute -right-3 -bottom-3 z-30 bg-primary text-white h-12 w-12 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all ring-4 ring-white dark:ring-surface-base">
                                            <Camera size={20} />
                                        </button>
                                        {isPrivileged && (
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-surface-base text-primary shadow-xl border border-surface-border animate-in slide-in-from-left-4 duration-1000">
                                                <Verified size={20} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col text-center md:text-left gap-6 min-w-0">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-text-main leading-none drop-shadow-sm">{user.name}</h1>
                                                <div className={cn(
                                                    "rounded-2xl px-5 py-1.5 text-[10px] font-semibold tracking-[0.3em] uppercase border shadow-sm backdrop-blur-md transition-all",
                                                    isPrivileged ? "bg-primary text-primary-foreground border-primary/50 shadow-primary/20" : "bg-surface-muted/50 text-text-soft border-surface-border"
                                                )}>
                                                    {user.role || 'Anggota'}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-10 gap-y-3 text-xs font-semibold text-text-soft uppercase tracking-[0.2em] opacity-70">
                                                <span className="flex items-center gap-2.5 hover:text-primary transition-colors cursor-default"><AtSign size={16} className="text-primary/40" /> {user.username}</span>
                                                <span className="flex items-center gap-2.5 hover:text-primary transition-colors cursor-default"><Mail size={16} className="text-primary/40" /> {user.email}</span>
                                                <span className="flex items-center gap-2.5"><Calendar size={16} className="text-primary/40" /> Terdaftar {user.created_at}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                            {activeStats.map((stat, i) => (
                                                <div key={i} className="flex items-center gap-4 bg-surface-muted/30 hover:bg-surface-muted/50 border border-surface-border/40 rounded-3xl px-6 py-3 transition-all group cursor-default shadow-inner">
                                                    <div className={cn("p-2 rounded-xl bg-white dark:bg-surface-base shadow-sm group-hover:scale-110 transition-transform duration-500", stat.color)}>
                                                        <stat.icon size={16} />
                                                    </div>
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-base font-semibold text-text-main tracking-tight">{stat.value}</span>
                                                        <span className="text-[10px] font-semibold text-text-desc uppercase tracking-tighter opacity-60">{stat.label}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-4 min-w-[220px]">
                                    <Button 
                                        variant="primary" 
                                        onClick={activeTab === 'general' ? submitProfile : activeTab === 'security' ? submitPassword : undefined}
                                        disabled={profileForm.processing || passwordForm.processing} 
                                        className="h-14 rounded-3xl px-12 text-[11px] font-semibold uppercase tracking-[0.3em] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] active:scale-95 transition-all w-full"
                                    >
                                        {(profileForm.processing || passwordForm.processing) ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="mr-3" />} Simpan Perubahan
                                    </Button>
                                    <Button variant="white" className="h-12 rounded-[1.5rem] px-8 text-[10px] font-semibold uppercase tracking-widest shadow-sm border-surface-border active:scale-95 transition-all opacity-60 hover:opacity-100">
                                        <ArrowUpRight size={16} className="mr-2" /> Lihat Profil
                                    </Button>
                                </div>
                            </div>

                            {/* --- PREMIUM NAVIGATION --- */}
                            <div className="mt-20 flex items-center gap-14">
                                <TabLink active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="Identitas Organisasi" icon={Fingerprint} />
                                <TabLink active={activeTab === 'security'} onClick={() => setActiveTab('security')} label="Keamanan & Akses" icon={Shield} />
                                <TabLink active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} label="Riwayat Aktivitas" icon={Activity} />
                                <TabLink active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} label="Preferensi Visual" icon={Palette} />
                            </div>
                        </div>
                    </div>

                    {/* --- DYNAMIC SECTION CONTENT --- */}
                    <div className="max-w-[1600px] mx-auto px-8 md:px-16 py-20">
                        
                        {activeTab === 'general' && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-32">
                                {/* Section 1: Profil Dasar */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 h-12 w-12 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                                <User size={24} />
                                            </div>
                                            <h3 className="text-2xl font-semibold text-text-main uppercase tracking-tighter">Profil Pengguna</h3>
                                        </div>
                                        <p className="text-sm font-medium text-text-soft leading-loose uppercase tracking-[0.1em] opacity-60 max-w-sm">
                                            Informasi utama yang merepresentasikan otoritas dan tanggung jawab administratif Anda di dalam ekosistem sistem kontrak perusahaan.
                                        </p>
                                    </div>
                                    <div className="lg:col-span-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                            <PremiumField label="Nama Lengkap Resmi" value={profileForm.data.name} onChange={(v: string) => profileForm.setData('name', v)} error={profileForm.errors.name} icon={User} />
                                            <PremiumField label="Identifier Unik Sistem" value={profileForm.data.username} readOnly icon={AtSign} />
                                            <PremiumField label="Email Korporat" value={profileForm.data.email} onChange={(v: string) => profileForm.setData('email', v)} error={profileForm.errors.email} icon={Mail} />
                                            <PremiumField label="Nomor WhatsApp Aktif" value={profileForm.data.phone} onChange={(v: string) => profileForm.setData('phone', v)} error={profileForm.errors.phone} icon={Smartphone} />
                                            <div className="md:col-span-2 space-y-5">
                                                <Label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-text-desc px-1 flex items-center gap-2">
                                                    <FileText size={12} className="text-primary/40" /> Biografi Profesional
                                                </Label>
                                                <textarea 
                                                    value={profileForm.data.bio} 
                                                    onChange={(e) => profileForm.setData('bio', e.target.value)}
                                                    className="w-full min-h-[160px] rounded-[2.5rem] border border-surface-border bg-surface-muted/10 p-8 text-sm font-medium focus:border-primary focus:bg-white dark:focus:bg-surface-base outline-none transition-all shadow-inner leading-relaxed"
                                                    placeholder="Deskripsikan peran dan fokus profesional Anda..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-surface-border/0 via-surface-border/60 to-surface-border/0 w-full" />

                                {/* Section 2: Penempatan Struktural */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 h-12 w-12 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                                <Building size={24} />
                                            </div>
                                            <h3 className="text-2xl font-semibold text-text-main uppercase tracking-tighter">Struktur Jabatan</h3>
                                        </div>
                                        <p className="text-sm font-medium text-text-soft leading-loose uppercase tracking-[0.1em] opacity-60 max-w-sm">
                                            Detail penempatan unit organisasi dan klasifikasi wilayah operasional yang terdaftar dalam basis data SDM.
                                        </p>
                                    </div>
                                    <div className="lg:col-span-8 bg-surface-muted/20 p-16 rounded-[4rem] border border-surface-border/40 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                                        <ModernStaticItem icon={Briefcase} label="Jabatan Struktural" value={user.position || '—'} />
                                        <ModernStaticItem icon={Building2} label="Unit Organisasi" value={department || '—'} />
                                        <ModernStaticItem icon={Globe} label="Entitas Bisnis" value={user.company || '—'} />
                                        <ModernStaticItem icon={Compass} label="Wilayah Operasional" value={user.region || '—'} />
                                        <ModernStaticItem icon={Layers} label="Grup Afiliasi" value={user.group || '—'} />
                                        <ModernStaticItem icon={MapPin} label="Lokasi Penugasan" value={user.location || '—'} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl space-y-24">
                                <div className="space-y-6">
                                    <h3 className="text-5xl font-semibold text-text-main uppercase tracking-tighter leading-none uppercase">Keamanan & Akses Sesi</h3>
                                    <p className="text-lg font-medium text-text-soft uppercase tracking-widest opacity-60">Proteksi integritas akun melalui mekanisme rotasi kunci otorisasi berkala.</p>
                                </div>

                                <form onSubmit={submitPassword} className="space-y-16 bg-surface-muted/20 p-16 md:p-24 rounded-[5rem] border border-surface-border/40 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <Lock size={200} />
                                    </div>
                                    <div className="max-w-md space-y-14 relative z-10">
                                        <PremiumField label="Kunci Otorisasi Saat Ini" type="password" value={passwordForm.data.current_password} onChange={(v: string) => passwordForm.setData('current_password', v)} error={passwordForm.errors.current_password} icon={KeyRound} />
                                        <div className="h-px bg-surface-border/60 w-full opacity-40" />
                                        <PremiumField label="Kunci Otorisasi Baru" type="password" value={passwordForm.data.password} onChange={(v: string) => passwordForm.setData('password', v)} error={passwordForm.errors.password} icon={Lock} />
                                        <PremiumField label="Verifikasi Kunci Baru" type="password" value={passwordForm.data.password_confirmation} onChange={(v: string) => passwordForm.setData('password_confirmation', v)} error={passwordForm.errors.password_confirmation} icon={ShieldCheck} />
                                    </div>
                                    <div className="flex justify-start relative z-10">
                                        <Button disabled={passwordForm.processing} variant="primary" className="h-16 rounded-3xl px-16 text-xs font-semibold uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 active:scale-95 transition-all">
                                            {passwordForm.processing ? 'Memvalidasi...' : 'Terapkan Kunci Baru'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-20">
                                <div className="flex flex-col md:flex-row items-end justify-between border-b border-surface-border/40 pb-12 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-5xl font-semibold text-text-main uppercase tracking-tighter leading-none">Jejak Aktivitas</h3>
                                        <p className="text-base font-medium text-text-soft uppercase tracking-[0.2em] opacity-60">Log pemantauan interaksi dokumen kontrak terakhir dalam 30 hari terakhir.</p>
                                    </div>
                                    <Link href="/contracts" className="group text-primary text-[11px] font-semibold uppercase tracking-[0.3em] flex items-center gap-4 px-8 py-4 bg-primary/5 rounded-[1.5rem] hover:bg-primary/10 transition-all border border-primary/10 shadow-sm active:scale-95">
                                        Eksplorasi Registri <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                    {recentContracts.length > 0 ? (
                                        recentContracts.map((c) => (
                                            <Link key={c.id} href={`/contracts/${c.id}`} className="group bg-white dark:bg-surface-base border border-surface-border/60 p-10 rounded-[3.5rem] flex flex-col gap-10 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:border-primary/40 transition-all duration-700 hover:-translate-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-col gap-3 min-w-0">
                                                        <span className="text-primary text-[11px] font-semibold uppercase tracking-[0.3em] truncate">{c.contract_no || 'TIDAK-ADA-NOMOR'}</span>
                                                        <p className="text-text-main group-hover:text-primary text-xl font-semibold uppercase tracking-tighter leading-tight line-clamp-2 transition-colors duration-500">{c.title}</p>
                                                    </div>
                                                    <div className="shrink-0 scale-110 origin-top-right">
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                </div>
                                                <div className="space-y-5 mt-auto">
                                                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-text-desc px-1">
                                                        <span>Integritas Alur</span>
                                                        <span className="text-primary font-mono">{c.progress.pct}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden border border-surface-border/40 shadow-inner">
                                                        <div className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-[2000ms] ease-out" style={{ width: `${c.progress.pct}%` }} />
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-surface-border/20">
                                                        <span className="text-[10px] font-semibold text-text-soft uppercase  opacity-60 tracking-widest">{c.type}</span>
                                                        <span className="text-[10px] font-semibold text-text-soft uppercase tracking-wider opacity-60 flex items-center gap-1.5"><Clock size={12} /> {c.time_ago}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-48 flex flex-col items-center justify-center opacity-30 gap-10 border-4 border-dashed border-surface-border/30 rounded-[5rem] bg-surface-muted/5">
                                            <div className="h-32 w-32 bg-surface-muted rounded-[3rem] flex items-center justify-center shadow-inner animate-pulse">
                                                <Activity size={64} strokeWidth={1} className="text-text-soft" />
                                            </div>
                                            <div className="text-center space-y-3">
                                                <p className="text-2xl font-semibold uppercase tracking-[0.4em] text-text-main">Arsip Kosong</p>
                                                <p className="text-sm font-medium  max-w-sm leading-relaxed">Belum ada rekaman interaksi sistem yang terdaftar pada identitas Anda.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl space-y-24">
                                <div className="space-y-6">
                                    <h3 className="text-5xl font-semibold text-text-main uppercase tracking-tighter leading-none">Estetika Antarmuka</h3>
                                    <p className="text-lg font-medium text-text-soft uppercase tracking-widest opacity-60">Personalisasi palet luminansi lingkungan kerja sesuai preferensi optik Anda.</p>
                                </div>
                                <div className="bg-surface-muted/20 border border-surface-border/40 p-24 rounded-[6rem] shadow-inner flex flex-col items-center gap-16 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
                                    <div className="bg-primary/10 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl shadow-primary/20 relative z-10">
                                        <Palette size={48} />
                                    </div>
                                    <div className="w-full max-w-lg relative z-10">
                                        <Label className="text-center block text-xs font-semibold uppercase tracking-[0.5em] text-text-desc mb-14">Konfigurasi Spektrum Cahaya</Label>
                                        <div className="scale-110 origin-center transition-transform hover:scale-[1.12]">
                                            <AppearanceToggleTab />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- MASTER FOOTER SECURITY BLOCK --- */}
                    <div className="border-t border-surface-border/40 bg-surface-muted/20 p-20 flex flex-col items-center gap-16">
                         <div className="flex flex-col items-center gap-6 text-text-soft opacity-30 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse group-hover:bg-primary/40" />
                                <Shield size={36} className="text-primary relative z-10 group-hover:scale-125 transition-all duration-700" />
                            </div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.6em]  leading-loose text-center">
                                SISTEM MANAJEMEN KONTRAK TERPADU<br />
                                KEAMANAN DATA AKTIF v4.8 • {new Date().getFullYear()}
                            </p>
                        </div>
                        
                        <div className="pt-12 border-t border-surface-border/10 w-full max-w-sm flex flex-col items-center gap-8">
                            <div className="text-center space-y-2">
                                <h5 className="text-[11px] font-semibold text-danger uppercase tracking-[0.3em]">Hapus Akun</h5>
                                <p className="text-[10px] font-medium text-text-soft uppercase tracking-widest  opacity-60">Tindakan ini bersifat permanen</p>
                            </div>
                            <DeleteUser className="h-14 px-12 rounded-[1.5rem] shadow-2xl shadow-danger/10 hover:shadow-danger/20 transition-all hover:scale-105 active:scale-95 grayscale hover:grayscale-0 opacity-40 hover:opacity-100" />
                        </div>
                    </div>

                </div>
            </SettingsLayout>
        </>
    );
}

function TabLink({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: any }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'pb-10 text-xs font-semibold uppercase tracking-[0.35em] transition-all relative outline-none flex items-center gap-3',
                active ? 'text-primary' : 'text-text-soft hover:text-text-main',
            )}
        >
            <Icon size={16} className={cn("transition-colors", active ? "text-primary" : "text-text-soft opacity-40")} />
            {label}
            {active && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-10px_20px_rgba(79,70,229,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-500" />
            )}
        </button>
    );
}

function PremiumField({ label, value, onChange, error, icon: Icon, readOnly = false, type = 'text' }: any) {
    return (
        <div className="space-y-4 group">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-text-desc px-2 group-focus-within:text-primary transition-all duration-500 flex items-center gap-2">
                {label}
            </Label>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-500 group-focus-within:scale-110">
                        <Icon size={20} className="text-text-soft opacity-30 group-focus-within:text-primary group-focus-within:opacity-100" />
                    </div>
                )}
                <Input 
                    type={type}
                    value={value} 
                    readOnly={readOnly}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(
                        "h-16 rounded-3xl border-surface-border bg-surface-muted/20 text-sm font-semibold transition-all duration-500 shadow-inner",
                        "focus:bg-white dark:focus:bg-surface-base focus:border-primary focus:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.1)] focus:ring-0",
                        Icon && "pl-16",
                        readOnly && "opacity-50 cursor-not-allowed bg-surface-muted/5 border-dashed shadow-none"
                    )}
                />
            </div>
            {error && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <InputError message={error} />
                </div>
            )}
        </div>
    );
}

function ModernStaticItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="group flex flex-col gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-soft opacity-50 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1">{label}</span>
            <div className="flex items-center gap-6">
                <div className="bg-white dark:bg-surface-base p-4 rounded-[1.2rem] shadow-lg border border-surface-border/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:border-primary/30">
                    <Icon size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[15px] font-semibold text-text-main uppercase tracking-tight truncate leading-none group-hover:text-primary transition-colors">{value}</span>
            </div>
        </div>
    );
}
