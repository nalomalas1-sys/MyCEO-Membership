import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

type PasswordStrength = 'weak' | 'medium' | 'strong';

function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak';
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Character type checks
  if (/[a-z]/.test(password)) strength++; // lowercase
  if (/[A-Z]/.test(password)) strength++; // uppercase
  if (/[0-9]/.test(password)) strength++; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) strength++; // special characters
  
  // Determine strength level
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
}

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  plan: z.enum(['basic', 'standard', 'premium']),
  billingPeriod: z.enum(['monthly', 'annual']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

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

export function SubscriptionSignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'account' | 'plan'>('account');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      plan: 'standard',
      billingPeriod: 'monthly',
    },
  });

  const selectedPlan = watch('plan');
  const billingPeriod = watch('billingPeriod');

  const onSubmit = async (data: SignupFormData) => {
    if (step === 'account') {
      // Move to plan selection step
      setStep('plan');
      return;
    }

    // Step 2: Create checkout session with user data
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;

      // Call the Edge Function to create checkout session with user data
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          plan: data.plan,
          billingPeriod: data.billingPeriod,
          userData: {
            email: data.email.trim().toLowerCase(), // Normalize email (trim + lowercase)
            password: data.password, // Will be hashed on server side
            fullName: data.fullName,
          },
          successUrl: `${window.location.origin}/signup-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/signup?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        // Store email and password in sessionStorage for post-checkout auto-login
        // Note: This is temporary and will be cleared after successful login
        // Normalize email before storing (should already be normalized, but ensure consistency)
        sessionStorage.setItem('signup_email', data.email.trim().toLowerCase());
        sessionStorage.setItem('signup_password', data.password);
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
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

  if (step === 'account') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            {...register('fullName')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              onChange: (e) => {
                const value = e.target.value;
                setPassword(value);
                setPasswordStrength(calculatePasswordStrength(value));
              },
            })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
            placeholder="At least 8 characters"
          />
          
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength === 'weak'
                        ? 'bg-red-500 w-1/3'
                        : passwordStrength === 'medium'
                        ? 'bg-yellow-500 w-2/3'
                        : 'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    passwordStrength === 'weak'
                      ? 'text-red-600'
                      : passwordStrength === 'medium'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {passwordStrength === 'weak' && 'Use 8+ characters with mix of letters, numbers, and symbols'}
                {passwordStrength === 'medium' && 'Good! Add more character variety for better security'}
                {passwordStrength === 'strong' && 'Excellent! Your password is strong and secure'}
              </p>
            </div>
          )}
          
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm whitespace-pre-line flex items-start">
            <span className="mr-2 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Processing...
            </span>
          ) : (
            'Continue to Plan Selection'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">Privacy Policy</a>
        </p>
      </form>
    );
  }

  // Plan selection step
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
        <p className="text-gray-600">Select a subscription plan to continue</p>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-md border border-gray-200">
          <button
            type="button"
            onClick={() => setValue('billingPeriod', 'monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setValue('billingPeriod', 'annual')}
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

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isPopular ? 'relative' : ''}`}
              onClick={() => setValue('plan', plan.id)}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h4>
                  <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">${price}</span>
                    <span className="text-gray-500 ml-2 text-sm">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {savings > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Save ${savings.toFixed(2)} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="flex items-center justify-center text-primary-600 font-semibold text-sm">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Selected
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setStep('account')}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Start Free Trial
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        You'll be redirected to secure checkout. Your account will be created after successful payment.
      </p>
    </div>
  );
}

