import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    AtSign,
    Briefcase,
    Building,
    Building2,
    Calendar,
    Camera,
    Clock,
    Compass,
    FileText,
    Fingerprint,
    Globe,
    KeyRound,
    Layers,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Palette,
    Save,
    Shield,
    ShieldCheck,
    Smartphone,
    User,
    Verified,
    Zap,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

import { Avatar } from '@/pages/contracts/components/ui/ui';
import AppearanceToggleTab from '@/layouts/app/components/AppearanceTabs';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import InputError from '@/components/ui/forms/InputError';
import { Label } from '@/components/ui/forms/Label';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import DeleteUser from '@/components/profile/DeleteUser';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';

import { UserProfile as BaseUserProfile } from '@/pages/contracts/types';

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
    division_id?: string;
    department_id?: string;
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
        profileForm.patch(route('profile.update'), { preserveScroll: true });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('user.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const isPrivileged = user?.role === 'Admin' || user?.role === 'Super Admin' || !!user?.is_admin;

    const activeStats = useMemo(
        () =>
            [
                { label: 'Kontrak Dibuat', value: user?.stats?.total_created ?? 0, icon: FileText },
                { label: 'Menunggu Persetujuan', value: user?.stats?.pending_approvals ?? 0, icon: Clock },
                { label: 'Tugas Aktif', value: user?.stats?.assigned_active ?? 0, icon: Zap },
            ].filter((s) => s.value > 0),
        [user],
    );

    return (
        <>
            <Head title="Profil" />
            <SettingsLayout>
                <div className="dark:bg-background min-h-screen w-full bg-white md:-m-[9px] md:w-[calc(100%+18px)]">

                    {/* Header */}
                    <div className="dark:bg-surface-base border-surface-border bg-white border-b">
                        <div className="w-full px-6 pt-10 pb-0">

                            {/* User info row */}
                            <div className="flex items-start justify-between gap-6 mb-8">
                                <div className="flex items-center gap-5">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="dark:border-surface-border h-16 w-16 overflow-hidden rounded-full border border-gray-200 shadow-sm">
                                            <Avatar user={user} size="xl" className="h-full w-full object-cover" />
                                        </div>
                                        <button className="bg-primary absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm">
                                            <Camera size={12} />
                                        </button>
                                    </div>

                                    {/* Name & meta */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-text-main text-xl font-semibold">{user.name}</h1>
                                            {isPrivileged && <Verified size={16} className="text-primary" />}
                                            <span className="bg-surface-muted text-text-soft border-surface-border rounded border px-2 py-0.5 text-xs">
                                                {user.role || 'Anggota'}
                                            </span>
                                        </div>
                                        <div className="text-text-soft flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <AtSign size={13} /> {user.username}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Mail size={13} /> {user.email}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={13} /> Bergabung {user.created_at}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="white" size="sm" className="h-9 rounded-lg px-4 text-sm">
                                        <ArrowUpRight size={14} className="mr-1.5" /> Lihat Profil
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="h-9 rounded-lg px-4 text-sm"
                                        onClick={activeTab === 'general' ? submitProfile : activeTab === 'security' ? submitPassword : undefined}
                                        disabled={profileForm.processing || passwordForm.processing}
                                    >
                                        {profileForm.processing || passwordForm.processing ? (
                                            <Loader2 size={14} className="animate-spin mr-1.5" />
                                        ) : (
                                            <Save size={14} className="mr-1.5" />
                                        )}
                                        Simpan
                                    </Button>
                                </div>
                            </div>

                            {/* Stats */}
                            {activeStats.length > 0 && (
                                <div className="flex items-center gap-6 mb-6">
                                    {activeStats.map((stat, i) => (
                                        <div key={i} className="text-text-soft flex items-center gap-2 text-sm">
                                            <stat.icon size={14} className="text-primary" />
                                            <span className="text-text-main font-medium">{stat.value}</span>
                                            <span>{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex items-center gap-1 -mb-px">
                                {(
                                    [
                                        { id: 'general', label: 'Profil', icon: Fingerprint },
                                        { id: 'security', label: 'Keamanan', icon: Shield },
                                        { id: 'activity', label: 'Aktivitas', icon: Activity },
                                        { id: 'appearance', label: 'Tampilan', icon: Palette },
                                    ] as const
                                ).map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={cn(
                                            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                                            activeTab === id
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-text-soft hover:text-text-main',
                                        )}
                                    >
                                        <Icon size={14} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full px-6 py-10">

                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                {/* Basic Info */}
                                <Section title="Informasi Dasar" icon={User}>
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <FormField
                                            label="Nama Lengkap"
                                            value={profileForm.data.name}
                                            onChange={(v) => profileForm.setData('name', v)}
                                            error={profileForm.errors.name}
                                        />
                                        <FormField
                                            label="Username"
                                            value={profileForm.data.username}
                                            readOnly
                                        />
                                        <FormField
                                            label="Email"
                                            value={profileForm.data.email}
                                            onChange={(v) => profileForm.setData('email', v)}
                                            error={profileForm.errors.email}
                                        />
                                        <FormField
                                            label="Nomor WhatsApp"
                                            value={profileForm.data.phone}
                                            onChange={(v) => profileForm.setData('phone', v)}
                                            error={profileForm.errors.phone}
                                        />
                                        <div className="md:col-span-2">
                                            <Label className="text-text-desc mb-1.5 block text-xs font-medium">Bio Profesional</Label>
                                            <textarea
                                                value={profileForm.data.bio}
                                                onChange={(e) => profileForm.setData('bio', e.target.value)}
                                                className="border-surface-border bg-surface-muted/10 focus:border-primary w-full rounded-lg border p-3 text-sm leading-relaxed outline-none transition-colors"
                                                rows={4}
                                                placeholder="Deskripsikan peran dan fokus profesional Anda..."
                                            />
                                        </div>
                                    </div>
                                </Section>

                                {/* Org Structure */}
                                <Section title="Struktur Jabatan" icon={Building}>
                                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                                        <StaticItem icon={Briefcase} label="Jabatan" value={user.position || '—'} />
                                        <StaticItem icon={Building2} label="Departemen" value={department || '—'} />
                                        <StaticItem icon={Fingerprint} label="ID Departemen" value={user.division_id || user.department_id || '—'} />
                                        <StaticItem icon={Globe} label="Entitas Bisnis" value={user.company || '—'} />
                                        <StaticItem icon={Compass} label="Wilayah" value={user.region || '—'} />
                                        <StaticItem icon={Layers} label="Grup" value={user.group || '—'} />
                                        <StaticItem icon={MapPin} label="Lokasi" value={user.location || '—'} />
                                    </div>
                                </Section>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="max-w-md">
                                <Section title="Ubah Password" icon={Shield}>
                                    <form onSubmit={submitPassword} className="space-y-5">
                                        <FormField
                                            label="Password Saat Ini"
                                            type="password"
                                            value={passwordForm.data.current_password}
                                            onChange={(v) => passwordForm.setData('current_password', v)}
                                            error={passwordForm.errors.current_password}
                                        />
                                        <div className="border-surface-border border-t" />
                                        <FormField
                                            label="Password Baru"
                                            type="password"
                                            value={passwordForm.data.password}
                                            onChange={(v) => passwordForm.setData('password', v)}
                                            error={passwordForm.errors.password}
                                        />
                                        <FormField
                                            label="Konfirmasi Password Baru"
                                            type="password"
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(v) => passwordForm.setData('password_confirmation', v)}
                                            error={passwordForm.errors.password_confirmation}
                                        />
                                        <Button
                                            disabled={passwordForm.processing}
                                            variant="primary"
                                            className="h-9 rounded-lg px-5 text-sm"
                                        >
                                            {passwordForm.processing ? 'Menyimpan...' : 'Simpan Password'}
                                        </Button>
                                    </form>
                                </Section>
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div>
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-text-main text-lg font-semibold">Aktivitas Terakhir</h2>
                                        <p className="text-text-soft text-sm">Kontrak yang baru saja Anda akses atau buat.</p>
                                    </div>
                                    <Link
                                        href="/contracts"
                                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                                    >
                                        Lihat semua <ArrowUpRight size={14} />
                                    </Link>
                                </div>

                                {recentContracts.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {recentContracts.map((c) => (
                                            <Link
                                                key={c.id}
                                                href={`/contracts/${c.id}`}
                                                className="dark:bg-surface-base border-surface-border group flex flex-col gap-4 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-primary mb-1 truncate text-xs font-medium">
                                                            {c.contract_no || '—'}
                                                        </p>
                                                        <p className="text-text-main line-clamp-2 text-sm font-medium leading-snug">
                                                            {c.title}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0">
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                </div>
                                                <div className="mt-auto space-y-2">
                                                    <div className="text-text-soft flex justify-between text-xs">
                                                        <span>Progress</span>
                                                        <span className="font-medium">{c.progress.pct}%</span>
                                                    </div>
                                                    <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                                                        <div
                                                            className="bg-primary h-full rounded-full transition-all"
                                                            style={{ width: `${c.progress.pct}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-text-soft flex justify-between text-xs">
                                                        <span>{c.type}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={11} /> {c.time_ago}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-surface-border flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
                                        <Activity size={36} strokeWidth={1.5} className="text-text-soft opacity-30" />
                                        <div>
                                            <p className="text-text-soft text-sm font-medium">Belum ada aktivitas</p>
                                            <p className="text-text-soft mt-1 text-xs opacity-60">
                                                Aktivitas kontrak Anda akan muncul di sini.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="max-w-sm">
                                <Section title="Tema Antarmuka" icon={Palette}>
                                    <AppearanceToggleTab />
                                </Section>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-surface-border/40 border-t px-6 py-6">
                        <div className="w-full flex items-center justify-between">
                            <p className="text-text-soft text-xs">Sistem Manajemen Kontrak · {new Date().getFullYear()}</p>
                            <DeleteUser className="text-danger hover:bg-danger/5 rounded-lg px-3 py-1.5 text-xs transition-colors" />
                        </div>
                    </div>

                </div>
            </SettingsLayout>
        </>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="dark:bg-surface-base border-surface-border rounded-xl border bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
                <Icon size={16} className="text-text-soft" />
                <h3 className="text-text-main text-sm font-semibold">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FormField({
    label,
    value,
    onChange,
    error,
    type = 'text',
    readOnly = false,
}: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    error?: string;
    type?: string;
    readOnly?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-text-desc block text-xs font-medium">{label}</Label>
            <Input
                type={type}
                value={value}
                readOnly={readOnly}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    'border-surface-border h-9 rounded-lg text-sm transition-colors',
                    'focus:border-primary focus:ring-0',
                    readOnly && 'bg-surface-muted/30 cursor-not-allowed opacity-60',
                )}
            />
            {error && <InputError message={error} />}
        </div>
    );
}

function StaticItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-text-soft text-xs">{label}</span>
            <div className="text-text-main flex items-center gap-2 text-sm font-medium">
                <Icon size={14} className="text-text-soft shrink-0" />
                <span className="truncate">{value}</span>
            </div>
        </div>
    );
}