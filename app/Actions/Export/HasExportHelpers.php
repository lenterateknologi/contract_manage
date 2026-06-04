<?php

namespace App\Actions\Export;

use App\Models\Contract;

trait HasExportHelpers
{
    public function applyInheritance(array $f1Data, Contract $contract, array $existingData = []): array
    {
        $contract->loadMissing(['initiator', 'creator', 'vendor', 'contractType']);

        $formData = array_merge($f1Data, $existingData);

        $inheritanceMap = [
            'meta_perjanjian_tentang' => 'meta_judul_kontrak',
            'meta_f2_scope' => 'meta_ringkasan_klausul',
            'meta_f2_price' => 'meta_nilai_transaksi',
            'meta_f2_payment' => 'meta_mekanisme_pembayaran',
            'meta_f2_tenure' => 'meta_masa_berlaku',
            'meta_f2_location' => 'meta_lokasi',
            'perjanjian_tentang' => 'meta_judul_kontrak',
            'f2_scope' => 'meta_ringkasan_klausul',
        ];

        foreach ($inheritanceMap as $f2Field => $f1Field) {
            if (empty($formData[$f2Field]) && ! empty($f1Data[$f1Field])) {
                $formData[$f2Field] = $f1Data[$f1Field];
            }
        }

        $f1PassthroughFields = [
            'meta_p1_entity', 'meta_p1_signer', 'meta_p1_signer_position', 'meta_p1_alamat',
            'meta_p2_entity', 'meta_p2_signer', 'meta_p2_signer_position', 'meta_p2_alamat',
            'meta_judul_kontrak', 'meta_tgl_dibuat', 'meta_tipe_perjanjian', 'meta_nomor',
            'meta_topik', 'meta_sub_topik', 'meta_ringkasan_klausul',
            'v_p1_entity', 'v_p2_entity',
        ];
        foreach ($f1PassthroughFields as $key) {
            if (empty($formData[$key]) && ! empty($f1Data[$key])) {
                $formData[$key] = $f1Data[$key];
            }
        }

        if (empty($formData['meta_p1_entity'])) {
            $formData['meta_p1_entity'] = 'PT. Lentera Teknologi';
        }
        if (empty($formData['meta_p1_signer'])) {
            $formData['meta_p1_signer'] = $contract->initiator->name ?: ($contract->creator->name ?? '');
        }
        if (empty($formData['meta_p1_signer_position'])) {
            $formData['meta_p1_signer_position'] = $contract->initiator->role ?? $contract->creator->role ?? 'Direktur';
        }
        if (empty($formData['meta_p1_alamat'])) {
            $formData['meta_p1_alamat'] = 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';
        }

        if ($contract->vendor_id && $contract->vendor) {
            $v = $contract->vendor;
            if (empty($formData['meta_p2_entity'])) {
                $formData['meta_p2_entity'] = $v->name;
            }
            if (empty($formData['meta_p2_signer'])) {
                $formData['meta_p2_signer'] = $v->pic_name;
            }
            if (empty($formData['meta_p2_signer_position'])) {
                $formData['meta_p2_signer_position'] = $v->pic_position;
            }
            if (empty($formData['meta_p2_alamat'])) {
                $formData['meta_p2_alamat'] = $v->address;
            }
        }

        if (empty($formData['meta_nomor'])) {
            $formData['meta_nomor'] = $contract->contract_no;
        }
        if (empty($formData['meta_topik'])) {
            $formData['meta_topik'] = $contract->contractType->name ?? $contract->contract_type ?? '';
        }
        if (empty($formData['meta_tipe_perjanjian'])) {
            $formData['meta_tipe_perjanjian'] = $contract->transaction_type ?? 'Perjanjian Baru';
        }
        if (empty($formData['meta_tgl_dibuat'])) {
            $formData['meta_tgl_dibuat'] = $contract->contract_date ? $contract->contract_date->toDateString() : now()->toDateString();
        }

        return $formData;
    }
}
