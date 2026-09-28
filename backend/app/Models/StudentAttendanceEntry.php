<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAttendanceEntry extends Model
{
    protected $fillable = [
        'student_id',
        'class_id',
        'semester_id',
        'course_assignment_id',
        'attendance_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'student_id' => 'integer',
        'class_id' => 'integer',
        'semester_id' => 'integer',
        'course_assignment_id' => 'integer',
        'attendance_date' => 'date:Y-m-d',
    ];
}
