<?php

namespace App\Http\Actions\Export;

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
            $detail = $v->vendor_detail ?? [];
            $legality = $detail['legality'] ?? [];
            $tax = $detail['tax'] ?? [];
            $bankList = is_array($detail['bank'] ?? null) ? $detail['bank'] : [];
            $mainBank = collect($bankList)->first(fn ($b) => ($b['status'] ?? null) === 'Main' || ($b['isMain'] ?? false)) ?: ($bankList[0] ?? []);

            if (empty($formData['meta_p2_entity'])) {
                $formData['meta_p2_entity'] = $v->vendor_name ?? ($detail['company_name'] ?? '');
            }
            if (empty($formData['meta_p2_signer'])) {
                $formData['meta_p2_signer'] = $detail['pic'] ?? ($detail['pic_name'] ?? '');
            }
            if (empty($formData['meta_p2_signer_position'])) {
                $formData['meta_p2_signer_position'] = $detail['pic_position'] ?? ($detail['position'] ?? ($detail['jobTitle'][0] ?? ''));
            }
            if (empty($formData['meta_p2_alamat'])) {
                $formData['meta_p2_alamat'] = $detail['address'] ?? ($detail['mailingAddress'] ?? '');
            }

            // Vendor Legality
            if (empty($formData['meta_p2_nib'])) {
                $formData['meta_p2_nib'] = $legality['nib'] ?? '';
            }
            if (empty($formData['meta_p2_nib_expired'])) {
                $formData['meta_p2_nib_expired'] = $legality['nibexpiredDate'] ?? ($legality['nib_expired_date'] ?? '');
            }
            if (empty($formData['meta_p2_siup'])) {
                $formData['meta_p2_siup'] = $legality['siup'] ?? '';
            }
            if (empty($formData['meta_p2_siup_expired'])) {
                $formData['meta_p2_siup_expired'] = $legality['siupexpiredDate'] ?? ($legality['siup_expired_date'] ?? '');
            }
            if (empty($formData['meta_p2_tdp'])) {
                $formData['meta_p2_tdp'] = $legality['tdp'] ?? '';
            }
            if (empty($formData['meta_p2_tdp_expired'])) {
                $formData['meta_p2_tdp_expired'] = $legality['tdpexpiredDate'] ?? ($legality['tdp_expired_date'] ?? '');
            }
            if (empty($formData['meta_p2_izin_usaha'])) {
                $formData['meta_p2_izin_usaha'] = $legality['businessPermit'] ?? ($legality['businessLicence'] ?? '');
            }
            if (empty($formData['meta_p2_akta_pendirian'])) {
                $formData['meta_p2_akta_pendirian'] = $legality['memorandumOfAssociation'] ?? '';
            }
            if (empty($formData['meta_p2_sk_menkumham'])) {
                $formData['meta_p2_sk_menkumham'] = $legality['decissionLetterMenkumham'] ?? '';
            }

            // Vendor Tax
            if (empty($formData['meta_p2_npwp'])) {
                $formData['meta_p2_npwp'] = $tax['npwp'] ?? '';
            }
            if (empty($formData['meta_p2_npwp_status'])) {
                $formData['meta_p2_npwp_status'] = $tax['typeNpwp'] ?? '';
            }
            if (empty($formData['meta_p2_pkp_status'])) {
                $formData['meta_p2_pkp_status'] = $tax['typePkp'] ?? ($v->is_pkp ? 'PKP' : 'NON PKP');
            }
            if (empty($formData['meta_p2_pkp_no'])) {
                $formData['meta_p2_pkp_no'] = $tax['pkp'] ?? '';
            }
            if (empty($formData['meta_p2_ppn_tarif'])) {
                $formData['meta_p2_ppn_tarif'] = isset($tax['ppn']) && $tax['ppn'] !== null ? "{$tax['ppn']}%" : '';
            }
            if (empty($formData['meta_p2_pp23_no'])) {
                $formData['meta_p2_pp23_no'] = $tax['pp23number'] ?? '';
            }

            // Vendor Bank
            if (empty($formData['meta_p2_bank_name'])) {
                $formData['meta_p2_bank_name'] = $mainBank['bankName'] ?? ($mainBank['bank_name'] ?? '');
            }
            if (empty($formData['meta_p2_bank_account_no'])) {
                $formData['meta_p2_bank_account_no'] = $mainBank['accountNumber'] ?? ($mainBank['account_number'] ?? '');
            }
            if (empty($formData['meta_p2_bank_account_name'])) {
                $formData['meta_p2_bank_account_name'] = $mainBank['accountName'] ?? ($mainBank['account_name'] ?? '');
            }

            // Vendor Contact & Meta
            if (empty($formData['meta_p2_email'])) {
                $formData['meta_p2_email'] = $detail['companyEmail'] ?? ($detail['email'] ?? '');
            }
            if (empty($formData['meta_p2_phone'])) {
                $formData['meta_p2_phone'] = $detail['companyPhone'] ?? ($detail['phone'] ?? '');
            }
            if (empty($formData['meta_p2_pic_email'])) {
                $formData['meta_p2_pic_email'] = $detail['picemail'] ?? ($detail['pic_email'] ?? '');
            }
            if (empty($formData['meta_p2_pic_phone'])) {
                $formData['meta_p2_pic_phone'] = $detail['picphone'] ?? ($detail['pic_phone'] ?? '');
            }
            if (empty($formData['meta_p2_kode'])) {
                $formData['meta_p2_kode'] = $v->vendor_code ?? ($detail['registrationNumber'] ?? '');
            }
            if (empty($formData['meta_p2_bentuk_badan_usaha'])) {
                $formData['meta_p2_bentuk_badan_usaha'] = $detail['businessTypeName'] ?? ($detail['vendorType'] ?? '');
            }
            if (empty($formData['meta_p2_kota'])) {
                $formData['meta_p2_kota'] = $detail['city'] ?? '';
            }
            if (empty($formData['meta_p2_provinsi'])) {
                $formData['meta_p2_provinsi'] = $detail['province'] ?? ($detail['region'] ?? '');
            }
            if (empty($formData['meta_p2_kodepos'])) {
                $formData['meta_p2_kodepos'] = $detail['postalCode'] ?? '';
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
