import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { 
  CheckCircle2, 
  Loader2, 
  Shield, 
  ChevronDown, 
  X,
  Users,
  Rocket,
  Crown
} from 'lucide-react';
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
  icon: any;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started with one child.',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    childLimit: 1,
    features: [
      '1 child profile',
      'Basic quest designer',
      'Simple progress tracking',
      'Weekly reports',
      'Safe digital environment',
      '5 starter quests',
      'Basic games',
    ],
    icon: Rocket,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Best for families with multiple children.',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    childLimit: 5,
    features: [
      'Up to 5 child profiles',
      'Virtual shop builder',
      'Advanced analytics',
      'Priority support',
      'Unlimited quests',
      'Interactive business games',
      'Export reports',
      'Achievement system',
      'Mini-games collection',
    ],
    popular: true,
    icon: Users,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Unlimited access for the whole family.',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    childLimit: 'Unlimited',
    features: [
      'Unlimited child profiles',
      'Full feature access',
      'AI assistant',
      'Export all data',
      'Dedicated support',
      'Custom quest creator',
      'White label options',
      'All mini-games',
      'Elite achievements',
      'Exclusive content',
    ],
    icon: Crown,
  },
];

function PricingContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const handleSelectPlan = async (planId: 'basic' | 'standard' | 'premium') => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
      if (url) window.location.href = url;
      else throw new Error('No checkout URL returned');

    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  const getPrice = (plan: Plan) => billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <ParentNavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with a 30-day free trial. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              {billingPeriod === 'annual' && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="hover:bg-red-100 rounded p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const Icon = plan.icon;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  isPopular
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-500">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Save ${(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(2)} per year
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-3">
                      {typeof plan.childLimit === 'number' 
                        ? `Up to ${plan.childLimit} child${plan.childLimit > 1 ? 'ren' : ''}`
                        : 'Unlimited children'}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600">Common questions about our plans</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Can I upgrade or downgrade my plan?",
                a: "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the end of your billing period."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use bank-level encryption and secure servers to protect all your information. Your data is always safe with us."
              },
              {
                q: "What happens after my free trial ends?",
                a: "After your 30-day free trial, you'll need to choose a plan to continue. All your progress and data will be saved."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      faqOpen === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Need a custom plan?</h3>
            <p className="text-gray-600 mb-4">
              Contact us for classroom or school pricing, group discounts, and custom solutions.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Contact Sales
            </button>
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
