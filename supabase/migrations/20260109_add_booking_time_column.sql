-- Add booking_time column to bookings table
-- This stores the time slot information as a fallback when time_slot data is missing
-- Format: "HH:MM:SS-HH:MM:SS" (e.g., "10:00:00-11:00:00")

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_time TEXT;

COMMENT ON COLUMN bookings.booking_time IS 'Time slot for the booking in format HH:MM:SS-HH:MM:SS (e.g., 10:00:00-11:00:00). Used as fallback when time_slot data is unavailable.';
