<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'restaurant_limit',
        'subscription_plan',
        'status',
    ];

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
