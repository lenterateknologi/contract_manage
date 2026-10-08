import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

// Components...
import { Button } from '@/components/ui/buttons/Button';
import InputError from '@/components/ui/forms/InputError';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialogs/Dialog';

export default function DeleteUser({ className }: { className?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        clearErrors();
        reset();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={className || 'text-text-soft hover:text-danger cursor-pointer text-xs font-semibold underline transition-colors'}
                >
                    Close Account
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border border-slate-200/80 bg-slate-100/90 p-6 text-slate-800 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100">
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-zinc-100">Apakah Anda yakin ingin menghapus akun?</DialogTitle>
                <DialogDescription className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                    Setelah akun Anda dihapus, semua data dan sumber daya di dalamnya akan terhapus secara permanen. Silakan masukkan password Anda
                    untuk mengonfirmasi penghapusan akun secara permanen.
                </DialogDescription>
                <form className="mt-4 space-y-4" onSubmit={deleteUser}>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="sr-only">
                            Password
                        </Label>

                        <Input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Masukkan Password Anda"
                            autoComplete="current-password"
                            className="border-surface-border h-10 rounded-lg"
                        />

                        <InputError message={errors.password} />
                    </div>

                    <DialogFooter className="mt-6 flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary" onClick={closeModal} className="h-10 rounded-lg px-4 text-xs font-bold">
                                Batal
                            </Button>
                        </DialogClose>

                        <Button type="submit" variant="destructive" disabled={processing} className="h-10 rounded-lg px-4 text-xs font-bold">
                            Hapus Akun
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
