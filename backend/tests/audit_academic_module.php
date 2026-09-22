<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\Room;
use App\Models\CourseAssignment;
use App\Models\HomeroomAssignment;
use App\Models\Schedule;
use App\Models\ClassMember;
use Illuminate\Support\Facades\DB;

echo "=== 1. ACADEMIC YEARS ===\n";
foreach (AcademicYear::all() as $y) {
    echo "ID: {$y->id} | Name: {$y->name} | Status: {$y->status} | Start: {$y->start_date} | End: {$y->end_date}\n";
}

echo "\n=== 2. SEMESTERS ===\n";
foreach (Semester::with('academicYear')->get() as $s) {
    echo "ID: {$s->id} | Name: {$s->name} | Year: {$s->academicYear?->name} (YearID: {$s->academic_year_id}) | Status: {$s->status} | is_active: {$s->is_active}\n";
}

echo "\n=== 3. CLASSES (COUNT: " . SchoolClass::count() . ") ===\n";
foreach (SchoolClass::with('academicYear')->take(10)->get() as $c) {
    echo "ID: {$c->id} | Code: {$c->code} | Name: {$c->name} | Grade: {$c->grade} | YearID: {$c->academic_year_id} | Year: {$c->academicYear?->name}\n";
}

echo "\n=== 4. CLASS MEMBERS (TOTAL: " . ClassMember::count() . ") ===\n";
echo "Class members per class:\n";
$cmStats = DB::table('class_members as cm')
    ->join('classes as c', 'c.id', '=', 'cm.class_id')
    ->join('semesters as s', 's.id', '=', 'cm.semester_id')
    ->select('c.name as class_name', 's.name as semester_name', 'cm.class_id', 'cm.semester_id', DB::raw('count(*) as count'))
    ->groupBy('c.name', 's.name', 'cm.class_id', 'cm.semester_id')
    ->get();
foreach ($cmStats as $st) {
    echo " - Class: {$st->class_name} | Sem: {$st->semester_name} | Count: {$st->count}\n";
}

echo "\n=== 5. CHECK CLASS 'Kelas X E2E UAT' ===\n";
$uatClass = SchoolClass::where('name', 'like', '%E2E UAT%')->first();
if ($uatClass) {
    echo "UAT Class ID: {$uatClass->id} | Name: {$uatClass->name} | YearID: {$uatClass->academic_year_id}\n";
    $uatMembers = ClassMember::with(['student' => fn($q) => $q->withTrashed()])->where('class_id', $uatClass->id)->get();
    foreach ($uatMembers as $m) {
        $st = Student::withTrashed()->find($m->student_id);
        echo " - Member ID: {$m->id} | StudentID: {$m->student_id} | Status: {$m->status} | Student found: " . ($st ? $st->name . " (deleted_at: " . ($st->deleted_at ?? 'null') . ")" : "COMPLETELY NOT FOUND IN STUDENTS TABLE") . "\n";
    }
} else {
    echo "No class named '%E2E UAT%'\n";
}

echo "\n=== 6. COURSE ASSIGNMENTS (TOTAL: " . CourseAssignment::count() . ") ===\n";
$caStats = DB::table('course_assignments')->select('role', DB::raw('count(*) as count'))->groupBy('role')->get();
foreach ($caStats as $st) {
    echo " - Role: {$st->role} | Count: {$st->count}\n";
}

echo "\n=== 7. HOMEROOM ASSIGNMENTS (TOTAL: " . HomeroomAssignment::count() . ") ===\n";
foreach (HomeroomAssignment::with(['teacher', 'schoolClass', 'semester'])->take(5)->get() as $h) {
    echo "ID: {$h->id} | Class: {$h->schoolClass?->name} | Teacher: {$h->teacher?->name} | Sem: {$h->semester?->name} | is_active: {$h->is_active}\n";
}

echo "\n=== 8. SCHEDULES (TOTAL: " . Schedule::count() . ") ===\n";
foreach (Schedule::with(['teacher', 'schoolClass', 'subject', 'room', 'semester'])->take(5)->get() as $sc) {
    echo "ID: {$sc->id} | Day: {$sc->day_of_week} | Time: {$sc->start_time}-{$sc->end_time} | Class: {$sc->schoolClass?->name} | Subject: {$sc->subject?->name} | Room: {$sc->room?->name}\n";
}

echo "\n=== 9. ROOMS (TOTAL: " . Room::count() . ") ===\n";
foreach (Room::all() as $r) {
    echo "ID: {$r->id} | Code: {$r->code} | Name: {$r->name} | Type: {$r->type} | Capacity: {$r->capacity} | Status: {$r->status}\n";
}
