import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    ExternalLink,
    FileText,
    Globe,
    Hash,
    Info,
    KeyRound,
    Lock,
    Mail,
    MapPin,
    Palette,
    Phone,
    Settings2,
    User,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

import AppearanceToggleTab from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';

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

interface UserProfile {
    id: string;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    position?: string;
    company?: string;
    location?: string;
    group?: string;
    region?: string;
    bio?: string;
    role?: string;
    initials?: string;
    bg_color?: string;
    text_color?: string;
}

interface ProfileProps {
    mustVerifyEmail: boolean;
    status?: string;
    department?: string;
    recentContracts: RecentContract[];
    user: UserProfile;
}

type SettingsTab = 'profile' | 'security' | 'appearance';

export default function Profile({ status, department, recentContracts = [], user: userProp }: ProfileProps) {
    const { auth } = usePage<SharedData>().props;
    const user = userProp || auth.user;

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Profile Info Form
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

    // Password Update Form
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'), {
            onSuccess: () => setIsEditing(false),
        });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('user.password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setIsEditing(false);
            },
            onError: (errors) => {
                if (errors.current_password) {
                    passwordForm.reset('current_password');
                    currentPasswordInput.current?.focus();
                }
                if (errors.password) {
                    passwordForm.reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
            },
        });
    };

    return (
        <>
            <Head title="Profil Hub" />

            <SettingsLayout>
                <div className="flex w-full flex-col gap-0 overflow-x-hidden">
                    {/* Header: Edge-to-Edge Banner */}
                    <div className="relative w-full">
                        <div className="relative h-48 w-full overflow-hidden bg-slate-900 sm:h-64">
                            <img
                                src="/images/profile-banner.png"
                                alt="Profile Banner"
                                className="h-full w-full object-cover opacity-60 grayscale-[30%] transition-opacity hover:opacity-70"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                        </div>

                        {/* Integrated Profile Card (Simplified & Centered) */}
                        <div className="mx-auto max-w-7xl px-6 sm:px-10">
                            <div className="relative z-10 -mt-16 flex flex-col items-center justify-between gap-8 border-b border-border pb-10 sm:-mt-20 md:flex-row md:items-end">
                                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left">
                                    <div
                                        className="flex h-32 w-32 rotate-2 items-center justify-center rounded-3xl border-4 border-background text-4xl font-black shadow-2xl ring-4 ring-foreground/5 transition-transform duration-500 hover:rotate-0 sm:h-40 sm:w-40 sm:text-5xl"
                                        style={{ backgroundColor: user.bg_color || '#3b82f6', color: user.text_color || '#ffffff' }}
                                    >
                                        {user.initials || user.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    <div className="mb-2 space-y-2 text-foreground">
                                        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{user.name}</h2>
                                            <div className="rounded-lg bg-primary px-2.5 py-0.5 text-[10px] font-black tracking-[0.2em] text-primary-foreground shadow-lg shadow-primary/20">
                                                {user.role || 'Member'}
                                            </div>
                                        </div>
                                        <p className="line-clamp-2 max-w-lg text-sm leading-relaxed font-medium text-muted-foreground italic">
                                            {user.bio || 'No biography provided yet. Set a custom bio through the profile settings.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-2 flex items-center gap-3">
                                    <Button
                                        onClick={() => {
                                            setActiveTab('profile');
                                            setIsEditing(true);
                                        }}
                                        className="group h-10 rounded-xl border-none bg-primary text-xs font-black tracking-widest text-primary-foreground shadow-xl transition-all hover:bg-primary/90 active:scale-95"
                                    >
                                        <Settings2 size={16} className="mr-2 transition-transform duration-300 group-hover:rotate-45" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Hub Content */}
                    <div className="mx-auto w-full max-w-7xl px-6 pt-12 pb-20 sm:px-10">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                            {/* Information Summary (Simplified Information Stream) */}
                            <div className="space-y-10 lg:col-span-4">
                                <div className="space-y-8 rounded-[2.5rem] border border-border bg-muted/30 p-8 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Info size={18} className="text-primary" />
                                        <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Identity Core</span>
                                    </div>

                                    <div className="grid gap-6">
                                        <HubInfoItem icon={Briefcase} label={user.position || 'No Position'} sublabel="Professional Title" />
                                        <HubInfoItem icon={Building2} label={department || 'No Department'} sublabel="Organization Unit" />
                                        <HubInfoItem icon={Users} label={user.group || 'Project Group'} sublabel="Specific Team" />
                                        <HubInfoItem icon={Globe} label={user.company || 'Enterprise Partner'} sublabel="Primary Company" />
                                        <HubInfoItem icon={MapPin} label={user.location || 'Global Location'} sublabel="Current Base" />
                                        <HubInfoItem icon={Hash} label={user.region || 'Assigned Region'} sublabel="Operating Region" />
                                    </div>

                                    <div className="grid gap-4 border-t border-border pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm">
                                                    <Mail size={14} />
                                                </div>
                                                <span className="text-xs font-bold tracking-tight text-foreground/80">{user.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm">
                                                    <Phone size={14} />
                                                </div>
                                                <span className="text-xs font-bold tracking-tight text-foreground/80">
                                                    {user.phone || 'No Phone Connected'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Interaction Space: Recent Activity */}
                            <div className="lg:col-span-8">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="text-base font-black tracking-tight text-foreground">Recent Activity Stream</h3>
                                                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase italic">
                                                    Live Contract Lifecycle Updates
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/contracts"
                                            className="group flex items-center gap-2 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:tracking-[0.2em]"
                                        >
                                            VIEW ALL <ExternalLink size={12} className="transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {recentContracts.length > 0 ? (
                                            recentContracts.map((contract) => (
                                                <Link
                                                    key={contract.id}
                                                    href={`/contracts/${contract.id}`}
                                                    className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[10px] font-black tracking-widest text-primary uppercase">
                                                                    {contract.contract_no || 'NO-REF'}
                                                                </p>
                                                                <span className="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">
                                                                    • {contract.type}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-black tracking-tight text-foreground uppercase transition-colors group-hover:text-primary">
                                                                {contract.title}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold tracking-tight text-muted-foreground uppercase">
                                                                    Updated {contract.time_ago}
                                                                </span>
                                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                                <span className="text-[9px] font-black tracking-tight text-muted-foreground/80 uppercase">
                                                                    {contract.progress.pct}% Complete
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'rounded-xl border px-3 py-1 text-[9px] font-black tracking-widest uppercase',
                                                                contract.status === 'approved'
                                                                    ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                                                                    : contract.status === 'draft'
                                                                      ? 'border-border bg-muted text-muted-foreground'
                                                                      : 'border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 text-amber-600',
                                                            )}
                                                        >
                                                            {contract.status}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="space-y-4 rounded-3xl border-2 border-dashed border-border bg-muted/10 p-20 text-center">
                                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-sm">
                                                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">No Recent Activity</p>
                                                    <p className="text-[10px] text-muted-foreground/40">Contracts you interact with will appear here.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified Settings Modal */}
                <Transition show={isEditing}>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <Transition.Child
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsEditing(false)} />
                        </Transition.Child>

                        <Transition.Child
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-8"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-8"
                        >
                            <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl md:flex-row">
                                {/* Modal Sidebar */}
                                <div className="flex w-full flex-col gap-8 border-r border-border bg-muted/30 p-8 md:w-72">
                                    <div className="mb-4 flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                                            <Settings2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Workspace</h3>
                                            <p className="text-sm font-black tracking-tight text-foreground">System Settings</p>
                                        </div>
                                    </div>

                                    <nav className="flex flex-col gap-2">
                                        <ModalTabButton
                                            active={activeTab === 'profile'}
                                            onClick={() => setActiveTab('profile')}
                                            icon={User}
                                            label="Portal Identity"
                                        />
                                        <ModalTabButton
                                            active={activeTab === 'security'}
                                            onClick={() => setActiveTab('security')}
                                            icon={Lock}
                                            label="Access & Security"
                                        />
                                        <ModalTabButton
                                            active={activeTab === 'appearance'}
                                            onClick={() => setActiveTab('appearance')}
                                            icon={Palette}
                                            label="Visual Palette"
                                        />
                                    </nav>

                                    <div className="mt-auto border-t border-border pt-8">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsEditing(false)}
                                            className="h-12 w-full justify-start rounded-xl text-xs font-black tracking-widest text-muted-foreground uppercase hover:bg-muted/50 hover:text-foreground"
                                        >
                                            <X size={16} className="mr-3" />
                                            Dismiss Portal
                                        </Button>
                                    </div>
                                </div>

                                {/* Modal Content Area */}
                                <div className="max-h-[700px] flex-1 overflow-y-auto p-10">
                                    {activeTab === 'profile' && (
                                        <div className="animate-in fade-in slide-in-from-right-4 space-y-10 duration-500">
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black tracking-tight text-foreground">Identity Management</h4>
                                                <p className="text-xs font-medium text-muted-foreground italic">
                                                    Synchronize your professional persona across the enterprise.
                                                </p>
                                            </div>

                                            <form onSubmit={submitProfile} className="space-y-8">
                                                <div className="grid gap-8 md:grid-cols-2">
                                                    <FormField
                                                        label="Full Domain Name"
                                                        id="name"
                                                        value={profileForm.data.name}
                                                        onChange={(val) => profileForm.setData('name', val)}
                                                        error={profileForm.errors.name}
                                                    />
                                                    <FormField
                                                        label="Public Identifier"
                                                        id="username"
                                                        value={profileForm.data.username}
                                                        onChange={(val) => profileForm.setData('username', val)}
                                                        error={profileForm.errors.username}
                                                    />
                                                    <FormField
                                                        label="Contact Email"
                                                        id="email"
                                                        type="email"
                                                        value={profileForm.data.email}
                                                        onChange={(val) => profileForm.setData('email', val)}
                                                        error={profileForm.errors.email}
                                                    />
                                                    <FormField
                                                        label="Secure Mobile"
                                                        id="phone"
                                                        value={profileForm.data.phone}
                                                        onChange={(val) => profileForm.setData('phone', val)}
                                                        error={profileForm.errors.phone}
                                                    />
                                                    <FormField
                                                        label="Professional Title"
                                                        id="position"
                                                        value={profileForm.data.position}
                                                        onChange={(val) => profileForm.setData('position', val)}
                                                        error={profileForm.errors.position}
                                                    />
                                                    <FormField
                                                        label="Team / Group"
                                                        id="group"
                                                        value={profileForm.data.group}
                                                        onChange={(val) => profileForm.setData('group', val)}
                                                        error={profileForm.errors.group}
                                                    />
                                                    <FormField
                                                        label="Organization / Company"
                                                        id="company"
                                                        value={profileForm.data.company}
                                                        onChange={(val) => profileForm.setData('company', val)}
                                                        error={profileForm.errors.company}
                                                    />
                                                    <FormField
                                                        label="Operating Region"
                                                        id="region"
                                                        value={profileForm.data.region}
                                                        onChange={(val) => profileForm.setData('region', val)}
                                                        error={profileForm.errors.region}
                                                    />
                                                    <div className="md:col-span-2">
                                                        <FormField
                                                            label="Base Location"
                                                            id="location"
                                                            value={profileForm.data.location}
                                                            onChange={(val) => profileForm.setData('location', val)}
                                                            error={profileForm.errors.location}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <div className="space-y-2">
                                                            <Label
                                                                htmlFor="bio"
                                                                className="text-[10px] font-black tracking-[0.1em] text-muted-foreground uppercase"
                                                            >
                                                                Biography
                                                            </Label>
                                                            <textarea
                                                                id="bio"
                                                                value={profileForm.data.bio}
                                                                onChange={(e) => profileForm.setData('bio', e.target.value)}
                                                                className="min-h-[120px] w-full rounded-2xl border border-border bg-muted/20 p-4 text-sm font-medium transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                                placeholder="Tell us about yourself..."
                                                            />
                                                            {profileForm.errors.bio && <InputError message={profileForm.errors.bio} />}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        disabled={profileForm.processing}
                                                        className="h-14 rounded-2xl bg-primary px-10 text-xs font-black tracking-widest text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                                                    >
                                                        {profileForm.processing ? 'SYNCHRONIZING...' : 'UPDATE IDENTITY'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {activeTab === 'security' && (
                                        <div className="animate-in fade-in slide-in-from-right-4 space-y-10 duration-500">
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black tracking-tight text-foreground">Global Security Access</h4>
                                                <p className="text-xs font-medium text-muted-foreground italic">
                                                    Enforce strong authentication via secure key rotation.
                                                </p>
                                            </div>

                                            <form onSubmit={submitPassword} className="space-y-8">
                                                <div className="max-w-md space-y-8">
                                                    <FormField
                                                        label="Authorization Token (Current)"
                                                        id="current_password"
                                                        type="password"
                                                        ref={currentPasswordInput}
                                                        value={passwordForm.data.current_password}
                                                        onChange={(val) => passwordForm.setData('current_password', val)}
                                                        error={passwordForm.errors.current_password}
                                                        icon={KeyRound}
                                                    />
                                                    <FormField
                                                        label="New Authorization Key"
                                                        id="password"
                                                        type="password"
                                                        ref={passwordInput}
                                                        value={passwordForm.data.password}
                                                        onChange={(val) => passwordForm.setData('password', val)}
                                                        error={passwordForm.errors.password}
                                                        icon={Lock}
                                                    />
                                                    <FormField
                                                        label="Confirm New Key"
                                                        id="password_confirmation"
                                                        type="password"
                                                        value={passwordForm.data.password_confirmation}
                                                        onChange={(val) => passwordForm.setData('password_confirmation', val)}
                                                        error={passwordForm.errors.password_confirmation}
                                                        icon={Lock}
                                                    />
                                                </div>
                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        disabled={passwordForm.processing}
                                                        className="h-14 rounded-2xl bg-foreground px-10 text-xs font-black tracking-widest text-background uppercase shadow-xl shadow-foreground/10 transition-all hover:bg-foreground/90 active:scale-95"
                                                    >
                                                        {passwordForm.processing ? 'ENFORCING...' : 'ROTATE KEYS'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {activeTab === 'appearance' && (
                                        <div className="animate-in fade-in slide-in-from-right-4 space-y-10 duration-500">
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black tracking-tight text-foreground">Visual Interface Palette</h4>
                                                <p className="text-xs font-medium text-muted-foreground italic">
                                                    Personalize the immersive experience and workspace aesthetics.
                                                </p>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="rounded-[2rem] border border-border bg-muted/20 p-8">
                                                    <Label className="mb-4 block text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                        Luminance Spectrum
                                                    </Label>
                                                    <AppearanceToggleTab />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Transition.Child>
                    </div>
                </Transition>

                {/* Account Deletion */}
                {!isEditing && (
                    <div className="mx-auto max-w-7xl px-6 pb-20 sm:px-10">
                        <div className="border-t border-border pt-12">
                            <DeleteUser />
                        </div>
                    </div>
                )}
            </SettingsLayout>
        </>
    );
}

function ModalTabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black transition-all outline-none',
                active ? 'border border-border bg-card text-primary shadow-md' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
        >
             <Icon size={18} className={cn(active ? 'text-primary' : 'text-muted-foreground/40 transition-colors group-hover:text-primary')} />
            <span className="tracking-widest uppercase">{label}</span>
        </button>
    );
}

function HubInfoItem({ icon: Icon, label, sublabel }: { icon: any; label: string; sublabel: string }) {
    return (
        <div className="group flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20">
                <Icon size={18} />
            </div>
             <div className="space-y-0.5">
                 <p className="text-[9px] font-black tracking-widest text-muted-foreground/60 uppercase">{sublabel}</p>
                 <p className="text-sm font-black tracking-tight text-foreground/80">{label}</p>
             </div>
        </div>
    );
}

interface FormFieldProps {
    label: string;
    id: string;
    type?: string;
    value: string;
    onChange: (val: string) => void;
    error?: string;
    icon?: any;
    ref?: React.Ref<HTMLInputElement>;
}

function FormField({ label, id, type = 'text', value, onChange, error, icon: Icon, ref }: FormFieldProps) {
    return (
        <div className="group w-full space-y-2">
            <Label
                htmlFor={id}
                className="text-[10px] font-black tracking-[0.1em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary"
            >
                {label}
            </Label>
            <div className="relative">
                 {Icon && (
                     <Icon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                 )}
                 <Input
                     id={id}
                     ref={ref}
                     type={type}
                     value={value}
                     onChange={(e) => onChange(e.target.value)}
                     className={cn(
                         'h-12 rounded-2xl border-border bg-muted/20 text-sm font-medium transition-all focus:bg-background',
                         Icon && 'pl-12',
                     )}
                 />
            </div>
            {error && <InputError message={error} />}
        </div>
    );
}
