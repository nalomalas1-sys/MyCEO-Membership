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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">MyCEO</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
              <Link 
                to="/signup" 
                className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                Empowering Young Entrepreneurs
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Teach Kids Money & 
                <span className="text-primary-600"> Entrepreneurship</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                An interactive learning platform that makes financial literacy fun. 
                Help your children build real-world business skills through gamified lessons and virtual companies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-xl hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
                >
                  Watch Demo
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  1-day free trial
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl"></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-16 bg-primary-50 rounded-lg"></div>
                      <div className="h-16 bg-primary-50 rounded-lg"></div>
                      <div className="h-16 bg-primary-50 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-2xl p-4 shadow-xl">
                <TrendingUp className="h-8 w-8 text-yellow-900" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-400 rounded-2xl p-4 shadow-xl">
                <Award className="h-8 w-8 text-green-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything Your Child Needs to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive financial education made engaging and fun
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Lessons</h3>
              <p className="text-gray-600 leading-relaxed">
                Engaging video and text-based lessons that make learning about money management enjoyable and memorable.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Virtual Companies</h3>
              <p className="text-gray-600 leading-relaxed">
                Kids create and manage their own virtual businesses, learning real-world entrepreneurship skills.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-14 w-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gamification</h3>
              <p className="text-gray-600 leading-relaxed">
                Earn XP, unlock achievements, and level up as your child progresses through their financial journey.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Parents can monitor their child's progress and celebrate milestones together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-primary-600">1</span>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent transform -translate-y-1/2"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your parent account and set up your child's profile. No credit card required for the free trial.
              </p>
            </div>
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-green-600">2</span>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-green-200 to-transparent transform -translate-y-1/2"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Your child begins with interactive lessons and gradually builds their virtual company through engaging activities.
              </p>
            </div>
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-yellow-600">3</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Watch your child grow their financial knowledge and business skills while earning achievements and leveling up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by Parents & Kids
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what families are saying about MyCEO
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "My 10-year-old daughter absolutely loves MyCEO! She's learned so much about money management and is already planning her first real business. The gamification keeps her engaged."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Martinez</div>
                  <div className="text-sm text-gray-500">Parent of 10-year-old</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "As a financial advisor, I'm impressed by how well MyCEO teaches complex concepts in an age-appropriate way. My son now understands budgeting better than most adults!"
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <span className="text-green-600 font-semibold">JD</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">James Davis</div>
                  <div className="text-sm text-gray-500">Parent & Financial Advisor</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "The virtual company feature is brilliant! My daughter runs her own business in the app and has learned so much about revenue, expenses, and customer service. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-semibold">EW</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Emily Wilson</div>
                  <div className="text-sm text-gray-500">Parent of 12-year-old</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your family
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Access to basic lessons</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Limited modules</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Basic progress tracking</span>
                </li>
              </ul>
              <Link 
                to="/signup"
                className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Standard Plan - Recommended */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 shadow-2xl transform scale-105 relative">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-bl-2xl rounded-tr-2xl text-sm font-semibold">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Standard</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">$19</span>
                  <span className="text-primary-100 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">All lessons & modules</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Virtual company feature</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Full progress tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Achievements & badges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <Link 
                to="/signup"
                className="block w-full text-center px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$39</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Everything in Standard</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Multiple children accounts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Marketplace features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">24/7 premium support</span>
                </li>
              </ul>
              <Link 
                to="/signup"
                className="block w-full text-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary-400" />
                <span className="text-xl font-bold text-white">MyCEO</span>
              </div>
              <p className="text-gray-400 text-sm">
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



