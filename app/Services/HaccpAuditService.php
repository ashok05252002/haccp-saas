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

        $amendedByName = null;
        if ($user) {
            $amendedByName = trim($user->name ?? '');
            if (empty($amendedByName)) {
                $amendedByName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            }
        }

        // Fallback to staff name from the original log if Auth name is not available
        if (empty($amendedByName)) {
            if (!empty($originalData['staff_name'])) {
                $amendedByName = $originalData['staff_name'];
            } elseif (!empty($originalData['signed_by_staff_name'])) {
                $amendedByName = $originalData['signed_by_staff_name'];
            } elseif (!empty($log->staff_name)) {
                $amendedByName = $log->staff_name;
            } elseif (!empty($log->staff_member)) {
                $amendedByName = $log->staff_member;
            } elseif (isset($log->staff) && !empty($log->staff->name)) {
                $amendedByName = $log->staff->name;
            }
        }

        // Ensure created_at / updated_at are strictly preserved in data arrays if missing
        if (!array_key_exists('created_at', $originalData)) {
            $originalData['created_at'] = $log->created_at;
        }
        if (!array_key_exists('updated_at', $originalData)) {
            // originalData updated_at might have been before the update if passed correctly
            $originalData['updated_at'] = $log->updated_at;
        }
        
        if (!array_key_exists('created_at', $newData)) {
            $newData['created_at'] = $log->created_at;
        }
        if (!array_key_exists('updated_at', $newData)) {
            $newData['updated_at'] = $log->updated_at;
        }

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
            'amended_by_name' => $amendedByName,
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
