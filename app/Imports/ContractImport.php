<?php

namespace App\Imports;

use App\Models\Contract;
use App\Models\ContractType;
use App\Models\SubmissionType;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class ContractImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        $contractType = ContractType::where('name', $row['tipe_kontrak'])->first();
        $submissionType = SubmissionType::where('name', $row['tipe_pengajuan'])->first();
        $vendor = Vendor::where('name', $row['vendor'])->first();
        $creator = User::where('name', $row['pembuat'])->first();

        $id = isset($row['id']) && Str::isUuid($row['id']) ? $row['id'] : (string) Str::uuid();

        return Contract::updateOrCreate(
            ['id' => $id],
            [
                'contract_no' => $row['no_kontrak'] ?? null,
                'title' => $row['judul'],
                'crown_no' => $row['no_crown'] ?? null,
                'contract_type_id' => $contractType?->id,
                'submission_type_id' => $submissionType?->id,
                'status' => strtolower($row['status'] ?? 'draft'),
                'vendor_id' => $vendor?->id,
                'contract_date' => $row['tgl_kontrak'] ?? null,
                'end_date' => $row['tgl_berakhir'] ?? null,
                'created_by' => $creator->id ?? Auth::id(),
                'description' => $row['deskripsi'] ?? null,
            ],
        );
    }

    public function rules(): array
    {
        return [
            'judul' => 'required|string|max:255',
            'status' => 'nullable|string',
            'tipe_kontrak' => 'nullable|string',
        ];
    }
}
