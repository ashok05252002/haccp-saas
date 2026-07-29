<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IngredientCategory extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function ingredients()
    {
        return $this->hasMany(Ingredient::class, 'ingredient_category_id');
    }
}
