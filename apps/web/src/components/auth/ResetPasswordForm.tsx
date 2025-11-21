import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).catch((err) => {
        console.error('Error setting session:', err);
        setError('Invalid or expired reset link. Please request a new password reset.');
      });
    } else {
      // Check if we have an active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      });
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Get current session to ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
        setLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Success - show success message and redirect
      setSuccess(true);
      setLoading(false);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
            <p className="font-semibold mb-1">Password reset successful!</p>
            <p>Your password has been updated. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Enter your new password below.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          New Password
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
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠</span>
            {errors.confirmPassword.message}
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
            Resetting password...
          </span>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
}

