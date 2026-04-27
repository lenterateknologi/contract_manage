<?php

namespace Database\Seeders;

use App\Models\SubmissionType;
use Illuminate\Database\Seeder;

class SubmissionTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'N', 'name' => 'Perjanjan Baru'],
            ['code' => 'A', 'name' => 'Addendum/Amandment'],
            ['code' => 'R', 'name' => 'Review'],
            ['code' => 'P', 'name' => 'Surat Kuasa'],
        ];

        foreach ($types as $t) {
            SubmissionType::updateOrCreate(['code' => $t['code']], $t);
        }
    }
}
