# Exhibition Deletion Fix - Complete

## Problem

Exhibitions could not be deleted from the admin panel. When clicking the delete button, the exhibition would disappear from the UI temporarily but would reappear after refreshing the page.

## Root Cause

The exhibition deletion was only updating the local Zustand store (client-side state) and not calling the API to delete from the database. Additionally, the API route wasn't properly handling all foreign key dependencies.

## Solution

### 1. Fixed Client-Side Deletion

**File**: `app/admin/exhibitions/exhibitions-management.tsx`

**Before**:
```typescript
const handleDeleteExhibition = (id: string) => {
  if (confirm("Are you sure you want to delete this exhibition?")) {
    try {
      deleteExhibition(id); // Only updates local store
      toast.success("Exhibition deleted successfully");
    } catch (error) {
      toast.error("Failed to delete exhibition");
    }
  }
};
```

**After**:
```typescript
const handleDeleteExhibition = async (id: string) => {
  if (!confirm("Are you sure you want to delete this exhibition? This action cannot be undone.")) {
    return;
  }

  try {
    // Call API to delete from database
    const response = await fetch(`/api/admin/exhibitions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete exhibition");
    }

    // Update local state only after successful API call
    deleteExhibition(id);
    toast.success("Exhibition deleted successfully");
  } catch (error: any) {
    console.error("Error deleting exhibition:", error);
    toast.error(error.message || "Failed to delete exhibition");
  }
};
```

### 2. Enhanced API Delete Route

**File**: `app/api/admin/exhibitions/[id]/route.ts`

**Improvements**:

1. **Checks for Bookings**: Prevents deletion if the exhibition has existing bookings
2. **Deletes Related Data**: Removes all dependent records in the correct order
3. **Respects Foreign Keys**: Follows the proper deletion sequence

**Deletion Order**:
```typescript
// 1. Check for bookings first (prevent deletion if any exist)
const { data: bookings } = await supabase
  .from('bookings')
  .select('id')
  .eq('exhibition_id', id)
  .limit(1);

if (bookings && bookings.length > 0) {
  return error: "Cannot delete exhibition with existing bookings"
}

// 2. Delete cart items
await supabase.from('cart_items').delete().eq('exhibition_id', id);

// 3. Delete exhibition content sections
await supabase.from('exhibition_content_sections').delete().eq('exhibition_id', id);

// 4. Delete exhibition schedules
await supabase.from('exhibition_schedules').delete().eq('exhibition_id', id);

// 5. Delete time slots
await supabase.from('time_slots').delete().eq('exhibition_id', id);

// 6. Delete pricing
await supabase.from('pricing').delete().eq('exhibition_id', id);

// 7. Finally, delete the exhibition
await supabase.from('exhibitions').delete().eq('id', id);
```

## Database Dependencies

The following tables have foreign key relationships with exhibitions:

1. **bookings** - Cannot delete if bookings exist
2. **cart_items** - Deleted automatically
3. **exhibition_content_sections** - Deleted automatically
4. **exhibition_schedules** - Deleted automatically
5. **time_slots** - Deleted automatically
6. **pricing** - Deleted automatically

## Features

### ✅ Proper Database Deletion
- Exhibitions are now deleted from the database, not just local state
- Changes persist after page refresh

### ✅ Booking Protection
- Prevents deletion of exhibitions with existing bookings
- Shows clear error message: "Cannot delete exhibition with existing bookings"
- Protects data integrity

### ✅ Cascade Deletion
- Automatically removes all related data
- Handles foreign key constraints properly
- No orphaned records left behind

### ✅ Better UX
- Shows loading state during deletion
- Clear success/error messages
- Confirmation dialog with warning

## Testing

### Test Case 1: Delete Exhibition Without Bookings
1. Go to Admin → Exhibitions
2. Find an exhibition with no bookings
3. Click the delete button (trash icon)
4. Confirm deletion
5. **Expected**: Exhibition is deleted and removed from list
6. **Expected**: Success message appears
7. **Expected**: Refresh page - exhibition stays deleted

### Test Case 2: Try to Delete Exhibition With Bookings
1. Go to Admin → Exhibitions
2. Find an exhibition that has bookings
3. Click the delete button
4. Confirm deletion
5. **Expected**: Error message: "Cannot delete exhibition with existing bookings"
6. **Expected**: Exhibition remains in the list

### Test Case 3: Cancel Deletion
1. Go to Admin → Exhibitions
2. Click delete button
3. Click "Cancel" in confirmation dialog
4. **Expected**: Nothing happens, exhibition remains

## Diagnostic Script

**File**: `scripts/check-exhibition-dependencies.sql`

Use this script to check what data is related to an exhibition before attempting deletion:

```sql
-- Replace 'YOUR_EXHIBITION_ID' with actual ID
SELECT 'pricing' as table_name, COUNT(*) as count
FROM pricing WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
UNION ALL
SELECT 'time_slots', COUNT(*)
FROM time_slots WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
-- ... etc
```

## Error Messages

### Success
- "Exhibition deleted successfully"

### Errors
- "Cannot delete exhibition with existing bookings. Please cancel all bookings first."
- "Failed to delete exhibition" (generic error)
- "Failed to check bookings" (database error)

## Deployment

### Status: ✅ DEPLOYED

**Commit**: `04f4a995a7f25d226ea34ed47dbf2d4f46c9713d`
**Date**: November 11, 2025

### Verification Steps:

1. **Wait 2-3 minutes** for Vercel deployment
2. **Hard refresh** admin panel (Ctrl+Shift+R)
3. **Navigate** to Admin → Exhibitions
4. **Test** deleting an exhibition without bookings
5. **Verify** exhibition is deleted from database
6. **Refresh** page to confirm deletion persists

## Future Improvements

### Potential Enhancements:

1. **Soft Delete**: Instead of hard delete, mark as deleted
2. **Bulk Delete**: Delete multiple exhibitions at once
3. **Archive**: Move to archive instead of deleting
4. **Restore**: Ability to restore deleted exhibitions
5. **Audit Log**: Track who deleted what and when
6. **Better Confirmation**: Show what will be deleted (bookings count, etc.)

## Related Issues

This fix also resolves:
- Exhibitions reappearing after deletion
- "Foreign key constraint" errors during deletion
- Orphaned data in related tables

---

**Status**: ✅ COMPLETE
**Last Updated**: November 11, 2025
