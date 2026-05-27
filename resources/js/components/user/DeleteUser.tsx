import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

// Components...
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import InputError from '@/components/ui/base/InputError';
import { Label } from '@/components/ui/base/Label';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/overlays/Dialog';

export default function DeleteUser() {
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
                    className="text-xs font-semibold text-text-soft hover:text-danger underline cursor-pointer transition-colors"
                >
                    Close Account
                </button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-surface-border rounded-xl shadow-xl max-w-md p-6">
                <DialogTitle className="text-lg font-bold text-text-main">
                    Apakah Anda yakin ingin menghapus akun?
                </DialogTitle>
                <DialogDescription className="text-xs text-text-soft mt-2 leading-relaxed">
                    Setelah akun Anda dihapus, semua data dan sumber daya di dalamnya akan terhapus secara permanen. Silakan masukkan password Anda untuk mengonfirmasi penghapusan akun secara permanen.
                </DialogDescription>
                <form className="space-y-4 mt-4" onSubmit={deleteUser}>
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
                            className="h-10 rounded-lg border-surface-border"
                        />

                        <InputError message={errors.password} />
                    </div>

                    <DialogFooter className="mt-6 flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary" onClick={closeModal} className="h-10 rounded-lg text-xs font-bold px-4">
                                Batal
                            </Button>
                        </DialogClose>

                        <Button variant="destructive" disabled={processing} className="h-10 rounded-lg text-xs font-bold px-4" asChild>
                            <button type="submit">Hapus Akun</button>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
