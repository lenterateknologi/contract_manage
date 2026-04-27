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
            'attachment_url' => $m->attachment_path ? asset('storage/' . $m->attachment_path) : null,
            'attachment_name' => $m->attachment_name,
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
        $request->validate([
            'message' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240', // 10MB limit
        ]);

        if (!$request->message && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'Pesan atau lampiran harus diisi.'], 422);
        }

        $contract = Contract::findOrFail($contractId);
        $userId   = Auth::id();

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('chat_attachments', 'public');
        }

        $msg = ContractMessage::create([
            'contract_id' => $contract->id,
            'user_id'     => $userId,
            'message'     => $request->message ?? '',
            'read_by'     => [$userId],
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        $msg->load('user');

        return response()->json([
            'id'         => $msg->id,
            'user_id'    => $msg->user_id,
            'message'    => $msg->message,
            'attachment_url' => $msg->attachment_path ? asset('storage/' . $msg->attachment_path) : null,
            'attachment_name' => $msg->attachment_name,
            'read_by'     => $msg->read_by,
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

    public function downloadAttachment(string $messageId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $msg = ContractMessage::findOrFail($messageId);
        if (!$msg->attachment_path) abort(404);

        $path = storage_path('app/public/' . $msg->attachment_path);
        if (!file_exists($path)) abort(404);

        $mime = \Illuminate\Support\Facades\File::mimeType($path);

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $msg->attachment_name . '"'
        ]);
    }
}
