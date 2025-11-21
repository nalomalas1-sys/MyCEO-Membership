import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { ChildLoginForm } from '@/components/auth/ChildLoginForm';
import { Sparkles, GraduationCap, TrendingUp, Award, Users, Shield, Baby } from 'lucide-react';

type LoginType = 'children' | 'parents' | 'admin';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<LoginType>('parents');

  const tabs = [
    {
      id: 'children' as LoginType,
      label: 'Children',
      icon: Baby,
      description: 'Login with your unique access code',
    },
    {
      id: 'parents' as LoginType,
      label: 'Parents',
      icon: Users,
      description: 'Login with your email and password',
    },
    {
      id: 'admin' as LoginType,
      label: 'Admin',
      icon: Shield,
      description: 'Admin login with email and password',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to="/" className="flex items-center space-x-2 mb-12">
            <Sparkles className="h-8 w-8" />
            <span className="text-2xl font-bold">MyCEO</span>
          </Link>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome Back!
          </h1>
          <p className="text-xl text-primary-100 mb-12 leading-relaxed">
            Continue your journey to financial literacy and entrepreneurship. Help your children build real-world business skills.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Interactive Learning</h3>
                <p className="text-primary-100">Engaging lessons that make learning fun</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Track Progress</h3>
                <p className="text-primary-100">Monitor your child's growth and achievements</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Virtual Companies</h3>
                <p className="text-primary-100">Build and manage virtual businesses</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 h-64 w-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-96 w-96 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">MyCEO</span>
            </Link>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Login Type Tabs */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-1">
            <div className="grid grid-cols-3 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-primary-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Description */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Login Forms */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            {activeTab === 'children' && <ChildLoginForm />}
            {(activeTab === 'parents' || activeTab === 'admin') && <LoginForm />}
          </div>
        </div>
      </div>
    </div>
  );
}
