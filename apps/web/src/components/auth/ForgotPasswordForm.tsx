import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the current site URL for the redirect
      const siteUrl = window.location.origin;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${siteUrl}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      // Success - show success message
      setEmailSent(data.email);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 text-sm flex items-start">
          <span className="mr-2 mt-0.5">✓</span>
          <div>
            <p className="font-semibold mb-1">Password reset email sent!</p>
            <p>
              We've sent a password reset link to <strong>{emailSent}</strong>. 
              Please check your email and click the link to reset your password.
            </p>
            <p className="mt-2 text-xs">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <Link
            to="/login"
            className="inline-block w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:scale-[1.02]"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
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

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm flex items-start">
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
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending reset link...
          </span>
        ) : (
          'Send Reset Link'
        )}
      </button>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          ← Back to Login
        </Link>
      </div>
    </form>
  );
}

