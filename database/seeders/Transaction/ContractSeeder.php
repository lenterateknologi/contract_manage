<?php

namespace Database\Seeders\Transaction;

use App\Models\Master\ContractStatus;
use App\Models\Master\ContractType;
use App\Models\Master\User;
use App\Models\Master\Vendor;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractMeta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContractSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::whereHas('roleRelation', fn ($q) => $q->where('name', 'Staff'))->first();
        $manager = User::whereHas('roleRelation', fn ($q) => $q->where('name', 'Manager'))->first();
        $vendor = Vendor::first();
        $type = ContractType::first();
        $draftStatus = ContractStatus::where('code', 'draft')->first();

        if (! $staff || ! $vendor || ! $type || ! $draftStatus) {
            return;
        }

        // 1. Create a few sample contracts
        for ($i = 1; $i <= 5; $i++) {
            $contract = Contract::create([
                'title' => "Sample Contract #$i - ".Str::random(5),
                'contract_no' => 'REQ/2026/06/'.str_pad($i, 3, '0', STR_PAD_LEFT),
                'contract_type_id' => $type->id,
                'vendor_id' => $vendor->id,
                'status' => $draftStatus->code,
                'created_by' => $staff->id,
                'initiated_by_id' => $staff->id,
            ]);

            ContractMeta::create([
                'contract_id' => $contract->id,
                'f2_price' => rand(1000000, 50000000),
            ]);
        }
    }
}
