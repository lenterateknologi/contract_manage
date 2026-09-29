<?php

namespace App\Http\Controllers\Contract\PurchaseOrder;

use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractPurchaseOrder;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContractPurchaseOrderController extends Controller
{
    use ApiResponse;

    /**
     * List POs for this contract.
     */
    public function index(string $contractId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $pos = $contract->purchaseOrders()->with('creator')->latest()->get();

        return $this->successResponse($pos, 'Purchase orders retrieved successfully');
    }

    /**
     * Store new PO for this contract.
     */
    public function store(string $contractId, Request $request): JsonResponse
    {
        $request->validate([
            'po_number' => 'required|string|max:100',
            'title' => 'nullable|string|max:255',
            'po_date' => 'nullable|date',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'vendor_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,cancelled,completed',
            'description' => 'nullable|string',
        ]);

        $contract = Contract::findOrFail($contractId);

        $po = $contract->purchaseOrders()->create([
            'po_number' => $request->input('po_number'),
            'title' => $request->input('title'),
            'po_date' => $request->input('po_date'),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'IDR'),
            'vendor_name' => $request->input('vendor_name', $contract->vendor?->vendor_name),
            'status' => $request->input('status', 'active'),
            'description' => $request->input('description'),
            'created_by' => Auth::id(),
        ]);

        return $this->successResponse([
            'purchase_order' => $po->load('creator'),
            'contract' => ContractFormatter::formatContract($contract->fresh(), true),
        ], 'Purchase Order berhasil ditambahkan', 201);
    }

    /**
     * Update existing PO.
     */
    public function update(string $contractId, string $poId, Request $request): JsonResponse
    {
        $request->validate([
            'po_number' => 'required|string|max:100',
            'title' => 'nullable|string|max:255',
            'po_date' => 'nullable|date',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'vendor_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,cancelled,completed',
            'description' => 'nullable|string',
        ]);

        $contract = Contract::findOrFail($contractId);
        $po = $contract->purchaseOrders()->findOrFail($poId);

        $po->update([
            'po_number' => $request->input('po_number'),
            'title' => $request->input('title'),
            'po_date' => $request->input('po_date'),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'IDR'),
            'vendor_name' => $request->input('vendor_name'),
            'status' => $request->input('status', 'active'),
            'description' => $request->input('description'),
            'updated_by' => Auth::id(),
        ]);

        return $this->successResponse([
            'purchase_order' => $po->fresh()->load('creator'),
            'contract' => ContractFormatter::formatContract($contract->fresh(), true),
        ], 'Purchase Order berhasil diperbarui');
    }

    /**
     * Delete PO.
     */
    public function destroy(string $contractId, string $poId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $po = $contract->purchaseOrders()->findOrFail($poId);
        $po->delete();

        return $this->successResponse([
            'contract' => ContractFormatter::formatContract($contract->fresh(), true),
        ], 'Purchase Order berhasil dihapus');
    }
}
