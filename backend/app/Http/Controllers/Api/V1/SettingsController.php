<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    private const GROUPS = ['identity', 'academic', 'report', 'system'];

    public function show(string $group): JsonResponse
    {
        abort_unless(in_array($group, self::GROUPS, true), 404);
        $stored = DB::table('application_settings')->where('key', $group)->value('value');

        return response()->json(['data' => $stored ? json_decode($stored, true) : null]);
    }

    public function update(Request $request, string $group): JsonResponse
    {
        abort_unless(in_array($group, self::GROUPS, true), 404);
        $rules = match ($group) {
            'identity' => [
                'schoolName' => 'required|string|max:200', 'npsn' => ['required', 'digits:8'],
                'address' => 'required|string|max:2000', 'phone' => 'required|string|max:50',
                'email' => 'required|email|max:200', 'principal' => 'required|string|max:200',
                'postalCode' => 'nullable|string|max:20', 'website' => 'nullable|url|max:255',
                'nss' => 'nullable|string|max:30', 'principalNip' => 'nullable|string|max:30',
                'village' => 'nullable|string|max:100', 'district' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100', 'province' => 'nullable|string|max:100',
                'logo' => 'nullable|string|max:3000000',
                'logoRemoved' => 'sometimes|boolean',
            ],
            'academic' => [
                'academicYear' => ['required', 'string', 'max:20', Rule::exists('academic_years', 'name')->whereNull('deleted_at')],
                'semester' => ['required', Rule::in(['Ganjil', 'Genap'])],
                'semesterStartDate' => 'required|date', 'semesterEndDate' => 'required|date|after_or_equal:semesterStartDate',
                'reportDistributionDate' => 'nullable|date', 'schoolDays' => 'required|integer|min:1|max:366',
                'classNameFormat' => 'required|string|max:50',
                'semesterEnabled' => 'required|boolean', 'scoreInputEnabled' => 'required|boolean',
                'attendanceInputEnabled' => 'required|boolean', 'reportGenerationEnabled' => 'required|boolean',
            ],
            'report' => [
                'reportFormat' => 'required|string|max:50', 'paperSize' => 'required|string|max:20',
                'orientation' => ['required', Rule::in(['Portrait', 'Landscape'])],
                'showSchoolLogo' => 'required|boolean', 'showNis' => 'required|boolean',
                'showNisn' => 'required|boolean', 'showStudentPhoto' => 'required|boolean',
                'components' => 'required|array', 'components.*' => 'required|boolean',
                'predicates' => 'sometimes|array', 'descriptionLength' => 'required|string|max:30',
                'showNumericScore' => 'required|boolean', 'showPredicate' => 'required|boolean',
                'showDescription' => 'required|boolean',
            ],
            'system' => [
                'applicationName' => 'required|string|max:120', 'version' => 'nullable|string|max:30',
                'language' => 'required|string|max:50', 'dateFormat' => 'required|string|max:30',
                'timezone' => ['required', Rule::in(['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'])],
                'defaultItemsPerPage' => ['required', Rule::in(['8', '10', '20', '50'])],
                'sidebarDefault' => ['required', Rule::in(['Expanded', 'Collapsed'])],
                'compactTable' => 'required|boolean', 'showBreadcrumb' => 'required|boolean',
                'interfaceAnimation' => 'required|boolean', 'systemNotifications' => 'required|boolean',
                'incompleteScoreNotifications' => 'required|boolean', 'printableReportNotifications' => 'required|boolean',
                'activityNotifications' => 'required|boolean', 'sessionTimeout' => 'required|string|max:30',
                'confirmImportantActions' => 'required|boolean',
            ],
        };
        $data = $request->validate($rules);
        if ($group === 'academic') {
            $exists = DB::table('semesters')->join('academic_years', 'academic_years.id', '=', 'semesters.academic_year_id')
                ->where('academic_years.name', $data['academicYear'])->where('semesters.name', $data['semester'])
                ->whereNull('semesters.deleted_at')->exists();
            if (!$exists) {
                return response()->json(['message' => 'Semester tidak tersedia pada tahun ajaran yang dipilih.'], 422);
            }
        }
        if ($group === 'identity' && !empty($data['logo']) && !preg_match('/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/', $data['logo'])) {
            return response()->json(['message' => 'Logo harus berupa gambar PNG atau JPG.'], 422);
        }
        DB::transaction(function () use ($group, $data, $request) {
            if ($group === 'academic') {
                $yearId = DB::table('academic_years')->where('name', $data['academicYear'])->whereNull('deleted_at')->value('id');
                $semesterId = DB::table('semesters')->where('academic_year_id', $yearId)
                    ->where('name', $data['semester'])->whereNull('deleted_at')->value('id');
                DB::table('academic_years')->where('status', 'Aktif')->where('id', '!=', $yearId)->update(['status' => 'Tidak Aktif']);
                DB::table('academic_years')->where('id', $yearId)->update(['status' => 'Aktif']);
                DB::table('semesters')->where('status', 'Aktif')->where('id', '!=', $semesterId)->update(['status' => 'Tidak Aktif']);
                DB::table('semesters')->where('id', $semesterId)->update(['status' => 'Aktif']);
            }
            DB::table('application_settings')->updateOrInsert(['key' => $group], [
                'value' => json_encode($data, JSON_UNESCAPED_UNICODE), 'updated_at' => now(), 'created_at' => now(),
            ]);
            AuditLog::create([
                'user_id' => $request->user()->id, 'action' => 'settings.update',
                'description' => "Pengaturan {$group} diperbarui.", 'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return response()->json(['data' => $data, 'message' => 'Pengaturan berhasil disimpan.']);
    }

    public function logs(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user.roles')->latest('id')->limit(1000)->get()->map(fn (AuditLog $log) => [
            'id' => $log->id, 'date' => $log->created_at?->format('Y-m-d'),
            'timestamp' => $log->created_at?->timezone('Asia/Jakarta')->format('d/m/Y H:i'),
            'user' => $log->user?->name ?? 'Sistem',
            'role' => $log->user?->getPrimaryRole()?->display_name ?? '-',
            'module' => explode('.', $log->action)[0] ?: 'Sistem',
            'activity' => $log->action, 'target' => $log->description ?? '-',
            'status' => 'Berhasil', 'detail' => $log->description ?? '-',
        ]);

        return response()->json(['data' => $logs]);
    }
}
