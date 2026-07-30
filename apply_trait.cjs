const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'app', 'Models');
const modelsToUpdate = [
    'Supplier.php',
    'Ingredient.php',
    'IngredientCategory.php',
    'FoodItem.php',
    'Uom.php',
    'BaseUnit.php',
    'UnitType.php',
    'StorageType.php',
    'StorageZone.php',
    'CleaningArea.php',
    'CleaningChecklistSection.php',
    'CleaningChecklistQuestion.php',
    'Thermometer.php',
    'HealthDeclarationSection.php',
    'HealthDeclarationQuestion.php'
];

for (const model of modelsToUpdate) {
    const filePath = path.join(modelsDir, model);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        if (!content.includes('use App\\Models\\Traits\\BelongsToBranch;')) {
            // Insert the use statement after the namespace or the last use statement before the class definition
            content = content.replace(/(use Illuminate\\Database\\Eloquent\\Model;)/, "$1\nuse App\\Models\\Traits\\BelongsToBranch;");

            // Insert the trait inside the class
            content = content.replace(/(class\s+\w+\s+extends\s+Model\s*\{)/, "$1\n    use BelongsToBranch;\n");
            
            // Add 'branch_id' to $fillable if not there
            if (!content.includes("'branch_id'")) {
                content = content.replace(/protected \$fillable = \[/, "protected $fillable = [\n        'branch_id',");
            }

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${model}`);
        } else {
            console.log(`Skipped ${model}`);
        }
    } else {
        console.log(`File not found: ${model}`);
    }
}
