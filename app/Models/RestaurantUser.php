<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class RestaurantUser extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'role_id',
        'name',
        'email',
        'phone',
        'pin_code',
        'password',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    public function assignedRole()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
