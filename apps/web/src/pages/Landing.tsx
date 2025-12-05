import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  GraduationCap, 
  TrendingUp, 
  Award,
  CheckCircle2,
  ArrowRight,
  Star,
  Twitter,
  Facebook,
  Instagram,
  Linkedin
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b-2 border-blue-200 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">MyCEO</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Pricing</a>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Sign In</Link>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-blue-600 to-yellow-500 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-yellow-600 transition-all shadow-lg shadow-blue-500/30 font-bold transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-blue-100 to-yellow-100 text-blue-700 text-sm font-bold mb-6 border-2 border-blue-300 shadow-md">
                <Sparkles className="h-4 w-4 mr-2" />
                Empowering Young Entrepreneurs 🚀
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
                  Teach Kids Money & Entrepreneurship
                </span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed font-medium">
                An interactive learning platform that makes financial literacy fun. 
                Help your children build real-world business skills through gamified lessons and virtual companies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-yellow-600 transition-all shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg border-2 border-blue-300 hover:border-blue-500 transition-all hover:shadow-lg hover:bg-blue-50"
                >
                  Watch Demo
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-8 text-sm text-gray-700 font-medium">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  30-day free trial
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-200 via-yellow-200 to-pink-200 rounded-3xl p-8 shadow-2xl border-4 border-blue-300">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-yellow-100 flex items-center justify-center border-2 border-blue-300">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="h-4 bg-gradient-to-r from-blue-200 to-yellow-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50 rounded-xl border-2 border-blue-200"></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border-2 border-blue-200"></div>
                      <div className="h-16 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg border-2 border-yellow-200"></div>
                      <div className="h-16 bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg border-2 border-pink-200"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-4 shadow-xl border-2 border-yellow-600 transform rotate-12 hover:rotate-6 transition-transform">
                <TrendingUp className="h-8 w-8 text-yellow-900" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl p-4 shadow-xl border-2 border-green-600 transform -rotate-12 hover:-rotate-6 transition-transform">
                <Award className="h-8 w-8 text-green-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
                Everything Your Child Needs to Succeed
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Comprehensive financial education made engaging and fun
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-blue-200">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Lessons</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Engaging video and text-based lessons that make learning about money management enjoyable and memorable.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-green-200">
              <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Virtual Companies</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Kids create and manage their own virtual businesses, learning real-world entrepreneurship skills.
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-yellow-200">
              <div className="h-14 w-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gamification</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Earn XP, unlock achievements, and level up as your child progresses through their financial journey.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-purple-200">
              <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Parents can monitor their child's progress and celebrate milestones together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-blue-300 to-transparent transform -translate-y-1/2"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Create your parent account and set up your child's profile. No credit card required for the free trial.
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-8 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-green-300 to-transparent transform -translate-y-1/2"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Learning</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Your child begins with interactive lessons and gradually builds their virtual company through engaging activities.
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-8 shadow-xl border-2 border-yellow-200 hover:shadow-2xl transition-all">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Progress</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Watch your child grow their financial knowledge and business skills while earning achievements and leveling up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
                Loved by Parents & Kids
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              See what families are saying about MyCEO
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed font-medium">
                "My 10-year-old daughter absolutely loves MyCEO! She's learned so much about money management and is already planning her first real business. The gamification keeps her engaged."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold">SM</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah Martinez</div>
                  <div className="text-sm text-gray-600 font-medium">Parent of 10-year-old</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed font-medium">
                "As a financial advisor, I'm impressed by how well MyCEO teaches complex concepts in an age-appropriate way. My son now understands budgeting better than most adults!"
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold">JD</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">James Davis</div>
                  <div className="text-sm text-gray-600 font-medium">Parent & Financial Advisor</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-xl border-2 border-purple-200 hover:shadow-2xl transition-all">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed font-medium">
                "The virtual company feature is brilliant! My daughter runs her own business in the app and has learned so much about revenue, expenses, and customer service. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold">EW</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Emily Wilson</div>
                  <div className="text-sm text-gray-600 font-medium">Parent of 12-year-old</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Choose the plan that works best for your family
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200 hover:shadow-2xl transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 ml-2 font-medium">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Access to basic lessons</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Limited modules</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Basic progress tracking</span>
                </li>
              </ul>
              <Link 
                to="/signup"
                className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-md"
              >
                Get Started
              </Link>
            </div>

            {/* Standard Plan - Recommended */}
            <div className="bg-gradient-to-br from-blue-600 to-yellow-500 rounded-2xl p-8 shadow-2xl transform scale-105 relative border-4 border-yellow-300">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-bl-2xl rounded-tr-2xl text-sm font-bold shadow-lg">
                Most Popular ⭐
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Standard</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">$19</span>
                  <span className="text-white/90 ml-2 font-medium">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-medium">All lessons & modules</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-medium">Virtual company feature</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-medium">Full progress tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-medium">Achievements & badges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-medium">Priority support</span>
                </li>
              </ul>
              <Link 
                to="/signup"
                className="block w-full text-center px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-200 hover:shadow-2xl transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$39</span>
                  <span className="text-gray-600 ml-2 font-medium">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Everything in Standard</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Multiple children accounts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Marketplace features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">24/7 premium support</span>
                </li>
              </ul>
              <Link 
                to="/signup"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-yellow-600 transition-all shadow-lg"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-blue-500">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">MyCEO</span>
              </div>
              <p className="text-gray-400 text-sm font-medium">
                Empowering the next generation of entrepreneurs through interactive financial education.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2024 MyCEO. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



