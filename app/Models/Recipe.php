<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class Recipe extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'name',
        'category',
        'prep_time',
        'servings',
        'description',
        'haccp_notes',
        'allergens',
        'status',
    ];

    protected $casts = [
        'allergens' => 'array',
        'servings' => 'integer',
    ];

    public function ingredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}
