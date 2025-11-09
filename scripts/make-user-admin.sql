-- ============================================
-- Make User Admin - SQL Script
-- ============================================
-- Run this in Supabase SQL Editor to make any user an admin
--
-- Instructions:
-- 1. Replace 'YOUR_EMAIL_HERE' with the email you want to make admin
-- 2. Run this query in Supabase Dashboard → SQL Editor
-- 3. Logout and login again
-- ============================================

-- Option 1: Update existing user to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL_HERE';

-- Verify the change
SELECT id, email, role, full_name 
FROM users 
WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================
-- Alternative: Make user super_admin
-- ============================================
-- UPDATE users 
-- SET role = 'super_admin' 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================
-- List all current admins
-- ============================================
SELECT id, email, role, full_name, created_at
FROM users 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;
