<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryIntakeProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_intake_log_id',
        'food_item_id',
        'batch_number',
        'use_by_date',
        'quantity',
        'temperature',
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
    ];

    public function deliveryIntakeLog()
    {
        return $this->belongsTo(DeliveryIntakeLog::class);
    }

    public function foodItem()
    {
        return $this->belongsTo(FoodItem::class);
    }
}
