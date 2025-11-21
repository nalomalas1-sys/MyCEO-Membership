import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  childLimit: number | string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    childLimit: 1,
    features: [
      '1 child account',
      'Access to all modules',
      'Basic progress tracking',
      'Achievement system',
      'Email support',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Most popular for families',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    childLimit: 5,
    features: [
      'Up to 5 child accounts',
      'All Basic features',
      'Virtual company builder',
      'Advanced analytics',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For larger families and educators',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    childLimit: 'Unlimited',
    features: [
      'Unlimited child accounts',
      'All Standard features',
      'Bulk management tools',
      'Custom learning paths',
      'Dedicated support',
    ],
  },
];

function PricingContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: 'basic' | 'standard' | 'premium') => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      // Get the Supabase function URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the Edge Function to create checkout session
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          plan: planId,
          billingPeriod,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const getPrice = (plan: Plan) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan: Plan) => {
    if (billingPeriod === 'annual') {
      const monthlyTotal = plan.monthlyPrice * 12;
      const savings = monthlyTotal - plan.annualPrice;
      return savings;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4 mr-2" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Start with a 1-day free trial. No credit card required until trial ends.
          </p>

          {/* Billing Period Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                billingPeriod === 'annual'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                Save
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const savings = getSavings(plan);
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden relative ${
                  isPopular
                    ? 'border-primary-500 transform scale-105'
                    : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-500 ml-2">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Save ${savings.toFixed(2)} per year
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {plan.childLimit === 'Unlimited' ? 'Unlimited' : `Up to ${plan.childLimit}`} child{plan.childLimit !== 1 && plan.childLimit !== 'Unlimited' ? 'ren' : ''}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      isPopular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Start Free Trial`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time from your dashboard.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens after the trial?</h3>
              <p className="text-gray-600 text-sm">
                After your 1-day free trial, your subscription will automatically continue. You can cancel anytime before the trial ends with no charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h3>
              <p className="text-gray-600 text-sm">
                No setup fees. Just choose your plan and start learning!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <ProtectedRoute>
      <PricingContent />
    </ProtectedRoute>
  );
}

