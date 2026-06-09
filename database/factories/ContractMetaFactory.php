<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\ContractMeta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContractMeta>
 */
class ContractMetaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contract_id' => Contract::factory(),
            'kop_topik' => $this->faker->sentence(3),
            'kop_sub_topik' => $this->faker->sentence(5),
            'kop_lampiran' => 'Lampiran ' . $this->faker->word(),
            'f1_tujuan' => $this->faker->company(),
            'f1_sifat' => $this->faker->randomElement(['BIASA', 'RAHASIA', 'SANGAT RAHASIA']),
            'p1_entity' => $this->faker->company(),
            'p1_signer' => $this->faker->name(),
            'p1_signer_position' => $this->faker->jobTitle(),
            'p1_address' => $this->faker->address(),
            'p2_entity' => $this->faker->company(),
            'p2_signer' => $this->faker->name(),
            'p2_signer_position' => $this->faker->jobTitle(),
            'p2_address' => $this->faker->address(),
            'f2_scope' => $this->faker->paragraph(),
            'f2_price' => 'Rp ' . number_format($this->faker->numberBetween(1000000, 100000000), 0, ',', '.'),
            'f2_payment' => $this->faker->sentence(),
            'f2_tenure' => $this->faker->numberBetween(1, 12) . ' Bulan',
            'f2_location' => $this->faker->city(),
        ];
    }
}
