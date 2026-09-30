<?php

namespace App\Http\Controllers;
abstract class Controller
{
    /**
     * Determine if a corrective action input is missing or invalid.
     * Invalid values include null, empty/whitespace strings, and case-insensitive 'n/a' or 'na'.
     */
    public static function isInvalidCorrectiveAction(?string $val): bool
    {
        if ($val === null) {
            return true;
        }
        $s = strtolower(trim($val));
        return $s === '' || $s === 'n/a' || $s === 'na';
    }
}
