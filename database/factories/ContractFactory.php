<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\ContractMeta;
use App\Models\ContractType;
use App\Models\SubmissionType;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $createdAt = $this->faker->dateTimeBetween('-6 months', 'now');
        $contractDate = clone $createdAt;
        $endDate = (clone $contractDate)->modify('+'.rand(1, 3).' years');

        return [
            'contract_no' => 'CTR/'.strtoupper(Str::random(5)).'/'.$createdAt->format('Ymd'),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'contract_date' => $contractDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'status' => $this->faker->randomElement(['draft', 'in_review', 'revision', 'approved', 'locked', 'archived']),
            'current_version' => rand(1, 5),
            'metadata' => json_encode(['sample' => true, 'source' => 'factory']),
            'submitted_at' => $this->faker->randomElement([null, $createdAt]),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
            'contract_type_id' => ContractType::inRandomOrder()->first()?->id ?? ContractType::factory(),
            'submission_type_id' => SubmissionType::inRandomOrder()->first()?->id,
            'created_by' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'initiated_by_id' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'vendor_id' => Vendor::inRandomOrder()->first()?->id ?? Vendor::factory(),
        ];
    }

    /**
     * Configure the factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Contract $contract) {
            ContractMeta::factory()->create([
                'contract_id' => $contract->id,
            ]);
        });
    }
}
