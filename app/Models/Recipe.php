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

    protected $appends = [
        'cost_per_portion',
    ];

    public function getCostPerPortionAttribute()
    {
        $totalCost = 0;
        if ($this->relationLoaded('ingredients')) {
            foreach ($this->ingredients as $ing) {
                $master = $ing->masterIngredient;
                if ($master && $master->unit_cost) {
                    $totalCost += ($ing->quantity * $master->unit_cost);
                }
            }
        }
        $servings = $this->servings > 0 ? $this->servings : 1;
        return round($totalCost / $servings, 2);
    }

    public function ingredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}
