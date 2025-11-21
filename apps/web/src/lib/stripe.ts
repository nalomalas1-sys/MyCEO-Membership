import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('Stripe publishable key is not set');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};





