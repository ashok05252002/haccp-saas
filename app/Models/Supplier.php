<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class Supplier extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'tenant_id',
        'name',
        'phone',
        'email',
        'address',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function categories()
    {
        return $this->belongsToMany(IngredientCategory::class, 'supplier_ingredient_categories');
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'supplier_ingredients');
    }
}
