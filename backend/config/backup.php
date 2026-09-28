<?php

return [
    'dump_binary' => env('MYSQLDUMP_BINARY', PHP_OS_FAMILY === 'Windows' && is_file('C:\\xampp\\mysql\\bin\\mysqldump.exe')
        ? 'C:\\xampp\\mysql\\bin\\mysqldump.exe' : 'mysqldump'),
    'mysql_binary' => env('MYSQL_BINARY', PHP_OS_FAMILY === 'Windows' && is_file('C:\\xampp\\mysql\\bin\\mysql.exe')
        ? 'C:\\xampp\\mysql\\bin\\mysql.exe' : 'mysql'),
];
