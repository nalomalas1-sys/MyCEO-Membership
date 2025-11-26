-- Migration: Convert USD to Malaysian Ringgit (RM)
-- Exchange rate: 1 USD = 4.75 RM
-- This migration converts all existing currency values from USD to RM

-- Convert marketplace item prices
UPDATE public.marketplace_items
SET price = price * 4.75
WHERE price > 0;

-- Convert company transaction amounts
UPDATE public.company_transactions
SET amount = amount * 4.75
WHERE amount > 0;

-- Convert company balances and financial data
UPDATE public.companies
SET 
  initial_capital = initial_capital * 4.75,
  current_balance = current_balance * 4.75,
  total_revenue = total_revenue * 4.75,
  total_expenses = total_expenses * 4.75;

-- Add a comment to document the conversion
COMMENT ON COLUMN public.marketplace_items.price IS 'Price in Malaysian Ringgit (RM). Previously USD, converted at rate 1 USD = 4.75 RM.';
COMMENT ON COLUMN public.company_transactions.amount IS 'Amount in Malaysian Ringgit (RM). Previously USD, converted at rate 1 USD = 4.75 RM.';
COMMENT ON COLUMN public.companies.initial_capital IS 'Initial capital in Malaysian Ringgit (RM). Previously USD, converted at rate 1 USD = 4.75 RM.';
COMMENT ON COLUMN public.companies.current_balance IS 'Current balance in Malaysian Ringgit (RM). Previously USD, converted at rate 1 USD = 4.75 RM.';
COMMENT ON COLUMN public.companies.total_revenue IS 'Total revenue in Malaysian Ringgit (RM). Previously USD, converted at rate 1 USD = 4.75 RM.';
COMMENT ON COLUMN public.companies.total_expenses IS 'Total expenses in Malaysian Ringgit (RM). Previously USD, converted at rate 1 USD = 4.75 RM.';



