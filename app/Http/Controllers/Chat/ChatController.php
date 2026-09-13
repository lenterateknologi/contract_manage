<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractMessage;
use App\Services\Chat\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ChatController extends Controller
{
    public function __construct(
        protected ChatService $chatService
    ) {}

    /**
     * Display the global chat page.
     */
    public function index(Request $request, ?string $contractId = null): Response
    {
        $user = Auth::user();
        $selectedId = $contractId ?: $request->query('contract_id');
        $contractsData = $this->chatService->getInvolvedContracts($user, $selectedId);

        return Inertia::render('chat/ChatPage', [
            'contracts' => $contractsData,
            'initialContractId' => $selectedId,
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
        if (strtoupper($contract->status) === 'DRAFT') {
            return response()->json(['message' => 'Kontrak berstatus DRAFT belum memiliki fitur chat.'], 403);
        }

        $limit = $request->integer('limit', 100);
        $messages = $this->chatService->getContractMessages($contract, $limit, Auth::id());

        return response()->json($messages);
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
        if (strtoupper($contract->status) === 'DRAFT') {
            return response()->json(['message' => 'Kontrak berstatus DRAFT belum dapat menggunakan fitur chat.'], 403);
        }

        $msg = $this->chatService->sendMessage(
            $contract,
            Auth::user(),
            $request->message,
            $request->file('attachment')
        );

        return response()->json($this->chatService->formatMessage($msg, Auth::id()), 201);
    }

    /**
     * Toggle reaction on a message.
     */
    public function toggleReaction(Request $request, string $messageId): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string',
        ]);

        $msg = ContractMessage::findOrFail($messageId);
        $reactions = $this->chatService->toggleReaction($msg, Auth::user(), $request->emoji);

        return response()->json([
            'message_id' => $msg->id,
            'reactions' => $reactions,
        ]);
    }

    /**
     * Mark messages as read for a contract.
     */
    public function markAsRead(string $contractId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $count = $this->chatService->markAsRead($contract, Auth::user());

        return response()->json(['marked' => $count]);
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
