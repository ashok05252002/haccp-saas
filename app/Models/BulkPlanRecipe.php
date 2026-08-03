<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BulkPlanRecipe extends Model
{
    protected $fillable = [
        'bulk_plan_id',
        'recipe_id',
        'recipe_name',
        'base_servings',
        'target_servings',
        'extra_buffer',
    ];

    protected $casts = [
        'extra_buffer' => 'boolean',
        'base_servings' => 'integer',
        'target_servings' => 'integer',
    ];

    public function bulkPlan()
    {
        return $this->belongsTo(BulkPlan::class, 'bulk_plan_id');
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class, 'recipe_id');
    }
}
