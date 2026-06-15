<?php

namespace App\Http\Actions\Contract;

use App\Models\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetAuditTrailAction
{
    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $query = $contract->histories()->with('actor')->orderBy('created_at', 'desc');

        if ($request->action) {
            $query->where('action', $request->action);
        }
        if ($request->actor_id) {
            $query->where('actor_id', $request->actor_id);
        }
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->search) {
            $query->where('description', 'like', '%'.$request->search.'%');
        }

        return response()->json($query->get()->map(function ($h) {
            return [
                'id' => $h->id,
                'action' => $h->action,
                'description' => $h->description,
                'actor' => $h->actor ? [
                    'id' => $h->actor->id,
                    'name' => $h->actor->name,
                ] : null,
                'created_at' => $h->created_at->format('d/m/Y H:i'),
            ];
        }));
    }
}
