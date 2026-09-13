<?php

namespace App\Services\Contract\Reference;

use App\Models\Contract;

class ContractReferenceService
{
    /**
     * Get referenced parent contract details.
     */
    public function getReference(Contract $contract): ?array
    {
        $contract->loadMissing('parent');

        if (! $contract->parent) {
            return null;
        }

        return [
            'id' => $contract->parent->id,
            'form_no' => $contract->parent->form_no,
            'contract_no' => $contract->parent->contract_no,
            'title' => $contract->parent->title,
            'status' => $contract->parent->status,
            'created_at' => $contract->parent->created_at?->toIso8601String(),
        ];
    }

    /**
     * Search available contracts to be linked as parent reference.
     */
    public function searchAvailableReferences(Contract $contract, ?string $keyword = null, int $limit = 10): array
    {
        $query = Contract::query()
            ->where('id', '!=', $contract->id);

        if ($keyword && trim($keyword) !== '') {
            $term = '%'.trim($keyword).'%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('form_no', 'like', $term)
                    ->orWhere('contract_no', 'like', $term);
            });
        }

        return $query->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'form_no' => $c->form_no,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'status' => $c->status,
                'created_at' => $c->created_at?->toIso8601String(),
            ])
            ->toArray();
    }

    /**
     * Link or unlink parent reference.
     */
    public function updateReference(Contract $contract, ?string $parentId): Contract
    {
        $contract->update([
            'parent_id' => $parentId,
        ]);

        $contract->load('parent');

        return $contract;
    }
}
