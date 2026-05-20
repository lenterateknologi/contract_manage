<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Models\ContractFormSubmission;
use App\Models\ContractFormSubmissionVersion;
use App\Models\FormTemplate;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\ContractVersion;
use App\Models\SubmissionType;
use App\Models\Role;
use App\Models\User;
use App\Services\ContractWorkflowService;
use App\Actions\Contract\StoreContractAction;
use App\Actions\Contract\UpdateContractAction;
use App\Actions\Contract\ApproveContractAction;
use App\Actions\Contract\RejectContractAction;
use App\Actions\Contract\ExportContractAction;
use App\Actions\Contract\FileAction;
use App\Formatters\ContractFormatter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Jobs\GeneratePdfJob;
use Illuminate\Support\Facades\Cache;
use App\Models\Vendor;
use Illuminate\Support\Facades\URL;
use App\Models\AccessModule;

use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractFileController extends Controller
{
    private ContractWorkflowService $workflowService;
    private StoreContractAction $storeAction;
    private UpdateContractAction $updateAction;
    private ApproveContractAction $approveAction;
    private RejectContractAction $rejectAction;
    private FileAction $fileAction;
    private ExportContractAction $exportAction;

    public function __construct(
        ContractWorkflowService $workflowService,
        StoreContractAction $storeAction,
        UpdateContractAction $updateAction,
        ApproveContractAction $approveAction,
        RejectContractAction $rejectAction,
        FileAction $fileAction,
        ExportContractAction $exportAction
    ) {
        $this->workflowService = $workflowService;
        $this->storeAction = $storeAction;
        $this->updateAction = $updateAction;
        $this->approveAction = $approveAction;
        $this->rejectAction = $rejectAction;
        $this->fileAction = $fileAction;
        $this->exportAction = $exportAction;
    }

    
        public function uploadRevision(Request $request, string $id): JsonResponse
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->uploadRevision($contract, $request);
        }

    
    
        public function download(string $id): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->download($contract);
        }

    
    
        public function fileContent(string $id, int $versionNo, Request $request): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->fileContent($contract, $versionNo, $request);
        }

    
    
        public function attachmentFile(string $id, string $atId): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->attachmentFile($contract, $atId);
        }

    
    
        public function changeVersion(Request $request, string $id): JsonResponse
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->changeVersion($contract, $request);
        }

    
    
        public function pdfPreview(Request $request, string $id, int $versionNo): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->pdfPreview($contract, $versionNo, $request);
        }

    
    
        public function attachmentPdfPreview(string $id, string $atId): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->attachmentPdfPreview($contract, $atId);
        }

    
    
        public function vendorDocumentFile(string $id, string $docId): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->vendorDocumentFile($contract, $docId);
        }

    
    
        public function vendorDocumentPdfPreview(string $id, string $docId): mixed
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->vendorDocumentPdfPreview($contract, $docId);
        }

    
    
        public function uploadAttachment(Request $request, string $id): JsonResponse
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->uploadAttachment($contract, $request);
        }

    
    
        public function deleteAttachment(string $id, string $atId): JsonResponse
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->deleteAttachment($contract, $atId);
        }

        public function uploadAgreement(Request $request, string $id): JsonResponse
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->uploadAgreement($contract, $request);
        }

        public function getAgreementVersions(string $id): JsonResponse
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->getAgreementVersions($contract);
        }

        public function compareAgreementVersions(Request $request, string $id): \Inertia\Response
        {
            $contract = Contract::findOrFail($id);
            return $this->fileAction->compareAgreementVersions($contract, $request);
        }
}
