import React, { FormEventHandler } from 'react';
import {
    Briefcase,
    Building,
    Building2,
    Compass,
    Fingerprint,
    Globe,
    Layers,
    Loader2,
    MapPin,
    Save,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { Section } from './Section';
import { FormField } from './FormField';
import { StaticItem } from './StaticItem';
import { ProfileFormData, UserProfile } from '../../types/profile.types';

interface GeneralTabProps {
    user: UserProfile;
    department?: string;
    profileData: ProfileFormData;
    errors: Record<string, string>;
    onFieldChange: (field: keyof ProfileFormData, value: string) => void;
    onSubmit: FormEventHandler;
    isProcessing: boolean;
    isDirty: boolean;
}

export function GeneralTab({
    user,
    department,
    profileData,
    errors,
    onFieldChange,
    onSubmit,
    isProcessing,
    isDirty,
}: GeneralTabProps) {
    return (
        <div className="space-y-8">
            {/* Basic Info */}
            <Section title="Informasi Dasar" icon={User}>
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Nama Lengkap"
                            value={profileData.name}
                            onChange={(v) => onFieldChange('name', v)}
                            error={errors.name}
                        />
                        <FormField label="Username" value={profileData.username} readOnly />
                        <FormField
                            label="Email"
                            value={profileData.email}
                            onChange={(v) => onFieldChange('email', v)}
                            error={errors.email}
                        />
                        <FormField
                            label="Nomor WhatsApp"
                            value={profileData.phone}
                            onChange={(v) => onFieldChange('phone', v)}
                            error={errors.phone}
                        />
                        <div className="md:col-span-2">
                            <Label className="text-text-desc mb-1.5 block text-xs font-medium">Bio Profesional</Label>
                            <textarea
                                value={profileData.bio}
                                onChange={(e) => onFieldChange('bio', e.target.value)}
                                className="border-surface-border bg-surface-muted/10 focus:border-primary w-full rounded-lg border p-3 text-sm leading-relaxed transition-colors outline-none"
                                rows={4}
                                placeholder="Deskripsikan peran dan fokus profesional Anda..."
                            />
                        </div>
                    </div>

                    {isDirty && (
                        <div className="mt-6 flex justify-start animate-in fade-in duration-200">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isProcessing}
                                className="h-9 rounded-lg px-5 text-sm"
                            >
                                {isProcessing ? (
                                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                                ) : (
                                    <Save size={14} className="mr-1.5" />
                                )}
                                {isProcessing ? 'Menyimpan...' : 'Simpan Profil'}
                            </Button>
                        </div>
                    )}
                </form>
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
    );
}
