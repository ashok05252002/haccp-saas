# Chef2Comply Development Guidelines

Welcome to the Chef2Comply repository! Since multiple developers (and AI agents) are working on this project, it is critical to follow these standardized architectural rules. Failure to do so will result in data leaks between branches or bloated React bundles.

---

## 1. Database & Multi-Branch Architecture

This application operates on a strict **Multi-Branch Isolation Architecture**. 

- **Tenant vs Branch:** A `tenant_id` represents the overall Client/Company (e.g., "Burger King Corp"). A `branch_id` represents the physical restaurant location (e.g., "Downtown Branch").
- **Strict Isolation:** ALL operational data (Ingredients, Suppliers, Storage Zones, Thermometers, Cleaning Logs) **must** be isolated by `branch_id`.

### Rule 1: Always use the `BelongsToBranch` Trait
When creating a new Model, you **must** include the `BelongsToBranch` trait. 

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class NewFeature extends Model
{
    use BelongsToBranch; // MUST BE INCLUDED

    protected $fillable = ['tenant_id', 'branch_id', 'name'];
}
```

### Rule 2: Never manually filter by `branch_id`
The `BelongsToBranch` trait applies a **Global Scope**. Laravel will automatically append `WHERE branch_id = active_session_branch` to every single query.
- **DO NOT DO THIS:** `Ingredient::where('branch_id', $currentBranch)->get();`
- **DO THIS:** `Ingredient::all();` (It is already safely filtered).

### Rule 3: Never manually insert `branch_id`
When creating records, Laravel will automatically look at the user's active session and inject the `branch_id` for you.
- **DO NOT DO THIS:** `Supplier::create(['name' => 'Sysco', 'branch_id' => $id]);`
- **DO THIS:** `Supplier::create(['name' => 'Sysco']);`

---

## 2. Frontend & UI Guidelines (React/Inertia)

We recently underwent a massive UI refactoring to eliminate React rendering bloat.

### Rule 4: No Inline Styles
Do not define `const styles = { ... }` at the bottom of your React components.
- All styles must be standard Tailwind-like utility classes or global classes defined in `resources/css/chef2comply.css`.

### Rule 5: Use Reusable Common Components
Do not write raw HTML tables or custom alert divs. Always import and use the established common components located in `resources/js/components/common/`.
- Use `<DataTable />` instead of `<table className="...">`.
- Use `<SearchBar />` instead of writing custom input wrappers.
- Use `<Alert />` for success/error banners.

---

## 3. Routing & Environment Strategy

### Rule 6: Decoupled Domains
The application serves different interfaces based on the domain.
- The **Super Admin** portal lives on `ADMIN_DOMAIN` (e.g., `admin.chef2comply.ie`).
- The **Client/Restaurant** portal lives on `PORTAL_DOMAIN` (e.g., `portal.chef2comply.ie`).
- Do not use `config('app.url')` to build domain routes. Always use `config('app.admin_domain')` or `env('PORTAL_DOMAIN')`.
