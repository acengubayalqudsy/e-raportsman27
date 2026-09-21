<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected $seed = true;

    /**
     * Set up testing environment and enforce strict database isolation.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $activeDb = DB::connection()->getDatabaseName();

        // Strict isolation check: NEVER allow tests to execute against development or production databases
        if ($activeDb !== ':memory:' && ($activeDb === 'eraport_sman27_dev' || !str_ends_with($activeDb, '_test'))) {
            $this->fail("ABORTED: Dangerous test database connection detected! Active database: '{$activeDb}'. Tests must strictly execute on an isolated database ending with '_test'.");
        }
    }
}
