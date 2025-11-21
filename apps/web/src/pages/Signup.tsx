import { Link, useSearchParams } from 'react-router-dom';
import { SubscriptionSignupForm } from '@/components/auth/SubscriptionSignupForm';
import { Sparkles, CheckCircle2, Star, Users, Zap, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 via-primary-500 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to="/" className="flex items-center space-x-2 mb-12">
            <Sparkles className="h-8 w-8" />
            <span className="text-2xl font-bold">MyCEO</span>
          </Link>
          
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-medium mb-6 w-fit">
            <Star className="h-4 w-4 mr-2" />
            Start Your Free Trial Today
          </div>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Start Your Journey
          </h1>
          <p className="text-xl text-primary-100 mb-12 leading-relaxed">
            Join thousands of parents helping their children learn about money, business, and entrepreneurship in a fun, engaging way.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0" />
              <span className="text-primary-100">1-day free trial - No credit card required</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0" />
              <span className="text-primary-100">Access to all interactive lessons and modules</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0" />
              <span className="text-primary-100">Virtual company features and progress tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-300 flex-shrink-0" />
              <span className="text-primary-100">Cancel anytime - No commitments</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 mr-1" />
                <span className="text-2xl font-bold">10K+</span>
              </div>
              <p className="text-sm text-primary-100">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 mr-1" />
                <span className="text-2xl font-bold">4.9</span>
                <Star className="h-4 w-4 ml-1 fill-current" />
              </div>
              <p className="text-sm text-primary-100">User Rating</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 h-64 w-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-96 w-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-green-50">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">MyCEO</span>
            </Link>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {canceled && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-yellow-800 text-sm flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Checkout Canceled</p>
                <p>Your account creation was canceled. You can try again below.</p>
              </div>
            </div>
          )}
          
          <SubscriptionSignupForm />
        </div>
      </div>
    </div>
  );
}



