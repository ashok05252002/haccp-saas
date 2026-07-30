# Agent Rules for Chef2Comply

When working on this repository, you must adhere strictly to the rules laid out in the `DEVELOPMENT_GUIDELINES.md` file located in the root of the workspace.

## Key Directives:
1. **Multi-Branch Isolation:** Always use the `BelongsToBranch` trait when creating new models. NEVER manually filter or insert `branch_id` in controllers. The Global Scope (`BranchScope`) handles this automatically.
2. **UI & Styling:** NEVER use inline React styles (`const styles = {}`). Always use standard CSS classes from `resources/css/chef2comply.css` and utilize the common components in `resources/js/components/common` (e.g. `DataTable`, `SearchBar`, `Alert`).
3. **Routing:** Respect the decoupled domains (`ADMIN_DOMAIN` vs `PORTAL_DOMAIN`).
