import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  TrendingUp, 
  Award,
  CheckCircle2,
  ArrowRight,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  ShoppingBag,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import logoImage from '../Logo-MyCeo-300x200.png';
import poster1 from '../poster1.jpg';
import poster2 from '../poster2.jpg';
import poster3 from '../poster3.jpg';
import poster4 from '../poster4.jpg';
import backgroundImage from '../background.png';

interface MarketplaceItem {
  id: string;
  item_name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  seller_child_id: string;
  seller_name?: string;
  seller_company?: string;
}

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';
type PriceFilter = 'all' | 'under_10' | '10_50' | '50_100' | 'over_100';

export default function LandingPage() {
  const location = useLocation();
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Poster carousel state
  const posters = [poster1, poster2, poster3, poster4];
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [selectedPosterIndex, setSelectedPosterIndex] = useState<number | null>(null);

  // Handle smooth scrolling to sections when navigating with hash
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  // Handle smooth scrolling when clicking section links on the same page
  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    async function fetchMarketplaceItems() {
      try {
        setLoadingMarketplace(true);
        
        // Build query with filters
        let query = supabase
          .from('marketplace_items')
          .select('*', { count: 'exact' })
          .eq('status', 'available');

        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(`item_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply price filter
        if (priceFilter === 'under_10') {
          query = query.lt('price', 10);
        } else if (priceFilter === '10_50') {
          query = query.gte('price', 10).lte('price', 50);
        } else if (priceFilter === '50_100') {
          query = query.gte('price', 50).lte('price', 100);
        } else if (priceFilter === 'over_100') {
          query = query.gt('price', 100);
        }

        // Apply sorting
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        } else if (sortBy === 'price_low') {
          query = query.order('price', { ascending: true });
        } else if (sortBy === 'price_high') {
          query = query.order('price', { ascending: false });
        }

        // Apply pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        const { data: itemsData, error: itemsError, count } = await query;

        if (itemsError) {
          console.error('Error fetching marketplace items:', itemsError);
          return;
        }

        if (!itemsData) {
          setMarketplaceItems([]);
          setTotalItems(0);
          setLoadingMarketplace(false);
          return;
        }

        // Note: Seller names and companies are not publicly accessible due to RLS
        // We'll show products with a generic seller label
        const itemsWithSellers = itemsData.map((item) => ({
          ...item,
          seller_name: 'Young Entrepreneur',
          seller_company: null,
        }));

        setMarketplaceItems(itemsWithSellers);
        setTotalItems(count || 0);
      } catch (err) {
        console.error('Failed to fetch marketplace items:', err);
      } finally {
        setLoadingMarketplace(false);
      }
    }

    fetchMarketplaceItems();
  }, [searchQuery, sortBy, priceFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, priceFilter]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b-2 border-blue-200 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={logoImage} 
                alt="MyCEO Logo" 
                className="h-16 w-auto object-contain"
              />
              <span className="text-2xl font-bold text-blue-600"></span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" onClick={(e) => handleSectionClick(e, '#features')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</Link>
              <Link to="/#how-it-works" onClick={(e) => handleSectionClick(e, '#how-it-works')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">How It Works</Link>
              <Link to="/#marketplace" onClick={(e) => handleSectionClick(e, '#marketplace')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Marketplace</Link>
              <Link to="/#pricing" onClick={(e) => handleSectionClick(e, '#pricing')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Pricing</Link>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Sign In</Link>
              <Link 
                to="/signup" 
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-bold transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-blue-200 bg-white/95 backdrop-blur-lg">
              <div className="px-4 pt-2 pb-4 space-y-1">
                <Link
                  to="/#features"
                  onClick={(e) => {
                    handleSectionClick(e, '#features');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Features
                </Link>
                <Link
                  to="/#how-it-works"
                  onClick={(e) => {
                    handleSectionClick(e, '#how-it-works');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  to="/#marketplace"
                  onClick={(e) => {
                    handleSectionClick(e, '#marketplace');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Marketplace
                </Link>
                <Link
                  to="/#pricing"
                  onClick={(e) => {
                    handleSectionClick(e, '#pricing');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-bold text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-white/70"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-blue-600">
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
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg border-2 border-blue-300 hover:border-blue-500 transition-all hover:shadow-lg hover:bg-blue-50"
                >
                  Sign In
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-8 text-sm text-gray-700 font-medium">
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-blue-200 rounded-3xl p-8 shadow-2xl border-4 border-blue-300">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="h-4 bg-blue-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-pink-100 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-blue-50 rounded-xl border-2 border-blue-200"></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-16 bg-blue-100 rounded-lg border-2 border-blue-200"></div>
                      <div className="h-16 bg-yellow-100 rounded-lg border-2 border-yellow-200"></div>
                      <div className="h-16 bg-pink-100 rounded-lg border-2 border-pink-200"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-500 rounded-2xl p-4 shadow-xl border-2 border-yellow-600 transform rotate-12 hover:rotate-6 transition-transform">
                <TrendingUp className="h-8 w-8 text-yellow-900" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 rounded-2xl p-4 shadow-xl border-2 border-green-600 transform -rotate-12 hover:-rotate-6 transition-transform">
                <Award className="h-8 w-8 text-green-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Posters Gallery Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
                Featured Posters
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Explore our collection of inspiring posters
            </p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative">
            {/* Left Navigation Button */}
            <button
              onClick={() => setCurrentPosterIndex((prev) => (prev === 0 ? posters.length - 1 : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-lg rounded-full p-3 shadow-xl border-2 border-purple-200 hover:bg-white hover:border-purple-500 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous poster"
            >
              <ChevronLeft className="h-6 w-6 text-purple-600" />
            </button>

            {/* Carousel */}
            <div className="mx-12 overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentPosterIndex * 100}%)` }}
              >
                {posters.map((poster, index) => (
                  <div
                    key={index}
                    className="min-w-full px-2"
                  >
                    <div 
                      className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-purple-200 group cursor-pointer flex items-center justify-center"
                      onClick={() => setSelectedPosterIndex(index)}
                    >
                      <div className="relative w-full overflow-hidden">
                        <img
                          src={poster}
                          alt={`Poster ${index + 1}`}
                          className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-purple-600">
                            Click to View Full Size
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Navigation Button */}
            <button
              onClick={() => setCurrentPosterIndex((prev) => (prev === posters.length - 1 ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-lg rounded-full p-3 shadow-xl border-2 border-purple-200 hover:bg-white hover:border-purple-500 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next poster"
            >
              <ChevronRight className="h-6 w-6 text-purple-600" />
            </button>
          </div>

          {/* Poster Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {posters.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPosterIndex(index)}
                className={`h-3 rounded-full transition-all ${
                  index === currentPosterIndex
                    ? 'w-8 bg-purple-600'
                    : 'w-3 bg-purple-300 hover:bg-purple-400'
                }`}
                aria-label={`Go to poster ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Poster Modal/Popup */}
      {selectedPosterIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedPosterIndex(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPosterIndex(null)}
              className="absolute -top-12 right-0 bg-white/90 backdrop-blur-lg rounded-full p-2 shadow-xl border-2 border-purple-200 hover:bg-white hover:border-purple-500 transition-all hover:scale-110 z-10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-purple-600" />
            </button>

            {/* Navigation in Modal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedPosterIndex !== null) {
                  setSelectedPosterIndex(selectedPosterIndex === 0 ? posters.length - 1 : selectedPosterIndex - 1);
                }
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-lg rounded-full p-3 shadow-xl border-2 border-purple-200 hover:bg-white hover:border-purple-500 transition-all hover:scale-110 z-10"
              aria-label="Previous poster"
            >
              <ChevronLeft className="h-6 w-6 text-purple-600" />
            </button>

            {/* Poster Image */}
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={posters[selectedPosterIndex]}
                alt={`Poster ${selectedPosterIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            </div>

            {/* Navigation in Modal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedPosterIndex !== null) {
                  setSelectedPosterIndex(selectedPosterIndex === posters.length - 1 ? 0 : selectedPosterIndex + 1);
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-lg rounded-full p-3 shadow-xl border-2 border-purple-200 hover:bg-white hover:border-purple-500 transition-all hover:scale-110 z-10"
              aria-label="Next poster"
            >
              <ChevronRight className="h-6 w-6 text-purple-600" />
            </button>

            {/* Poster Counter */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg px-4 py-2 rounded-full shadow-xl border-2 border-purple-200">
              <span className="text-purple-600 font-bold">
                {selectedPosterIndex !== null && `${selectedPosterIndex + 1} / ${posters.length}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-blue-600">
              Everything Your Child Needs to Succeed
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Comprehensive financial education made engaging and fun
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-blue-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-blue-200">
              <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Lessons</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Engaging video and text-based lessons that make learning about money management enjoyable and memorable.
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-green-200">
              <div className="h-14 w-14 bg-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Virtual Companies</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Kids create and manage their own virtual businesses, learning real-world entrepreneurship skills.
              </p>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-yellow-200">
              <div className="h-14 w-14 bg-yellow-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gamification</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Earn XP, unlock achievements, and level up as your child progresses through their financial journey.
              </p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-purple-200">
              <div className="h-14 w-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
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
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-blue-600">
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
                <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-blue-300 transform -translate-y-1/2"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Create your parent account and set up your child's profile. No credit card required for the free trial.
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-8 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-green-300 transform -translate-y-1/2"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Learning</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Your child begins with interactive lessons and gradually builds their virtual company through engaging activities.
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-8 shadow-xl border-2 border-yellow-200 hover:shadow-2xl transition-all">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
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

      {/* Marketplace Section */}
      <section id="marketplace" className="py-20 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-6 shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
                Kids' Marketplace
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Discover amazing products created by young entrepreneurs! Kids learn business skills by creating and selling virtual products.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or description..."
                className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Sort By */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Filter className="inline h-4 w-4 mr-1" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900 font-medium bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Price Filter */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900 font-medium bg-white"
                >
                  <option value="all">All Prices</option>
                  <option value="under_10">Under RM 10</option>
                  <option value="10_50">RM 10 - RM 50</option>
                  <option value="50_100">RM 50 - RM 100</option>
                  <option value="over_100">Over RM 100</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            {!loadingMarketplace && (
              <div className="text-sm text-gray-600 font-medium">
                Showing {marketplaceItems.length} of {totalItems} products
              </div>
            )}
          </div>

          {loadingMarketplace ? (
            <LoadingAnimation 
              message="Loading amazing products..." 
              variant="inline" 
              showSkeleton={true} 
              skeletonCount={8} 
            />
          ) : marketplaceItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-xl border-2 border-purple-200">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Products Found</h3>
              <p className="text-gray-600 font-medium mb-4">
                {searchQuery || priceFilter !== 'all' 
                  ? 'Try adjusting your search or filters to find more products.'
                  : 'Be the first to create a product! Sign up and start your entrepreneurial journey.'}
              </p>
              {(searchQuery || priceFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPriceFilter('all');
                    setSortBy('newest');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-all shadow-md mr-4"
                >
                  Clear Filters
                </button>
              )}
              {!searchQuery && priceFilter === 'all' && (
                <Link 
                  to="/signup"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {marketplaceItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProductId(item.id)}
                    className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-purple-200 group cursor-pointer block"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-purple-100 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-purple-300" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {item.item_name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">By</p>
                          <p className="text-sm font-bold text-purple-600">
                            {item.seller_name}
                          </p>
                          {item.seller_company && (
                            <p className="text-xs text-gray-500 italic">
                              {item.seller_company}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border-2 border-purple-200 bg-white text-gray-700 font-bold hover:bg-purple-50 hover:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-purple-200"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                              : 'bg-white text-gray-700 border-purple-200 hover:bg-purple-50 hover:border-purple-500'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border-2 border-purple-200 bg-white text-gray-700 font-bold hover:bg-purple-50 hover:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-purple-200"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="text-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center px-8 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Join to Create Your Own Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-blue-600">
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
            <div className="bg-blue-600 rounded-2xl p-8 shadow-2xl transform scale-105 relative border-4 border-yellow-300">
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
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-blue-500">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-blue-400">MyCEO</span>
              </Link>
              <p className="text-gray-400 text-sm font-medium">
                Empowering the next generation of entrepreneurs through interactive financial education.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#features" onClick={(e) => handleSectionClick(e, '#features')} className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#marketplace" onClick={(e) => handleSectionClick(e, '#marketplace')} className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/#pricing" onClick={(e) => handleSectionClick(e, '#pricing')} className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/#how-it-works" onClick={(e) => handleSectionClick(e, '#how-it-works')} className="hover:text-white transition-colors">How It Works</Link></li>
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


