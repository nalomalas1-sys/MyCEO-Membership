import { Link } from 'react-router-dom';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Sparkles, Lock, Shield, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-primary-500 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to="/" className="flex items-center space-x-2 mb-12">
            <Sparkles className="h-8 w-8" />
            <span className="text-2xl font-bold">MyCEO</span>
          </Link>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Set New Password
          </h1>
          <p className="text-xl text-primary-100 mb-12 leading-relaxed">
            Create a strong, secure password to protect your account. Make sure it's something you'll remember but hard for others to guess.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Strong Password</h3>
                <p className="text-primary-100">Use at least 8 characters with a mix of letters, numbers, and symbols</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure Your Account</h3>
                <p className="text-primary-100">A strong password helps protect your personal information</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Easy to Remember</h3>
                <p className="text-primary-100">Choose something memorable but unique to you</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 h-64 w-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-96 w-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">MyCEO</span>
            </Link>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}






