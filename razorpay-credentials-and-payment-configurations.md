I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: RLS policy defined on a view will fail, breaking the migration at vw_payment_settings_summary.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, remove the `CREATE POLICY` statement targeting `vw_payment_settings_summary`. Do not attempt to apply RLS to the view. Revoke broad access by removing `GRANT SELECT ON vw_payment_settings_summary TO authenticated` and instead grant only to trusted roles, or expose this data through an admin-only RPC function. Ensure the view relies on underlying tables’ RLS or migrate to a real table with RLS if row-level control is required.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---
## Comment 2: Credential retrieval function can bypass RLS due to SECURITY DEFINER and open EXECUTE permissions.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, change `get_active_razorpay_credentials` to `SECURITY INVOKER` or add a guard that checks the caller’s role via `auth.jwt()` and raises if not admin/service. Revoke EXECUTE from PUBLIC and grant only to the `service_role` (and any explicitly trusted DB role). Ensure only authorized contexts can call this function.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---
## Comment 3: Unique constraint on environment blocks key rotation; allow only one active per environment instead.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, drop the `unique_environment_per_credential` constraint on `razorpay_credentials`. Create a partial unique index on `(environment)` with `WHERE is_active = TRUE` to enforce a single active record while allowing inactive historical rows.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---
## Comment 4: Missing updated_at trigger for razorpay_credentials leads to stale timestamps on updates.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, add a `BEFORE UPDATE` trigger on `razorpay_credentials` that calls `update_updated_at_column()` so `updated_at` is automatically maintained on updates.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
- c:\Test\mgm-museum\supabase\migrations\20250115_payment_gateway_integration.sql
---
## Comment 5: Admin view exposes to all authenticated users and masking uses encrypted text, not meaningful.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, remove `GRANT SELECT ... TO authenticated` for `vw_payment_settings_summary` and grant only to admin roles or serve via admin-only RPC. Replace `masked_key_id` derivation to use a plaintext hint stored separately (e.g., add `key_id_hint` column storing last 3–4 characters at insert), instead of deriving from encrypted text.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---
## Comment 6: Encryption helper functions lack search_path hardening for SECURITY DEFINER context.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, alter `encrypt_credential` and `decrypt_credential` to set a fixed `search_path` (e.g., `SECURITY DEFINER SET search_path = public`) or set it at the top of the function body. Alternatively, make these `SECURITY INVOKER` if definer privileges are not required.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---
## Comment 7: Plan asked to refine payment_configurations policies by gateway_type; not implemented.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, add or adjust RLS policies on `payment_configurations` to include `gateway_type` checks (e.g., restrict Razorpay-related rows to admin-only management). Keep existing admin manage policy but add gateway-sensitive constraints if required by governance.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
- c:\Test\mgm-museum\supabase\migrations\20250115_payment_gateway_integration.sql
---
## Comment 8: Audit log trigger omits ip_address and user_agent despite columns existing.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, update `audit_payment_config_changes()` to populate `ip_address` and `user_agent` from request context if available (e.g., via headers stored in GUCs), or remove these columns to avoid dead fields.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---
## Comment 9: Redundant audit log indexes increase maintenance with limited benefit.

In `supabase/migrations/20250128_razorpay_credentials_management.sql`, drop either `idx_payment_audit_log_changed_at` or keep only the composite index if it covers your primary query patterns to reduce write overhead.

### Referred Files
- c:\Test\mgm-museum\supabase\migrations\20250128_razorpay_credentials_management.sql
---