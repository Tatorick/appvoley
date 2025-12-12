-- 28_add_payment_month.sql

-- Add payment_period column to treasury_movements
-- This stores the first day of the month that the payment covers.
-- e.g. '2025-01-01' represents January 2025 fees.

ALTER TABLE treasury_movements 
ADD COLUMN payment_month DATE;

-- Create an index to quickly find payments for a specific month (e.g. when building the grid)
CREATE INDEX idx_treasury_payment_month ON treasury_movements(player_id, payment_month);

-- Optional: Comment on column
COMMENT ON COLUMN treasury_movements.payment_month IS 'Stores the first day of the month/year this payment covers (e.g. 2025-01-01 for Jan 2025). Used for Monthly Fee grids.';
