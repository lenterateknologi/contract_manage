<?php

namespace Database\Seeders\Business;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            [
                // --- Internal ---
                'code'             => 'CTC0000158',
                'external_code'    => 'CTC0000158',
                'is_active'        => true,

                // --- Identitas ---
                'name'                        => 'Toko Palugada',
                'branch_name'                 => null,
                'company_type'                => 'Perorangan',
                'registration_number'         => 'CTC0000158',
                'agreement_number'            => '0000158/CTC/C/X/2021',
                'agreement_date'              => '2021-10-21 08:57:34',
                'approved_date'               => null,
                'is_upload_agreement'         => false,
                'master_agreement_attachment' => null,
                'vendor_status'               => null,
                'integrity_pact'              => true,
                'master_agreement'            => true,
                'is_single_vendor'            => false,
                'single_vendor_expired'       => null,
                'single_vendor_file'          => null,
                'compliance_level'            => null,
                'compliance_file'             => null,
                'coverage_area'               => null,
                'total_employees'             => null,
                'company_profile_attachment'  => null,
                'id_card_number'              => '4845148451545456',
                'id_card_file'                => null,
                'business_fields'             => [
                    [
                        'businessField' => '47192 - Perdagangan Eceran Berbagai Macam Barang Yang Utamanya Bukan Makanan, Minuman atau Tembakau (Barang-Barang Kelontong) Bukan di Toserba (Department Store)',
                    ],
                ],
                'business_fields_foreign'     => null,

                // --- Alamat ---
                'address'          => 'Jl. S Parman',
                'country'          => 'Indonesia',
                'region'           => 'Bengkulu',
                'city'             => 'Kota Bengkulu',
                'postal_code'      => '11430',
                'vendor_country'   => '343',
                'mailing_address'  => 'Jl. S Parman',
                'mailing_country'  => 'Indonesia',
                'mailing_region'   => null,
                'mailing_city'     => null,
                'mailing_postal_code' => null,

                // --- Kontak ---
                'email'         => 'procuremet1@fangionoperkasasejati.com',
                'phone'         => '0736048412',
                'fax'           => null,
                'pic_name'      => 'Helen',
                'pic_email'     => 'helen.zhu@first-resources.com',
                'pic_phone'     => '084512156456',
                'finance_email' => null,
                'tax_email'     => null,

                // --- NPWP (top-level) ---
                'npwp' => null,

                // --- Pajak ---
                'tax_type_npwp'        => 'NON_NPWP',
                'tax_type_pkp'         => null,
                'tax_pkp'              => null,
                'tax_type_bkp'         => null,
                'tax_ppn'              => '12.0',
                'tax_bkp_desc'         => null,
                'tax_jkp_desc'         => null,
                'tax_is_organization'  => false,
                'tax_is_siujk'         => null,
                'tax_pp23_number'      => null,
                'tax_pp23_expired_date'=> null,
                'tax_npwp_file'        => null,
                'tax_skpkp_file'       => null,
                'tax_jkp_file'         => null,
                'tax_pp23_attachment'  => null,

                // --- Data Array ---
                'bank_data'           => [],
                'payment_method_data' => [],
                'legality_data'       => null,

                // --- Raw COMA response ---
                'coma_data' => [
                    'businessTypeName'          => 'Perorangan',
                    'name'                      => 'Toko Palugada',
                    'branchName'                => null,
                    'address'                   => 'Jl. S Parman',
                    'country'                   => 'Indonesia',
                    'region'                    => 'Bengkulu',
                    'city'                      => 'Kota Bengkulu',
                    'postalCode'                => '11430',
                    'mailingAddress'            => 'Jl. S Parman',
                    'mailingCountry'            => 'Indonesia',
                    'mailingRegion'             => null,
                    'mailingCity'               => null,
                    'mailingPostalCode'         => null,
                    'companyEmail'              => 'procuremet1@fangionoperkasasejati.com',
                    'companyPhone'              => '0736048412',
                    'companyFax'                => null,
                    'pic'                       => 'Helen',
                    'picemail'                  => 'helen.zhu@first-resources.com',
                    'idCardNumber'              => '4845148451545456',
                    'picphone'                  => '084512156456',
                    'integrityPact'             => 'true',
                    'masterAgreement'           => 'true',
                    'status'                    => null,
                    'registrationNumber'        => 'CTC0000158',
                    'idCardFile'                => null,
                    'coverageArea'              => null,
                    'agreementDate'             => '2021-10-21T08:57:34.632525',
                    'approvedDate'              => null,
                    'isUploadAgreement'         => false,
                    'masterAgreementAttachment' => null,
                    'agreementNumber'           => '0000158/CTC/C/X/2021',
                    'financeEmail'              => null,
                    'taxEmail'                  => null,
                    'vendorCountry'             => '343',
                    'businessFieldsForeign'     => null,
                    'totalEmployees'            => null,
                    'companyProfileAttachment'  => null,
                    'isSingleVendor'            => false,
                    'singleVendorFile'          => null,
                    'singleVendorExpired'       => null,
                    'complianceFile'            => null,
                    'complianceLevel'           => null,
                    'businessFields' => [
                        [
                            'businessField' => '47192 - Perdagangan Eceran Berbagai Macam Barang Yang Utamanya Bukan Makanan, Minuman atau Tembakau (Barang-Barang Kelontong) Bukan di Toserba (Department Store)',
                        ],
                    ],
                    'bank'          => [],
                    'paymentMethod' => [],
                    'legality'      => null,
                    'tax' => [
                        'typeNpwp'         => 'NON_NPWP',
                        'npwp'             => null,
                        'npwpfile'         => null,
                        'typePkp'          => null,
                        'pkp'              => null,
                        'skpkpfile'        => null,
                        'typeBkp'          => null,
                        'ppn'              => '12.0',
                        'jkpfile'          => null,
                        'bkpDesc'          => null,
                        'jkpDesc'          => null,
                        'isOrganization'   => false,
                        'isSiujk'          => null,
                        'pp23number'       => null,
                        'pp23expiredDate'  => null,
                        'pp23attachment'   => null,
                    ],
                ],
            ],
        ];

        foreach ($vendors as $vendor) {
            Vendor::updateOrCreate(['code' => $vendor['code']], $vendor);
        }
    }
}
