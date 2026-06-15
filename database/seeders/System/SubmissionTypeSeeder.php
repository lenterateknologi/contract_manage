<?php

namespace Database\Seeders\System;

use App\Models\SubmissionType;
use Illuminate\Database\Seeder;

class SubmissionTypeSeeder extends Seeder
{
    public function run(): void
    {
        $submissionTypes = [
            ['code' => 'F1', 'name' => 'Formulir Permintaan Perjanjian'],
            ['code' => 'F2', 'name' => 'Resume dan Persetujuan'],
            ['code' => 'AGREEMENT', 'name' => 'Dokumen Perjanjian'],
        ];

        foreach ($submissionTypes as $type) {
            SubmissionType::updateOrCreate(['code' => $type['code']], $type);
        }
    }
}
