<?php

namespace App\Actions\Contract;

use App\Models\Contract;
use App\Models\ContractHistory;
use Illuminate\Support\Facades\Auth;

class UpdateContractAction
{
    public function execute(Contract $contract, array $validated): Contract
    {
        $contract->update($validated);

        if (! empty($validated['contract_type_id'])) {
            $contract->contract_type = $contract->contractType?->name ?? $contract->contract_type;
            $contract->save();
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'CONTRACT_UPDATED',
            'description' => 'Informasi kontrak diperbarui',
            'actor_id' => Auth::id(),
        ]);

        return $contract;
    }
}
