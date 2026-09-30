<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ExcelTransferService;
use App\Services\ExcelWorkbookService;
use App\Services\MicrosoftGraphExcelService;
use App\Models\CourseAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExcelController extends Controller
{
    public function __construct(private ExcelTransferService $transfer, private ExcelWorkbookService $workbook, private MicrosoftGraphExcelService $graph) {}

    private function context(Request $request): array
    {
        return $request->validate([
            'class_id' => 'sometimes|integer|min:1',
            'semester_id' => 'sometimes|integer|min:1',
            'academic_year_id' => 'sometimes|integer|min:1',
            'course_assignment_id' => 'sometimes|integer|min:1',
            'date' => 'sometimes|date_format:Y-m-d',
            'search' => 'sometimes|string|max:100',
            'class_name' => 'sometimes|string|max:100',
            'status' => 'sometimes|string|max:50',
            'gender' => 'sometimes|in:L,P',
            'subject_id' => 'sometimes|integer|min:1',
            'teacher_id' => 'sometimes|integer|min:1',
            'student_id' => 'sometimes|integer|min:1',
            'grade' => 'sometimes|in:X,XI,XII',
            'study_group' => 'sometimes|string|max:100',
            'employment_status' => 'sometimes|string|max:50',
            'subject' => 'sometimes|string|max:100',
            'group' => 'sometimes|string|max:100',
            'type' => 'sometimes|string|max:100',
            'role' => 'sometimes|string|max:100',
            'ids' => 'sometimes|string|regex:/^\d+(,\d+)*$/|max:2000',
            'day_of_week' => 'sometimes|string|max:20',
            'activity_name' => 'sometimes|string|max:150',
        ]);
    }

    public function template(Request $request, string $module): BinaryFileResponse|JsonResponse
    {
        $this->transfer->authorize($module, $request->user(), $this->context($request), true);
        try {
            $path = $this->workbook->write($this->transfer->headers($module), []);
            return response()->download($path, "template-{$module}.xlsx", [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if ($e instanceof ValidationException || $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                throw $e;
            }
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal membuat template Excel.',
            ], 500);
        }
    }

    public function export(Request $request, string $module): BinaryFileResponse|JsonResponse
    {
        $context = $this->context($request);
        try {
            $rows = $this->transfer->export($module, $request->user(), $context);
            $path = $this->workbook->write($this->transfer->headers($module), $rows);
            return response()->download($path, "e-raport-{$module}-" . now()->format('Ymd-His') . '.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if ($e instanceof ValidationException || $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                throw $e;
            }
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal mengekspor data Excel.',
            ], 500);
        }
    }

    public function preview(Request $request, string $module): JsonResponse
    {
        $context = $this->context($request);
        $request->validate(['source' => 'required|in:local,onedrive', 'file' => 'required_if:source,local|file|max:5120',
            'file_id' => 'required_if:source,onedrive|string|max:300', 'file_name' => 'nullable|string|max:255',
            'sheet' => 'nullable|string|max:100']);
        try {
            if ($request->input('source') === 'local') {
                $file = $request->file('file');
                if (strtolower($file->getClientOriginalExtension()) !== 'xlsx') {
                    throw new RuntimeException('Hanya file .xlsx yang didukung.');
                }
                $parsed = $this->workbook->read($file->getRealPath(), $request->input('sheet'));
                $rows = $parsed['rows'];
                $fileName = $file->getClientOriginalName();
                $sheet = $parsed['sheet'];
            } else {
                $token = $this->graphToken($request);
                $fileId = $request->input('file_id');
                $sheets = $this->graph->worksheets($token, $fileId);
                $sheet = $request->input('sheet') ?: ($sheets[0]['name'] ?? null);
                if (!$sheet || !in_array($sheet, array_column($sheets, 'name'), true)) throw new RuntimeException('Worksheet tidak ditemukan.');
                $rows = $this->graph->usedRange($token, $fileId, $sheet);
                $fileName = $request->input('file_name', 'OneDrive.xlsx');
            }
            $result = $this->transfer->preview($module, $request->user(), $context, $rows);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['file' => $exception->getMessage()]);
        }
        $id = (string) Str::uuid();
        Cache::put('excel_preview:' . $id, ['user_id' => $request->user()->id, 'module' => $module,
            'context' => $context, 'rows' => $result['rows'], 'source' => $request->input('source'),
            'file' => $fileName, 'sheet' => $sheet], now()->addMinutes(30));
        $assignment = isset($context['course_assignment_id']) ? CourseAssignment::with(['schoolClass', 'subject', 'semester'])->find($context['course_assignment_id']) : null;
        $schoolClass = $assignment?->schoolClass ?: (isset($context['class_id']) ? SchoolClass::find($context['class_id']) : null);
        $semester = $assignment?->semester ?: (isset($context['semester_id']) ? Semester::with('academicYear')->find($context['semester_id']) : null);
        return response()->json(['success' => true, 'data' => array_merge($result,
            ['preview_id' => $id, 'file' => $fileName, 'sheet' => $sheet, 'module' => $module, 'context' => $context,
                'context_labels' => ['class' => $schoolClass?->name, 'subject' => $assignment?->subject?->name,
                    'semester' => $semester?->name, 'academic_year' => $semester?->academicYear?->name]])]);
    }

    public function commit(Request $request, string $module): JsonResponse
    {
        $data = $request->validate(['preview_id' => 'required|uuid', 'confirm_updates' => 'accepted']);
        $key = 'excel_preview:' . $data['preview_id'];
        $preview = Cache::get($key);
        if (!$preview || $preview['user_id'] !== $request->user()->id || $preview['module'] !== $module) {
            throw ValidationException::withMessages(['preview_id' => 'Preview kedaluwarsa atau bukan milik Anda.']);
        }
        if (count(array_filter($preview['rows'], fn ($row) => $row['status'] === 'ERROR')) > 0) {
            throw ValidationException::withMessages(['rows' => 'Perbaiki seluruh baris ERROR sebelum import.']);
        }
        $count = $this->transfer->commit($module, $request->user(), $preview['context'], $preview['rows'], $preview);
        Cache::forget($key);
        return response()->json(['success' => true, 'data' => ['saved_count' => $count], 'message' => "{$count} baris berhasil diimport."]);
    }

    public function microsoftStatus(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => ['configured' => $this->configured(),
            'connected' => (bool) $request->session()->get('graph_excel.refresh_token')]]);
    }

    public function microsoftConnect(Request $request)
    {
        abort_unless($this->configured(), 503, 'Integrasi Microsoft 365 belum dikonfigurasi.');
        $state = Str::random(48);
        $verifier = Str::random(90);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        $request->session()->put('graph_excel.oauth', ['state' => $state, 'verifier' => $verifier,
            'user_id' => $request->user()->id, 'time' => time()]);
        $query = http_build_query(['client_id' => config('services.microsoft_excel.client_id'),
            'response_type' => 'code', 'redirect_uri' => route('excel.microsoft.callback'),
            'response_mode' => 'query', 'scope' => 'offline_access Files.ReadWrite', 'state' => $state,
            'code_challenge' => $challenge, 'code_challenge_method' => 'S256']);
        return redirect('https://login.microsoftonline.com/' . rawurlencode(config('services.microsoft_excel.tenant')) . '/oauth2/v2.0/authorize?' . $query);
    }

    public function microsoftCallback(Request $request)
    {
        $oauth = $request->session()->pull('graph_excel.oauth');
        abort_unless($oauth && hash_equals($oauth['state'], (string) $request->query('state'))
            && $oauth['user_id'] === $request->user()?->id && time() - $oauth['time'] < 600, 403);
        $response = Http::asForm()->timeout(25)->post('https://login.microsoftonline.com/' . rawurlencode(config('services.microsoft_excel.tenant')) . '/oauth2/v2.0/token', [
            'client_id' => config('services.microsoft_excel.client_id'), 'client_secret' => config('services.microsoft_excel.client_secret'),
            'code' => $request->query('code'), 'redirect_uri' => route('excel.microsoft.callback'),
            'grant_type' => 'authorization_code', 'code_verifier' => $oauth['verifier'],
        ]);
        abort_unless($response->successful(), 502, 'Gagal menghubungkan Microsoft 365.');
        $this->storeGraphTokens($request, $response->json());
        return redirect(rtrim(config('services.microsoft_excel.frontend_url'), '/') . '/?excel_microsoft=connected');
    }

    public function microsoftFiles(Request $request): JsonResponse
    {
        $request->validate(['folder_id' => 'nullable|string|max:300']);
        try {
            $files = $this->graph->files($this->graphToken($request), $request->query('folder_id'));
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['microsoft' => $exception->getMessage()]);
        }
        return response()->json(['success' => true, 'data' => $files]);
    }

    public function microsoftSheets(Request $request, string $fileId): JsonResponse
    {
        try {
            $sheets = $this->graph->worksheets($this->graphToken($request), $fileId);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['microsoft' => $exception->getMessage()]);
        }
        return response()->json(['success' => true, 'data' => $sheets]);
    }

    private function graphToken(Request $request): string
    {
        $tokens = $request->session()->get('graph_excel');
        if (!$tokens || empty($tokens['refresh_token'])) throw ValidationException::withMessages(['microsoft' => 'Hubungkan Microsoft 365 terlebih dahulu.']);
        if (($tokens['expires_at'] ?? 0) > time() + 60) return $tokens['access_token'];
        $response = Http::asForm()->timeout(25)->post('https://login.microsoftonline.com/' . rawurlencode(config('services.microsoft_excel.tenant')) . '/oauth2/v2.0/token', [
            'client_id' => config('services.microsoft_excel.client_id'), 'client_secret' => config('services.microsoft_excel.client_secret'),
            'refresh_token' => $tokens['refresh_token'], 'grant_type' => 'refresh_token', 'scope' => 'offline_access Files.ReadWrite',
        ]);
        if (!$response->successful()) throw ValidationException::withMessages(['microsoft' => 'Sesi Microsoft berakhir. Hubungkan ulang.']);
        $this->storeGraphTokens($request, $response->json());
        return $request->session()->get('graph_excel.access_token');
    }

    private function storeGraphTokens(Request $request, array $data): void
    {
        $previous = $request->session()->get('graph_excel', []);
        $request->session()->put('graph_excel', ['access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'] ?? ($previous['refresh_token'] ?? null),
            'expires_at' => time() + ($data['expires_in'] ?? 3600)]);
    }

    private function configured(): bool
    {
        return (bool) (config('services.microsoft_excel.client_id') && config('services.microsoft_excel.client_secret'));
    }
}
