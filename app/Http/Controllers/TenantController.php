<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with(['users' => function($query) {
            $query->where('role', 'client');
        }])->get();

        $formatted = $tenants->map(function ($tenant) {
            $owner = $tenant->users->first();
            return [
                'id' => 'TN' . str_pad($tenant->id, 3, '0', STR_PAD_LEFT),
                'real_id' => $tenant->id,
                'TenantName' => $owner ? $owner->name : 'N/A',
                'businessName' => $tenant->name,
                'email' => $owner ? $owner->email : 'N/A',
                'phone' => null,
                'restaurantLimit' => $tenant->restaurant_limit,
                'subscriptionPlan' => $tenant->subscription_plan,
                'status' => $tenant->status,
                'createdAt' => $tenant->created_at->format('Y-m-d'),
                'restaurantsCreated' => 0, // Mocked for now until branches exist
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request)
    {
        $request->validate([
            'TenantName' => 'required|string',
            'businessName' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'restaurantLimit' => 'required|integer|min:1',
            'status' => 'required|string',
        ], [
            'restaurantLimit.required' => 'Restaurant limit is required.',
            'restaurantLimit.integer'  => 'Restaurant limit must be a whole number.',
            'restaurantLimit.min'      => 'Restaurant limit must be at least 1.',
        ]);

        DB::beginTransaction();
        try {
            $tenant = Tenant::create([
                'name' => $request->businessName,
                'restaurant_limit' => $request->restaurantLimit,
                'subscription_plan' => 'Standard',
                'status' => $request->status,
            ]);

            $user = User::create([
                'name' => $request->TenantName,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'client',
                'tenant_id' => $tenant->id,
            ]);

            DB::commit();
            return response()->json(['message' => 'Tenant created successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating tenant: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        
        $request->validate([
            'TenantName' => 'required|string',
            'businessName' => 'required|string',
            'email' => 'required|email',
            'restaurantLimit' => 'required|integer|min:1',
            'status' => 'required|string',
        ], [
            'restaurantLimit.required' => 'Restaurant limit is required.',
            'restaurantLimit.integer'  => 'Restaurant limit must be a whole number.',
            'restaurantLimit.min'      => 'Restaurant limit must be at least 1.',
        ]);

        DB::beginTransaction();
        try {
            $tenant->update([
                'name' => $request->businessName,
                'restaurant_limit' => $request->restaurantLimit,
                'status' => $request->status,
            ]);

            $owner = $tenant->users()->where('role', 'client')->first();
            if ($owner) {
                $owner->name = $request->TenantName;
                if ($owner->email !== $request->email) {
                    $request->validate(['email' => 'unique:users,email']);
                    $owner->email = $request->email;
                }
                if ($request->filled('password')) {
                    $owner->password = Hash::make($request->password);
                }
                $owner->save();
            }

            DB::commit();
            return response()->json(['message' => 'Tenant updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating tenant: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        User::where('tenant_id', $tenant->id)->delete();
        $tenant->delete();
        return response()->json(['message' => 'Tenant deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->status = $tenant->status === 'Active' ? 'Suspended' : 'Active';
        $tenant->save();
        return response()->json(['message' => 'Status toggled successfully', 'status' => $tenant->status]);
    }
}
