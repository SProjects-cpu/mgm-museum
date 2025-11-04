# Database Errors and Warnings

## FIXED: Next.js Dynamic Route Conflict (Nov 4, 2024)

**Issue**: Vercel deployment failing with 504 errors
**Error**: "You cannot use different slug names for the same dynamic path ('id' !== 'slug')"

**Root Cause**: 
- Had both `/api/exhibitions/[id]/` and `/api/exhibitions/[slug]/` directories
- Next.js doesn't allow mixing dynamic parameter names at the same route level

**Solution Applied**:
- Consolidated all routes under `/api/exhibitions/[id]/`
- Added UUID detection to support both ID and slug lookups:
  ```typescript
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  ```
- Deleted `/api/exhibitions/[slug]/` directory
- Routes now accept both UUIDs and slugs via the `[id]` parameter

**Status**: ✅ Fixed - Ready for redeployment

---

## Supabase Security Errors

[
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.users\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "users",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_users"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.booking_tickets\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "booking_tickets",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_booking_tickets"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.exhibitions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "exhibitions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_exhibitions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.pricing\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "pricing",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_pricing"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.shows\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "shows",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_shows"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.seat_bookings\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "seat_bookings",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_seat_bookings"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.events\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "events",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_events"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.time_slots\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "time_slots",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_time_slots"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.newsletter_subscribers\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "newsletter_subscribers",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_newsletter_subscribers"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.contact_submissions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "contact_submissions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_contact_submissions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.analytics_events\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "analytics_events",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_analytics_events"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.bookings\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "bookings",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_bookings"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.content_pages\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "content_pages",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_content_pages"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.event_registrations\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "event_registrations",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_event_registrations"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.dynamic_pricing\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "dynamic_pricing",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_dynamic_pricing"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.exhibition_schedules\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "exhibition_schedules",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_exhibition_schedules"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.slot_availability\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "slot_availability",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_slot_availability"
  }
]



Warnings

[
  {
    "name": "function_search_path_mutable",
    "title": "Function Search Path Mutable",
    "level": "WARN",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects functions where the search_path parameter is not set.",
    "detail": "Function \\`public.update_updated_at_column\\` has a role mutable search_path",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
    "metadata": {
      "name": "update_updated_at_column",
      "type": "function",
      "schema": "public"
    },
    "cache_key": "function_search_path_mutable_public_update_updated_at_column_da5ac28a58c8b4bb30209bf0d3d7082c"
  },
  {
    "name": "function_search_path_mutable",
    "title": "Function Search Path Mutable",
    "level": "WARN",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects functions where the search_path parameter is not set.",
    "detail": "Function \\`public.generate_booking_reference\\` has a role mutable search_path",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
    "metadata": {
      "name": "generate_booking_reference",
      "type": "function",
      "schema": "public"
    },
    "cache_key": "function_search_path_mutable_public_generate_booking_reference_cb1c9d003bb588f42c68eb8154250e26"
  },
  {
    "name": "function_search_path_mutable",
    "title": "Function Search Path Mutable",
    "level": "WARN",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects functions where the search_path parameter is not set.",
    "detail": "Function \\`public.set_booking_reference\\` has a role mutable search_path",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
    "metadata": {
      "name": "set_booking_reference",
      "type": "function",
      "schema": "public"
    },
    "cache_key": "function_search_path_mutable_public_set_booking_reference_49645c71da41261eb5ec8a30e1cb62bc"
  },
  {
    "name": "function_search_path_mutable",
    "title": "Function Search Path Mutable",
    "level": "WARN",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects functions where the search_path parameter is not set.",
    "detail": "Function \\`public.get_available_slots_for_exhibition\\` has a role mutable search_path",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
    "metadata": {
      "name": "get_available_slots_for_exhibition",
      "type": "function",
      "schema": "public"
    },
    "cache_key": "function_search_path_mutable_public_get_available_slots_for_exhibition_d2eba5b56e0fad2c8cbd97a764596626"
  },
  {
    "name": "extension_in_public",
    "title": "Extension in Public",
    "level": "WARN",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects extensions installed in the \\`public\\` schema.",
    "detail": "Extension \\`pg_trgm\\` is installed in the public schema. Move it to another schema.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public",
    "metadata": {
      "name": "pg_trgm",
      "type": "extension",
      "schema": "public"
    },
    "cache_key": "extension_in_public_pg_trgm"
  }
]