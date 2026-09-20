<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user login with stateful session.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
        ]);

        $throttleKey = Str::transliterate(Str::lower($validated['identifier']) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik.",
                'retry_after' => $seconds,
            ], 429);
        }

        // Find user by username or email
        $user = User::where('username', $validated['identifier'])
            ->orWhere('email', $validated['identifier'])
            ->with('roles')
            ->first();

        // Check credentials uniformly without leaking account existence
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'message' => 'Kredensial yang diberikan tidak valid.',
            ], 401);
        }

        // Check if account is active
        if (!$user->is_active) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Silakan hubungi administrator sekolah.',
            ], 403);
        }

        RateLimiter::clear($throttleKey);

        // Perform login and session regeneration
        Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Update last login timestamp
        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        // Log login audit
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'description' => "Pengguna {$user->username} berhasil login.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $this->formatUserResponse($user),
            ],
        ]);
    }

    /**
     * Handle user logout and session invalidation.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'LOGOUT',
                'description' => "Pengguna {$user->username} logout.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Sesi telah diakhiri.',
        ]);
    }

    /**
     * Get the authenticated user profile and roles.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('roles');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUserResponse($user),
            ],
        ]);
    }

    /**
     * Test authorization endpoint for admin role.
     */
    public function testAdmin(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Akses administrator terverifikasi.',
        ]);
    }

    /**
     * Test authorization endpoint for guru role.
     */
    public function testGuru(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Akses guru terverifikasi.',
        ]);
    }

    /**
     * Safely format user response without leaking sensitive fields.
     */
    private function formatUserResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'roles' => $user->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'is_primary' => (bool) $role->pivot->is_primary,
                ];
            }),
            'primary_role' => $user->getPrimaryRole()?->name,
        ];
    }
}
