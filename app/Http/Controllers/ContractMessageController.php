<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContractMessageController extends Controller
{
    public function index(string $contractId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $messages = $contract->messages()->with('user')->orderBy('created_at')->get();

        return response()->json($messages->map(fn($m) => [
            'id'         => $m->id,
            'user_id'    => $m->user_id,
            'message'    => $m->message,
            'read_by'    => $m->read_by ?? [],
            'created_at' => $m->created_at->format('Y-m-d H:i'),
            'user'       => $m->user ? [
                'id'         => $m->user->id,
                'name'       => $m->user->name,
                'initials'   => $m->user->initials,
                'role'       => $m->user->role,
                'bg_color'   => $m->user->bg_color,
                'text_color' => $m->user->text_color,
            ] : null,
        ]));
    }

    public function store(Request $request, string $contractId): JsonResponse
    {
        $request->validate(['message' => 'required|string']);

        $contract = Contract::findOrFail($contractId);
        $userId   = Auth::id();

        $msg = ContractMessage::create([
            'contract_id' => $contract->id,
            'user_id'     => $userId,
            'message'     => $request->message,
            'read_by'     => [$userId],
        ]);

        $msg->load('user');

        return response()->json([
            'id'         => $msg->id,
            'user_id'    => $msg->user_id,
            'message'    => $msg->message,
            'read_by'    => $msg->read_by,
            'created_at' => $msg->created_at->format('Y-m-d H:i'),
            'user'       => $msg->user ? [
                'id'         => $msg->user->id,
                'name'       => $msg->user->name,
                'initials'   => $msg->user->initials,
                'role'       => $msg->user->role,
                'bg_color'   => $msg->user->bg_color,
                'text_color' => $msg->user->text_color,
            ] : null,
        ], 201);
    }

    public function markRead(string $contractId): JsonResponse
    {
        $userId   = Auth::id();
        $messages = ContractMessage::where('contract_id', $contractId)
            ->whereJsonDoesntContain('read_by', $userId)
            ->get();

        foreach ($messages as $msg) {
            $readBy = $msg->read_by ?? [];
            if (! in_array($userId, $readBy)) {
                $readBy[] = $userId;
                $msg->update(['read_by' => $readBy]);
            }
        }

        return response()->json(['marked' => $messages->count()]);
    }
}
