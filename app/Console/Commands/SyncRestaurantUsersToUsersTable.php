<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RestaurantUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SyncRestaurantUsersToUsersTable extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'haccp:sync-staff-users {--password=123456 : Default password for staff users without set password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync all existing restaurant_users records into the main users table to enable web login via /login';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $defaultPassword = $this->option('password');
        $staffUsers = RestaurantUser::all();

        if ($staffUsers->isEmpty()) {
            $this->warn('No restaurant staff users found in restaurant_users table.');
            return 0;
        }

        $synced = 0;
        $skipped = 0;

        foreach ($staffUsers as $staff) {
            // Generate fallback email if missing
            $email = $staff->email;
            if (!$email) {
                $email = strtolower(str_replace(' ', '.', trim($staff->name))) . '@kitchen.local';
                $staff->email = $email;
                $staff->save();
            }

            // Check if user already exists in main users table
            $existingUser = User::where('tenant_id', $staff->tenant_id)
                ->where('email', $email)
                ->first();

            if ($existingUser) {
                // Update role_id, branch_id, and status
                $existingUser->update([
                    'name' => $staff->name,
                    'tenant_id' => $staff->tenant_id,
                    'branch_id' => $staff->branch_id,
                    'role_id' => $staff->role_id,
                    'role' => 'restaurant',
                    'status' => $staff->status ?: 'Active',
                ]);
                $skipped++;
            } else {
                // Create user account in main users table
                $passwordToUse = $staff->password ?: Hash::make($defaultPassword);

                User::create([
                    'name' => $staff->name,
                    'email' => $email,
                    'password' => $passwordToUse,
                    'tenant_id' => $staff->tenant_id,
                    'branch_id' => $staff->branch_id,
                    'role_id' => $staff->role_id,
                    'role' => 'restaurant',
                    'status' => $staff->status ?: 'Active',
                ]);

                $synced++;
            }
        }

        $this->info("Done! Synced {$synced} new staff user accounts to the main 'users' table ({$skipped} existing updated).");
        $this->line("Default fallback password for new accounts: {$defaultPassword}");

        return 0;
    }
}
