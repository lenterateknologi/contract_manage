<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractMessage;
use App\Services\Chat\ChatService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ChatController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ChatService $chatService
    ) {}

    /**
     * Display the global chat page.
     */
    public function index(Request $request, ?string $contractId = null): Response
    {
        $selectedId = $contractId ?: $request->query('contract_id');

        return Inertia::render('chat/ChatPage', [
            'initialContractId' => $selectedId,
            'breadcrumbs' => [
                ['title' => 'Diskusi', 'href' => '#', 'icon' => 'MessageSquare'],
                ['title' => 'Chat Center', 'href' => route('admin.chat.index'), 'icon' => 'MessagesSquare'],
            ],
        ]);
    }

    /**
     * Get discussions list with pagination and search/category filters.
     */
    public function getDiscussions(Request $request): JsonResponse
    {
        $user = Auth::user();
        $filters = [
            'search' => $request->query('search'),
            'category' => $request->query('category'),
            'unread_only' => $request->query('unread_only'),
        ];
        $perPage = $request->integer('per_page', 15);

        $discussions = $this->chatService->getDiscussions($user, $filters, $perPage);

        return $this->successResponse($discussions, 'Discussions retrieved successfully');
    }

    /**
     * Get discussion detail for a contract (header metadata + messages).
     */
    public function getDiscussionDetail(string $contractId, Request $request): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        if (strtoupper($contract->status) === 'DRAFT') {
            return $this->errorResponse('Kontrak berstatus DRAFT belum memiliki fitur chat.', 403);
        }

        if (! $this->chatService->isUserInvolved($contract, Auth::user())) {
            return $this->errorResponse('Anda tidak memiliki akses ke diskusi kontrak ini.', 403);
        }

        $limit = $request->integer('limit', $request->integer('per_page', 50));
        $search = $request->query('search');

        $detail = $this->chatService->getDiscussionDetail($contract, Auth::user(), $limit, $search);

        return $this->successResponse($detail, 'Discussion detail retrieved successfully');
    }

    /**
     * Get messages for a specific contract.
     */
    public function getMessages(string $contractId, Request $request): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        if (strtoupper($contract->status) === 'DRAFT') {
            return $this->errorResponse('Kontrak berstatus DRAFT belum memiliki fitur chat.', 403);
        }

        if (! $this->chatService->isUserInvolved($contract, Auth::user())) {
            return $this->errorResponse('Anda tidak memiliki akses ke diskusi kontrak ini.', 403);
        }

        $limit = $request->integer('limit', 100);
        $search = $request->query('search');
        $messages = $this->chatService->getContractMessages($contract, $limit, Auth::id(), $search);

        return $this->successResponse($messages, 'Contract messages retrieved successfully');
    }

    /**
     * Get detail of a single message.
     */
    public function getMessageDetail(string $messageId): JsonResponse
    {
        $detail = $this->chatService->getMessageDetail($messageId, Auth::id());
        if (! $detail) {
            return $this->errorResponse('Pesan tidak ditemukan.', 404);
        }

        return $this->successResponse($detail, 'Message detail retrieved successfully');
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
            return $this->errorResponse('Pesan atau lampiran harus diisi.', 422, ['message' => ['Pesan atau lampiran harus diisi.']]);
        }

        $contract = Contract::findOrFail($contractId);
        if (strtoupper($contract->status) === 'DRAFT') {
            return $this->errorResponse('Kontrak berstatus DRAFT belum dapat menggunakan fitur chat.', 403);
        }

        if (! $this->chatService->isUserInvolved($contract, Auth::user())) {
            return $this->errorResponse('Anda tidak memiliki akses ke diskusi kontrak ini.', 403);
        }

        $msg = $this->chatService->sendMessage(
            $contract,
            Auth::user(),
            $request->message,
            $request->file('attachment')
        );

        return $this->successResponse($this->chatService->formatMessage($msg, Auth::id()), 'Message sent successfully', 201);
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

        return $this->successResponse([
            'message_id' => $msg->id,
            'reactions' => $reactions,
        ], 'Reaction updated successfully');
    }

    /**
     * Mark messages as read for a contract.
     */
    public function markAsRead(string $contractId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);

        if (! $this->chatService->isUserInvolved($contract, Auth::user())) {
            return $this->errorResponse('Anda tidak memiliki akses ke diskusi kontrak ini.', 403);
        }

        $count = $this->chatService->markAsRead($contract, Auth::user());

        return $this->successResponse(['marked' => $count], 'Messages marked as read');
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
