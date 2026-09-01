<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class Ingredient extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'tenant_id',
        'name',
        'uom_id',
        'ingredient_category_id',
        'cost_price',
        'cost_quantity',
        'unit_cost',
        'status',
    ];

    protected $casts = [
        'cost_price'    => 'float',
        'cost_quantity' => 'float',
        'unit_cost'     => 'float',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function uom()
    {
        return $this->belongsTo(Uom::class, 'uom_id');
    }

    public function category()
    {
        return $this->belongsTo(IngredientCategory::class, 'ingredient_category_id');
    }
}
