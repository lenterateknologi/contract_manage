<?php

use App\Models\Contract;
use App\Models\User;

test('it creates a contract and stores its metadata transparently in t_contract_meta', function () {
    $user = User::factory()->create();

    $contract = Contract::create([
        'contract_no' => 'CTR/2026/TEST-OPTIMIZE',
        'title' => 'Test Contract Optimization',
        'created_by' => $user->id,
        'kop_topik' => 'Penting Sekali',
        'kop_sub_topik' => 'Sub topik khusus',
        'p1_entity' => 'PT. Lentera Teknologi',
        'p2_entity' => 'PT. Vendor Indonesia',
        'f2_price' => 'Rp 150.000.000',
    ]);

    // Verify contract is stored in t_contracts
    $this->assertDatabaseHas('t_contracts', [
        'id' => $contract->id,
        'contract_no' => 'CTR/2026/TEST-OPTIMIZE',
    ]);

    // Verify metadata columns do NOT exist in t_contracts table (they should be in t_contract_meta)
    $this->assertDatabaseHas('t_contract_meta', [
        'contract_id' => $contract->id,
        'kop_topik' => 'Penting Sekali',
        'kop_sub_topik' => 'Sub topik khusus',
        'p1_entity' => 'PT. Lentera Teknologi',
        'p2_entity' => 'PT. Vendor Indonesia',
        'f2_price' => 'Rp 150.000.000',
    ]);

    // Verify transparent access via getters
    $retrieved = Contract::find($contract->id);
    expect($retrieved->kop_topik)->toBe('Penting Sekali');
    expect($retrieved->p1_entity)->toBe('PT. Lentera Teknologi');
    expect($retrieved->f2_price)->toBe('Rp 150.000.000');
});

test('it updates metadata transparently in t_contract_meta when updated on contract model', function () {
    $user = User::factory()->create();

    $contract = Contract::create([
        'contract_no' => 'CTR/2026/TEST-UPDATE',
        'title' => 'Test Update Contract',
        'created_by' => $user->id,
        'kop_topik' => 'Topik Awal',
        'p1_entity' => 'PT. Lentera Teknologi',
    ]);

    // Update metadata fields directly
    $contract->kop_topik = 'Topik Baru';
    $contract->p2_entity = 'Vendor Baru';
    $contract->save();

    // Verify in dbmeta
    $this->assertDatabaseHas('t_contract_meta', [
        'contract_id' => $contract->id,
        'kop_topik' => 'Topik Baru',
        'p1_entity' => 'PT. Lentera Teknologi',
        'p2_entity' => 'Vendor Baru',
    ]);

    // Fresh retrieve check
    $fresh = Contract::find($contract->id);
    expect($fresh->kop_topik)->toBe('Topik Baru');
    expect($fresh->p2_entity)->toBe('Vendor Baru');
});

test('it includes metadata attributes in toArray and JSON serialization', function () {
    $user = User::factory()->create();

    $contract = Contract::create([
        'contract_no' => 'CTR/2026/TEST-SERIALIZE',
        'title' => 'Test Serialize Contract',
        'created_by' => $user->id,
        'kop_topik' => 'Topik Serialize',
        'f2_price' => 'Rp 10.000.000',
    ]);

    $array = $contract->toArray();

    // Verify the appended attributes are serialized
    expect($array)->toHaveKey('kop_topik');
    expect($array['kop_topik'])->toBe('Topik Serialize');
    expect($array)->toHaveKey('f2_price');
    expect($array['f2_price'])->toBe('Rp 10.000.000');

    $json = json_encode($contract);
    $decoded = json_decode($json, true);
    expect($decoded)->toHaveKey('kop_topik');
    expect($decoded['kop_topik'])->toBe('Topik Serialize');
});
