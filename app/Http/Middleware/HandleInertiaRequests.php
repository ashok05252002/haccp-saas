<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? (function() use ($request) {
                    $user = $request->user();
                    if ($user->role === 'client') {
                        return $user->load(['tenant', 'tenant.branches']);
                    }
                    
                    if (!$user->role_id && $user->email) {
                        $restRoleId = \App\Models\RestaurantUser::where('tenant_id', $user->tenant_id)
                            ->where('email', $user->email)
                            ->value('role_id');
                        if ($restRoleId) {
                            $user->role_id = $restRoleId;
                            $user->saveQuietly();
                        }
                    }

                    $user->load(['tenant', 'branch', 'assignedRole']);

                    if ((!$user->relationLoaded('assignedRole') || !$user->assignedRole) && $user->role_id) {
                        $role = \App\Models\Role::withoutGlobalScopes()->find($user->role_id);
                        if ($role) {
                            $user->setRelation('assignedRole', $role);
                        }
                    }

                    return $user;
                })() : null,
                'active_branch_id' => \Illuminate\Support\Facades\Session::get('active_branch_id'),
                'available_branches' => $request->user() && $request->user()->role !== 'super_admin' 
                    ? \App\Models\Branch::where('tenant_id', $request->user()->tenant_id)->get() 
                    : [],
            ],
        ]);
    }
}
