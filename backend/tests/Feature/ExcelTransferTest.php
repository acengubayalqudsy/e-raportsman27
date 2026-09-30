<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\Room;
use App\Models\CourseAssignment;
use App\Models\ClassMember;
use App\Models\SchoolClass;
use App\Services\AcademicAuthorizationService;
use App\Models\User;
use App\Services\ExcelTransferService;
use App\Services\ExcelWorkbookService;
use App\Services\MicrosoftGraphExcelService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExcelTransferTest extends TestCase
{
    public function test_xlsx_roundtrip_preserves_identifiers_and_escapes_text(): void
    {
        $service = app(ExcelWorkbookService::class);
        $path = $service->write(['NISN', 'Nama'], [['00123456', 'A & B'], ['=1+1', '<script>']]);
        try {
            $parsed = $service->read($path);
            $this->assertSame(['NISN', 'Nama'], $parsed['rows'][0]);
            $this->assertSame(['00123456', 'A & B'], $parsed['rows'][1]);
            $this->assertSame(['=1+1', '<script>'], $parsed['rows'][2]);
        } finally {
            unlink($path);
        }
    }

    public function test_import_matches_nisn_independent_of_row_order_and_rejects_unknown_student(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $students = Student::orderBy('id')->limit(2)->get();
        $service = app(ExcelTransferService::class);
        $first = $students[0];
        $second = $students[1];
        $result = $service->preview('students', $admin, [], [
            ['Nama', 'NISN', 'NIS', 'JK', 'Kelas'],
            ['Updated Second', $second->nisn, $second->nis, $second->gender, $second->current_class_name],
            ['Updated First', $first->nisn, $first->nis, $first->gender, $first->current_class_name],
            ['Unknown', '9999999999', '9999999', 'L', 'X Merdeka 1'],
        ]);
        $this->assertSame(3, $result['total']);
        $this->assertSame(1, $result['errors']);
        $this->assertSame($second->id, $result['rows'][0]['target_id']);
        $this->assertSame($first->id, $result['rows'][1]['target_id']);
        $this->assertSame('ERROR', $result['rows'][2]['status']);
    }

    public function test_excel_write_routes_remain_admin_only_for_master_data(): void
    {
        $teacher = User::where('username', 'dev_guru_walikelas')->firstOrFail();
        $this->actingAs($teacher)->get('/api/v1/excel/teachers/export')->assertForbidden();
        $this->get('/api/v1/excel/students/template')->assertForbidden();
    }

    public function test_local_preview_requires_confirmation_and_commit_updates_only_matching_student(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $student = Student::firstOrFail();
        $original = $student->name;
        $path = app(ExcelWorkbookService::class)->write(['NISN', 'NIS', 'Nama', 'JK', 'Kelas'],
            [[$student->nisn, $student->nis, 'Nama Dari Excel', $student->gender, $student->current_class_name]]);
        try {
            $upload = new UploadedFile($path, 'siswa.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $this->actingAs($admin);
            $preview = $this->postJson('/api/v1/excel/students/preview', ['source' => 'local', 'file' => $upload])
                ->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.warnings', 1);
            $this->assertSame($original, $student->fresh()->name);
            $id = $preview->json('data.preview_id');
            $this->postJson('/api/v1/excel/students/commit', ['preview_id' => $id])->assertUnprocessable();
            $this->postJson('/api/v1/excel/students/commit', ['preview_id' => $id, 'confirm_updates' => true])
                ->assertOk()->assertJsonPath('data.saved_count', 1);
            $this->assertSame('Nama Dari Excel', $student->fresh()->name);
        } finally {
            if (file_exists($path)) unlink($path);
        }
    }

    public function test_graph_uses_official_v1_workbook_endpoints(): void
    {
        Http::fake([
            'graph.microsoft.com/v1.0/me/drive/items/file123/workbook/worksheets' => Http::response(['value' => [['name' => 'Nilai', 'id' => 'sheet1']]]),
            'graph.microsoft.com/v1.0/me/drive/items/file123/workbook/worksheets/Nilai/usedRange(valuesOnly=true)' => Http::response(['values' => [['NISN', 'Nilai'], ['00123456', 88]]]),
        ]);
        $graph = app(MicrosoftGraphExcelService::class);
        $this->assertSame('Nilai', $graph->worksheets('token', 'file123')[0]['name']);
        $this->assertSame(88, $graph->usedRange('token', 'file123', 'Nilai')[1][1]);
        Http::assertSentCount(2);
        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer token'));
    }

    public function test_duplicate_student_referenced_once_by_nisn_and_once_by_nis_is_rejected(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $student = Student::firstOrFail();
        $result = app(ExcelTransferService::class)->preview('students', $admin, [], [
            ['NISN', 'NIS', 'Nama'],
            [$student->nisn, '', $student->name],
            ['', $student->nis, $student->name],
        ]);
        $this->assertSame(1, $result['errors']);
        $this->assertSame('ERROR', $result['rows'][1]['status']);
    }

    public function test_room_import_uses_room_id_when_codes_are_shared(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $original = Room::firstOrFail();
        $other = $original->replicate();
        $other->save();
        $result = app(ExcelTransferService::class)->preview('rooms', $admin, [], [
            ['Ruangan ID', 'Tahun Pelajaran ID', 'Kode', 'Nama'],
            [$other->id, $other->academic_year_id, $other->code, 'Nama Ruangan Baru'],
        ]);
        $this->assertSame($other->id, $result['rows'][0]['target_id']);
        $this->assertSame('WARNING', $result['rows'][0]['status']);
    }

    public function test_microsoft_callback_keeps_oauth_state_in_web_session(): void
    {
        config()->set('services.microsoft_excel.client_id', 'test-client');
        config()->set('services.microsoft_excel.client_secret', 'test-secret');
        config()->set('services.microsoft_excel.tenant', 'organizations');
        config()->set('services.microsoft_excel.frontend_url', 'http://localhost:5173');
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $this->actingAs($admin);
        $connect = $this->get('/excel/microsoft/connect')->assertRedirect();
        parse_str(parse_url($connect->headers->get('Location'), PHP_URL_QUERY), $parameters);
        $this->assertSame(url('/excel/microsoft/callback'), $parameters['redirect_uri']);
        Http::fake(['login.microsoftonline.com/*/oauth2/v2.0/token' => Http::response([
            'access_token' => 'test-access', 'refresh_token' => 'test-refresh', 'expires_in' => 3600,
        ])]);
        $this->get('/excel/microsoft/callback?state=' . urlencode($parameters['state']) . '&code=test-code')->assertRedirect();
        $this->getJson('/api/v1/excel/microsoft/status')->assertOk()->assertJsonPath('data.connected', true);
    }

    public function test_validation_and_student_activity_exports_use_selected_class_and_semester(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $assignment = CourseAssignment::firstOrFail();
        $context = ['class_id' => $assignment->class_id, 'semester_id' => $assignment->semester_id];
        $transfer = app(ExcelTransferService::class);
        $validation = $transfer->export('validation_status', $admin, $context);
        $this->assertNotEmpty($validation);
        $this->assertContains((string) $assignment->id, array_map(static fn ($row) => (string) $row[0], $validation));
        $this->assertIsArray($transfer->export('cocurriculars', $admin, $context));
        $this->assertIsArray($transfer->export('homeroom_notes', $admin, $context));
    }

    public function test_teacher_student_export_requires_actual_class_membership(): void
    {
        $teacher = User::where('username', 'dev_guru_walikelas')->firstOrFail();
        $classId = app(AcademicAuthorizationService::class)->getAllowedClassIds($teacher)[0];
        $student = Student::firstOrFail();
        $student->current_class_name = SchoolClass::findOrFail($classId)->name;
        $student->save();
        ClassMember::where('student_id', $student->id)->delete();
        $rows = app(ExcelTransferService::class)->export('students', $teacher, []);
        $this->assertNotContains($student->nisn, array_column($rows, 0));
    }

    public function test_authenticated_admin_students_template_returns_200(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $response = $this->actingAs($admin)->get('/api/v1/excel/students/template');
        $response->assertOk();
        $this->assertStringContainsString('spreadsheetml.sheet', (string) $response->headers->get('content-type'));
    }

    public function test_unauthenticated_request_students_template_returns_401(): void
    {
        $response = $this->get('/api/v1/excel/students/template', [
            'Accept' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        ]);
        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_unauthenticated_request_without_json_accept_still_returns_401(): void
    {
        $response = $this->get('/api/v1/excel/students/template', [
            'Accept' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
        $response->assertStatus(401);
    }

    public function test_students_template_headers_exact_and_valid_xlsx(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $response = $this->actingAs($admin)->get('/api/v1/excel/students/template');
        $response->assertOk();

        $content = $response->streamedContent();
        $tempFile = tempnam(sys_get_temp_dir(), 'test_tpl_');
        file_put_contents($tempFile, $content);
        try {
            $parsed = app(ExcelWorkbookService::class)->read($tempFile);
            $this->assertSame('Data', $parsed['sheet']);
            $this->assertSame(
                ['NISN', 'NIS', 'Nama', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Kelas', 'Agama', 'Status'],
                $parsed['rows'][0]
            );
            $this->assertCount(1, $parsed['rows']); // Header row only, 0 data rows
        } finally {
            if (file_exists($tempFile)) unlink($tempFile);
        }
    }

    public function test_other_templates_still_work(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $this->actingAs($admin);
        $this->get('/api/v1/excel/teachers/template')->assertOk();
        $this->get('/api/v1/excel/classes/template')->assertOk();
        $this->get('/api/v1/excel/subjects/template')->assertOk();
    }

    public function test_local_preview_is_read_only_and_does_not_mutate_database(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $student = Student::firstOrFail();
        $initialName = $student->name;
        $studentCountBefore = Student::count();

        $path = app(ExcelWorkbookService::class)->write(
            ['NISN', 'NIS', 'Nama', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Kelas', 'Agama', 'Status'],
            [[$student->nisn, $student->nis, 'Nama Baru Belum Disimpan', $student->gender, 'Bandung', '2008-01-01', $student->current_class_name, 'Islam', 'Aktif']]
        );

        try {
            $upload = new UploadedFile($path, 'siswa.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $response = $this->actingAs($admin)->postJson('/api/v1/excel/students/preview', [
                'source' => 'local',
                'file' => $upload,
            ]);

            $response->assertOk();
            $this->assertSame($studentCountBefore, Student::count(), 'Preview must not alter student count');
            $this->assertSame($initialName, $student->fresh()->name, 'Preview must not mutate student data');
        } finally {
            if (file_exists($path)) unlink($path);
        }
    }

    public function test_invalid_student_workbook_headers_returns_422_with_clear_message(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        // Simulate arbitrary workbook (e.g. Legger format with unrelated columns)
        $path = app(ExcelWorkbookService::class)->write(
            ['No', 'Nama Siswa', 'PAI', 'PPKn', 'BIN', 'MTK', 'Rata-rata'],
            [['1', 'Siswa A', '85', '80', '90', '78', '83.25']]
        );

        try {
            $upload = new UploadedFile($path, 'legger_incompatible.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $response = $this->actingAs($admin)->postJson('/api/v1/excel/students/preview', [
                'source' => 'local',
                'file' => $upload,
            ]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['file']);
            $this->assertStringContainsString('Format file tidak sesuai template Import Siswa', $response->json('errors.file.0'));
        } finally {
            if (file_exists($path)) unlink($path);
        }
    }

    public function test_unsupported_module_preview_returns_422(): void
    {
        $admin = User::where('username', 'dev_admin')->firstOrFail();
        $path = app(ExcelWorkbookService::class)->write(['Col1'], [['Val1']]);
        try {
            $upload = new UploadedFile($path, 'dummy.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $response = $this->actingAs($admin)->postJson('/api/v1/excel/unsupported_module/preview', [
                'source' => 'local',
                'file' => $upload,
            ]);
            $response->assertStatus(422);
        } finally {
            if (file_exists($path)) unlink($path);
        }
    }
}
