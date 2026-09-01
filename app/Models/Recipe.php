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
                $unitCost = 0;
                $masterUom = '';
                $master = $ing->masterIngredient;

                if ($master && $master->unit_cost) {
                    $unitCost = $master->unit_cost;
                    $masterUom = strtolower($master->uom->unit_code ?? '');
                } else if (!empty($ing->ingredient_name)) {
                    $masterByName = Ingredient::with('uom')->where('tenant_id', $this->tenant_id)
                        ->where('name', $ing->ingredient_name)
                        ->first();
                    if ($masterByName && $masterByName->unit_cost) {
                        $unitCost = $masterByName->unit_cost;
                        $masterUom = strtolower($masterByName->uom->unit_code ?? '');
                    }
                }

                $qty = (float) ($ing->quantity ?? 0);
                $unit = strtolower(trim($ing->unit ?? ''));

                // Handle common UOM unit conversions (e.g., grams to kg, ml to litres)
                if (in_array($unit, ['g', 'gram', 'grams']) && (empty($masterUom) || in_array($masterUom, ['kg', 'kilo', 'kilogram']))) {
                    $qty = $qty / 1000.0;
                } else if (in_array($unit, ['ml', 'milliliter', 'millilitres']) && (empty($masterUom) || in_array($masterUom, ['l', 'litre', 'litres']))) {
                    $qty = $qty / 1000.0;
                }

                $totalCost += ($qty * $unitCost);
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
