import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type BillingPeriod = 'monthly' | 'annual';
type PlanId = 'basic' | 'standard' | 'premium';

interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  bestFor: string;
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Good for trying MyCEO with one child.',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    bestFor: '1 child starter plan',
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Best for most families who want all features.',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    bestFor: 'Most families',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For large families or power users.',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    bestFor: 'Unlimited children',
  },
];

function SimplePricingContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPrice = (plan: Plan) =>
    billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoadingPlan(planId);
      setError(null);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: planId,
          billingPeriod,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create checkout session';
      }

      const { url } = await response.json();
      if (!url) throw new Error('No checkout URL returned');

      window.location.href = url;
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Something went wrong. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Choose your MyCEO plan
          </h1>
          <p className="text-gray-600">
            Simple, transparent pricing. Upgrade or change plans anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white rounded-full p-1 border border-blue-200 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-sm font-semibold rounded-full ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 text-sm font-semibold rounded-full ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700'
              }`}
            >
              Yearly (save more)
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {plan.name}
              </h2>
              <p className="text-sm text-blue-600 mb-4">{plan.bestFor}</p>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {getPrice(plan).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-5 flex-1">
                {plan.description}
              </p>

              <ul className="space-y-2 text-sm text-gray-700 mb-5">
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>All core learning features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Parent dashboard & progress tracking</span>
                </li>
                {plan.id !== 'basic' && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Access to marketplace & extra content</span>
                  </li>
                )}
                {plan.id === 'premium' && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Unlimited children profiles</span>
                  </li>
                )}
              </ul>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loadingPlan !== null}
                className="mt-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>Choose {plan.name}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <ProtectedRoute>
      <SimplePricingContent />
    </ProtectedRoute>
  );
}


