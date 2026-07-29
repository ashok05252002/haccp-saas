<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'contact_person',
        'phone',
        'email',
        'order_day',
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
