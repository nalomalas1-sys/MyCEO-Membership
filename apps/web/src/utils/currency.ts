/**
 * Currency utility functions for Malaysian Ringgit (RM)
 * Exchange rate: 1 USD = 4.75 RM
 */

const USD_TO_RM_RATE = 4.75;

/**
 * Converts USD amount to RM
 */
export function usdToRm(usdAmount: number): number {
  return usdAmount * USD_TO_RM_RATE;
}

/**
 * Formats a number as Malaysian Ringgit currency
 */
export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

/**
 * Formats a number as Malaysian Ringgit currency with thousand separators
 */
export function formatCurrencyWithSeparators(amount: number): string {
  return `RM ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}



