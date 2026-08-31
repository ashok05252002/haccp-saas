<?php

namespace App\Services;

use App\Models\HaccpLogAmendment;
use Illuminate\Support\Facades\Auth;

class HaccpAuditService
{
    /**
     * Log an amendment to a HACCP log.
     * 
     * @param mixed $log The original log model instance
     * @param string $logType String identifier for the log type
     * @param array $originalData Array of original values
     * @param array $newData Array of new values
     * @param string $reason The reason for the amendment
     * @param int|null $managerApprovedById Optional manager ID if approved via PIN
     * @param string|null $managerApprovedByName Optional manager name
     * @return HaccpLogAmendment
     */
    public function logAmendment(
        $log,
        string $logType,
        array $originalData,
        array $newData,
        string $reason,
        ?int $managerApprovedById = null,
        ?string $managerApprovedByName = null
    ) {
        $user = Auth::user();

        // Calculate specifically what changed
        $changedFields = [];
        foreach ($newData as $key => $value) {
            // Use loose comparison for typical request vs DB format changes, or strict if preferred.
            if (!array_key_exists($key, $originalData) || $originalData[$key] != $value) {
                $changedFields[$key] = [
                    'old' => $originalData[$key] ?? null,
                    'new' => $value
                ];
            }
        }

        return HaccpLogAmendment::create([
            'tenant_id' => $log->tenant_id,
            'branch_id' => $log->branch_id,
            'log_type' => $logType,
            'log_id' => $log->id,
            'amended_by_user_id' => $user ? $user->id : null,
            'amended_by_name' => $user ? trim($user->first_name . ' ' . $user->last_name) : null,
            'manager_approved_by_id' => $managerApprovedById,
            'manager_approved_by_name' => $managerApprovedByName,
            'reason' => $reason,
            'original_data' => $originalData,
            'new_data' => $newData,
            'changed_fields' => $changedFields,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
