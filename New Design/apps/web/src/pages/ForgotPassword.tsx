import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Sparkles, Mail, Lock, Shield } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-primary-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to="/" className="flex items-center space-x-2 mb-12">
            <Sparkles className="h-8 w-8" />
            <span className="text-2xl font-bold">MyCEO</span>
          </Link>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Reset Your Password
          </h1>
          <p className="text-xl text-primary-100 mb-12 leading-relaxed">
            No worries! We'll help you get back into your account. Enter your email address and we'll send you a secure link to reset your password.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure Process</h3>
                <p className="text-primary-100">We'll send a secure link to your email address</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Quick & Easy</h3>
                <p className="text-primary-100">Reset your password in just a few clicks</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Safe & Secure</h3>
                <p className="text-primary-100">Your account security is our top priority</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 h-64 w-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-96 w-96 bg-red-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-orange-50">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">MyCEO</span>
            </Link>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}






