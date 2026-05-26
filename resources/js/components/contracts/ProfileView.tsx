import { useForm } from '@inertiajs/react';
import React from 'react';

export function ProfileView({ meUser, showToast }: { meUser: any; showToast: any }) {
    const {
        data: pData,
        setData: setPData,
        patch,
        processing: pProcessing,
    } = useForm({
        name: meUser?.name || '',
        email: meUser?.email || '',
    });

    const {
        data: qData,
        setData: setQData,
        put,
        processing: qProcessing,
        reset: resetQ,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => showToast('Profil diperbarui!', 'success'),
            onError: () => showToast('Gagal memperbarui profil.', 'danger'),
        });
    };

    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Password diperbarui!', 'success');
                resetQ();
            },
            onError: (err: any) => {
                const msg = (Object.values(err)[0] as string) || 'Gagal memperbarui password.';
                showToast(msg, 'danger');
            },
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-4xl space-y-6 duration-500">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="bg-card border-border rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-1 text-lg font-bold">Informasi Profil</h3>
                    <p className="text-muted-foreground mb-6 text-xs tracking-wider uppercase">Kelola data diri dan alamat email Anda</p>
                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Nama Lengkap</label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    value={pData.name}
                                    onChange={(e) => setPData('name', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Alamat Email</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope text-muted-foreground/30 absolute top-1/2 left-3 -translate-y-1/2 text-xs" />
                                <input
                                    type="email"
                                    value={pData.email}
                                    onChange={(e) => setPData('email', e.target.value)}
                                    className="bg-muted/30 border-border focus:bg-card text-foreground focus:border-primary w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={pProcessing}
                            className="bg-primary text-primary-foreground shadow-primary/10 hover:bg-primary-hover hover:shadow-primary/20 mt-4 w-full rounded-lg py-3 text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {pProcessing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                            {pProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>
                <div className="bg-card border-border rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-1 text-lg font-bold">Keamanan Akun</h3>
                    <p className="text-muted-foreground mb-6 text-xs tracking-wider uppercase">Perbarui kata sandi secara berkala</p>
                    <form onSubmit={updatePassword} className="space-y-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Password Saat Ini</label>
                            <div className="relative">
                                <i className="fa-solid fa-key absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="password"
                                    value={qData.current_password}
                                    onChange={(e) => setQData('current_password', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Password Baru</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="password"
                                    value={qData.password}
                                    onChange={(e) => setQData('password', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Konfirmasi Password</label>
                            <div className="relative">
                                <i className="fa-solid fa-shield absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="password"
                                    value={qData.password_confirmation}
                                    onChange={(e) => setQData('password_confirmation', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={qProcessing}
                            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 mt-4 w-full rounded-lg py-3 text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {qProcessing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-lock-open mr-2" />}
                            {qProcessing ? 'Memperbarui...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
