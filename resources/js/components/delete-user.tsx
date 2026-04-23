import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

// Components...
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
        <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Delete account</h3>
                <p className="text-[10px] text-slate-400 font-medium italic">Delete your account and all of its resources permanently.</p>
            </div>
            
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 transition-all hover:bg-red-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">Warning Zone</p>
                        <p className="text-[10px] font-medium text-red-500">Please proceed with caution, this cannot be undone.</p>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="h-9 px-4 rounded-lg text-xs font-black uppercase tracking-widest">Delete account</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
                            <DialogDescription>
                                Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password
                                to confirm you would like to permanently delete your account.
                            </DialogDescription>
                            <form className="space-y-6" onSubmit={deleteUser}>
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
                                        placeholder="Password"
                                        autoComplete="current-password"
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="secondary" onClick={closeModal}>
                                            Cancel
                                        </Button>
                                    </DialogClose>

                                    <Button variant="destructive" disabled={processing} asChild>
                                        <button type="submit">Delete account</button>
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
