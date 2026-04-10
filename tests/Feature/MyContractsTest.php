<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Contract;
use App\Models\ContractType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class MyContractsTest extends TestCase
{
    use RefreshDatabase;

    public function test_my_contracts_page_only_shows_user_contracts()
    {
        // 1. Create two users
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        // 2. Create a contract type
        $type = ContractType::create(['name' => 'Service Agreement']);

        // 3. Create contracts for both users
        Contract::factory()->create([
            'title' => 'User 1 Contract',
            'created_by' => $user1->id,
            'contract_type_id' => $type->id,
        ]);

        Contract::factory()->create([
            'title' => 'User 2 Contract',
            'created_by' => $user2->id,
            'contract_type_id' => $type->id,
        ]);

        // 4. Act as User 1 and visit my-contracts
        $response = $this->actingAs($user1)->get('/my-contracts');

        // 5. Assert the response is OK and contains only User 1's contract
        $response->assertInertia(fn (Assert $page) => $page
            ->component('contracts/index')
            ->has('contracts', 1)
            ->where('contracts.0.title', 'User 1 Contract')
        );
    }
}
