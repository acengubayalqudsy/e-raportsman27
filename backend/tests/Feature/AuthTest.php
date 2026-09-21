<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthTest extends TestCase
{
    /**
     * Test 1 & 2: Database connectivity and core tables existence.
     */
    public function test_database_connection_and_required_tables_exist(): void
    {
        $this->assertDatabaseHas('roles', ['name' => 'admin']);
        $this->assertDatabaseHas('roles', ['name' => 'guru']);
        $this->assertDatabaseHas('roles', ['name' => 'walikelas']);
        $this->assertDatabaseHas('roles', ['name' => 'kepala_sekolah']);
        $this->assertDatabaseHas('roles', ['name' => 'siswa']);
        $this->assertDatabaseHas('users', ['username' => 'dev_admin']);
    }

    /**
     * Test 3: CSRF cookie endpoint responds with 204 No Content and sets XSRF-TOKEN cookie.
     */
    public function test_sanctum_csrf_cookie_endpoint_works(): void
    {
        $response = $this->get('/sanctum/csrf-cookie');
        $response->assertNoContent(); // HTTP 204
        $response->assertCookie('XSRF-TOKEN');
    }

    /**
     * Test 4: Successful login with valid development credentials.
     */
    public function test_login_success_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'dev_admin',
            'password' => 'DevAdmin@2026!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login berhasil.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'username',
                        'name',
                        'email',
                        'is_active',
                        'roles',
                        'primary_role',
                    ],
                ],
            ]);

        $this->assertAuthenticatedAs(User::where('username', 'dev_admin')->first());
    }

    public function test_linked_teacher_can_login_with_nip(): void
    {
        $user = User::where('username', 'dev_guru_walikelas')->firstOrFail();
        $teacher = $user->teacher ?: Teacher::factory()->create(['user_id' => $user->id]);
        $teacher->update(['nip' => '198001012005011099']);

        $this->postJson('/api/v1/auth/login', [
            'identifier' => '198001012005011099',
            'password' => 'DevGuru@2026!',
        ])->assertOk()
            ->assertJsonPath('data.user.nip', '198001012005011099');
    }

    public function test_non_admin_school_roles_cannot_access_admin_master_data(): void
    {
        foreach (['walikelas', 'kepala_sekolah'] as $roleName) {
            $role = Role::where('name', $roleName)->firstOrFail();
            $user = User::factory()->create();
            $user->roles()->attach($role->id, ['is_primary' => true]);

            $this->actingAs($user)
                ->getJson('/api/v1/master/students')
                ->assertForbidden();

        }
    }

    /**
     * Test 5: Login failure with wrong password returns 401 without leaking info.
     */
    public function test_login_fails_with_incorrect_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'dev_admin',
            'password' => 'WrongPassword123!',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Kredensial yang diberikan tidak valid.',
            ]);

        $this->assertGuest();
    }

    /**
     * Test 6: Inactive account cannot login (returns 403).
     */
    public function test_inactive_account_cannot_login(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'dev_nonaktif',
            'password' => 'DevNonaktif@2026!',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Silakan hubungi administrator sekolah.',
            ]);

        $this->assertGuest();
    }

    /**
     * Test 7: Login regenerates session ID.
     */
    public function test_login_regenerates_session_id(): void
    {
        $sessionBefore = session()->getId();

        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'dev_admin',
            'password' => 'DevAdmin@2026!',
        ]);

        $sessionAfter = session()->getId();
        $this->assertNotEquals($sessionBefore, $sessionAfter);
    }

    /**
     * Test 8: /me endpoint returns authenticated user profile and roles without password hash.
     */
    public function test_me_endpoint_returns_authenticated_user_profile(): void
    {
        $user = User::where('username', 'dev_admin')->first();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'username' => 'dev_admin',
                        'email' => 'dev_admin@sman27garut.local',
                    ],
                ],
            ]);

        $json = $response->json();
        $this->assertArrayNotHasKey('password', $json['data']['user']);
        $this->assertArrayNotHasKey('remember_token', $json['data']['user']);
    }

    /**
     * Test 9: Unauthenticated request to protected endpoints is rejected with 401.
     */
    public function test_unauthenticated_user_cannot_access_protected_endpoints(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertStatus(401);

        $logoutResponse = $this->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(401);
    }

    /**
     * Test 10: Role-based authorization rejects unauthorized user with 403.
     */
    public function test_role_authorization_rejects_unauthorized_user(): void
    {
        $guruUser = User::where('username', 'dev_guru_walikelas')->first();

        // Accessing admin endpoint with guru account should return 403
        $response = $this->actingAs($guruUser)
            ->getJson('/api/v1/auth/test-role-admin');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.',
            ]);

        // Accessing guru endpoint with guru account should succeed
        $guruResponse = $this->actingAs($guruUser)
            ->getJson('/api/v1/auth/test-role-guru');

        $guruResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Akses guru terverifikasi.',
            ]);
    }

    /**
     * Test 11 & 12: Logout invalidates the server session.
     */
    public function test_logout_ends_user_session(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'dev_admin',
            'password' => 'DevAdmin@2026!',
        ]);

        $this->assertAuthenticated();

        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil. Sesi telah diakhiri.',
            ]);

        $this->assertGuest('web');

        // Flush in-memory cached guards to simulate next HTTP request cycle from browser
        $this->app['auth']->forgetGuards();

        // Verify that subsequent request to /me is unauthorized
        $meResponse = $this->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(401);
    }

    /**
     * Test 13: Rate limiter throttles consecutive failed login attempts.
     */
    public function test_login_rate_limiting_triggers_after_repeated_attempts(): void
    {
        $ip = '127.0.0.1';
        $identifier = 'dev_brute_test';

        // Clear before testing
        RateLimiter::clear(strtolower($identifier) . '|' . $ip);

        // Perform 5 failed attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'identifier' => $identifier,
                'password' => 'wrong',
            ]);
        }

        // The 6th attempt should be blocked with 429
        $throttledResponse = $this->postJson('/api/v1/auth/login', [
            'identifier' => $identifier,
            'password' => 'wrong',
        ]);

        $throttledResponse->assertStatus(429)
            ->assertJson([
                'success' => false,
            ]);

        RateLimiter::clear(strtolower($identifier) . '|' . $ip);
    }

    /**
     * Test 14: Multi-role user has both roles attached properly.
     */
    public function test_multi_role_user_has_both_roles(): void
    {
        $user = User::where('username', 'dev_guru_walikelas')->first();

        $this->assertTrue($user->hasRole('guru'));
        $this->assertTrue($user->hasRole('walikelas'));
        $this->assertFalse($user->hasRole('admin'));

        $this->assertEquals('guru', $user->getPrimaryRole()->name);
    }

    /**
     * Test 14: CSRF token cookie is properly set and readable for SPA requests.
     */
    public function test_csrf_cookie_is_provided_for_spa(): void
    {
        $response = $this->get('/sanctum/csrf-cookie');

        $response->assertNoContent();
        $response->assertCookie('XSRF-TOKEN');

        $cookie = $response->getCookie('XSRF-TOKEN');
        $this->assertNotNull($cookie);
        $this->assertNotEmpty($cookie->getValue());
    }
}
