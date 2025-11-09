-- Add RLS policy for admins to view all bookings
-- This allows users with admin or super_admin role to view all bookings

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "Admins can view all bookings" ON public.bookings IS 
'Allows admin and super_admin users to view all bookings in the system for management purposes';
