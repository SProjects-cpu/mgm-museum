-- Add RLS policy for admins to view all tickets
-- This allows users with admin or super_admin role to view all tickets

CREATE POLICY "Admins can view all tickets"
ON public.tickets
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
COMMENT ON POLICY "Admins can view all tickets" ON public.tickets IS 
'Allows admin and super_admin users to view all tickets in the system for management purposes';
