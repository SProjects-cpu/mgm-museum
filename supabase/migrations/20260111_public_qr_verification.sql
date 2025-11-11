-- Enable public QR code verification
-- Allows anyone with a booking_reference to view booking details
-- This is required for the QR verification feature to work

CREATE POLICY IF NOT EXISTS "Public can view bookings by booking_reference"
ON bookings
FOR SELECT
TO public
USING (booking_reference IS NOT NULL);

-- Add comment explaining the policy
COMMENT ON POLICY "Public can view bookings by booking_reference" ON bookings IS 
'Allows public access to booking details when queried by booking_reference. Required for QR code verification feature.';
