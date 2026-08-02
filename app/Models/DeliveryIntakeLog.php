<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class DeliveryIntakeLog extends Model
{
    use HasFactory, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'supplier_id',
        'staff_name',
        'packaging_intact',
        'vehicle_safe',
        'comment',
        'signature',
    ];

    protected $casts = [
        'log_date' => 'date:Y-m-d',
        'packaging_intact' => 'boolean',
        'vehicle_safe' => 'boolean',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function products()
    {
        return $this->hasMany(DeliveryIntakeProduct::class);
    }
}
