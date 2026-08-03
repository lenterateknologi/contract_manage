<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ChatController extends Controller
{
    /**
     * Display the global chat page.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Fetch contracts that the user is involved in (Creator, Initiator, PIC, Manager, Approver, or message participant)
        $contracts = Contract::query()
            ->select(['id', 'form_no', 'contract_no', 'title', 'contract_type_id', 'created_by', 'updated_at'])
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('initiated_by_id', $user->id)
                    ->orWhere('assigned_pic_id', $user->id)
                    ->orWhere('assigned_by_id', $user->id)
                    ->orWhereHas('approvals', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    })
                    ->orWhereHas('messages', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
            })
            ->with([
                'creator:id,name,role_id',
                'contractType:id,name',
            ])
            ->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->whereJsonDoesntContain('read_by', $user->id);
            }])
            ->latest('updated_at')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'form_no' => $c->form_no,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'contract_type' => $c->contractType?->name ?? '—',
                'unread_count' => $c->unread_count ?? 0,
                'updated_at_formatted' => $c->updated_at?->diffForHumans() ?? '',
                'creator' => $c->creator ? ['id' => $c->creator->id, 'name' => $c->creator->name] : null,
            ]);

        return Inertia::render('chat/ChatPage', [
            'contracts' => $contracts,
            'initialContractId' => $request->query('contract_id'),
            'breadcrumbs' => [
                ['title' => 'Diskusi', 'href' => '#', 'icon' => 'MessageSquare'],
                ['title' => 'Chat Center', 'href' => route('admin.chat.index'), 'icon' => 'MessagesSquare'],
            ],
        ]);
    }

    /**
     * Get messages for a specific contract.
     */
    public function getMessages(string $contractId, Request $request): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $limit = $request->integer('limit', 100);

        $messages = $contract->messages()
            ->with(['user:id,name,role'])
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->reverse()
            ->values();

        return response()->json($messages->map(fn ($m) => [
            'id' => $m->id,
            'user_id' => $m->user_id,
            'message' => $m->message,
            'read_by' => $m->read_by ?? [],
            'created_at' => $m->created_at->format('Y-m-d H:i'),
            'attachment_url' => $m->attachment_path ? asset('storage/'.$m->attachment_path) : null,
            'attachment_name' => $m->attachment_name,
            'user' => $m->user ? [
                'id' => $m->user->id,
                'name' => $m->user->name,
                'initials' => $m->user->initials,
                'role' => $m->user->role,
            ] : null,
        ]));
    }

    /**
     * Send a new message.
     */
    public function sendMessage(Request $request, string $contractId): JsonResponse
    {
        $request->validate([
            'message' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240', // 10MB limit
        ]);

        if (! $request->message && ! $request->hasFile('attachment')) {
            return response()->json(['message' => 'Pesan atau lampiran harus diisi.'], 422);
        }

        $contract = Contract::findOrFail($contractId);
        $userId = Auth::id();

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('chat_attachments', 'public');
        }

        $msg = ContractMessage::create([
            'contract_id' => $contract->id,
            'user_id' => $userId,
            'message' => $request->message ?? '',
            'read_by' => [$userId],
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        $msg->load('user');

        return response()->json([
            'id' => $msg->id,
            'user_id' => $msg->user_id,
            'message' => $msg->message,
            'attachment_url' => $msg->attachment_path ? asset('storage/'.$msg->attachment_path) : null,
            'attachment_name' => $msg->attachment_name,
            'read_by' => $msg->read_by,
            'created_at' => $msg->created_at->format('Y-m-d H:i'),
            'user' => $msg->user ? [
                'id' => $msg->user->id,
                'name' => $msg->user->name,
                'initials' => $msg->user->initials,
                'role' => $msg->user->role,
            ] : null,
        ], 201);
    }

    /**
     * Mark messages as read for a contract.
     */
    public function markAsRead(string $contractId): JsonResponse
    {
        $userId = Auth::id();
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

    /**
     * Download or view message attachment.
     */
    public function downloadAttachment(string $messageId): BinaryFileResponse
    {
        $msg = ContractMessage::findOrFail($messageId);
        if (! $msg->attachment_path) {
            abort(404);
        }

        $path = storage_path('app/public/'.$msg->attachment_path);
        if (! file_exists($path)) {
            abort(404);
        }

        $mime = File::mimeType($path);

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.$msg->attachment_name.'"',
        ]);
    }
}
