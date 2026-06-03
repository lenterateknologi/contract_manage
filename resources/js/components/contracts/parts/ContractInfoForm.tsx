import { cn } from '@/lib/utils';
import { ContractType } from '@/types/contracts';
import React from 'react';

interface ContractInfoFormProps {
    isDraft: boolean;
    title: string;
    setTitle: (val: string) => void;
    typeId: string;
    setTypeId: (val: string) => void;
    submissionTypeId: string;
    setSubmissionTypeId: (val: string) => void;
    vendorId: string;
    setVendorId: (val: string) => void;
    types: ContractType[];
    submissionTypes: any[];
    vendors: any[];
    selected: any;
    inputCls: string;
}

export function ContractInfoForm({
    isDraft,
    title,
    setTitle,
    typeId,
    setTypeId,
    submissionTypeId,
    setSubmissionTypeId,
    vendorId,
    setVendorId,
    types,
    submissionTypes,
    vendors,
    selected,
    inputCls,
}: ContractInfoFormProps) {
    return (
        <>
            <div className="flex flex-col gap-1">
                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">No. Pengajuan</div>
                <div className="text-text-main font-mono text-sm font-semibold">
                    {selected.contract_no}
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">No. Kontrak (F2)</div>
                <div className="text-primary text-sm font-bold">
                    {selected.crown_no || <span className="text-text-soft/40 italic font-medium text-xs">Belum diisi di F2</span>}
                </div>
            </div>

            {isDraft ? (
                <div className="flex flex-col gap-1.5">
                    <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Judul Kontrak</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Masukkan nama kontrak..."
                        className={inputCls}
                    />
                </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Jenis Kontrak</div>
                {isDraft ? (
                    <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls}>
                        <option value="">Pilih Tipe</option>
                        {Array.isArray(types) &&
                            types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                    </select>
                ) : (
                    <div className="text-text-main text-sm font-semibold">
                        {selected.contract_type}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Perjanjian</div>
                {isDraft ? (
                    <select value={submissionTypeId} onChange={(e) => setSubmissionTypeId(e.target.value)} className={inputCls}>
                        <option value="">Pilih Tipe</option>
                        {Array.isArray(submissionTypes) &&
                            submissionTypes.map((st) => (
                                <option key={st.id} value={st.id}>
                                    {st.name}
                                </option>
                            ))}
                    </select>
                ) : (
                    <div className="text-text-main text-sm font-semibold">{selected.submission_type || '—'}</div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Pihak Kedua (Vendor)</div>
                {isDraft ? (
                    <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls}>
                        <option value="">Pilih Vendor</option>
                        {Array.isArray(vendors) &&
                            vendors.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                    </select>
                ) : (
                    <div className="text-text-main text-sm font-semibold">
                        {selected.vendor?.name || '-'}
                    </div>
                )}
            </div>
        </>
    );
}
