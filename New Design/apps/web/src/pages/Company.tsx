import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { AchievementNotification } from '@/components/child/AchievementNotification';
import { supabase } from '@/lib/supabase';
import { Building2, DollarSign, TrendingUp, TrendingDown, Plus, ArrowLeftRight, Edit2, Save, X, Package, Rocket, Tag, Target, ChevronRight, Users, BarChart3, Coins } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface Company {
  id: string;
  company_name: string;
  product_name: string | null;
  specialty: string | null;
  logo_url: string | null;
  initial_capital: number;
  current_balance: number;
  total_revenue: number;
  total_expenses: number;
  created_at: string;
}

interface Transaction {
  id: string;
  transaction_type: 'revenue' | 'expense' | 'purchase' | 'sale';
  amount: number;
  description: string | null;
  created_at: string;
}

interface MarketplaceItem {
  id: string;
  item_name: string;
  description: string | null;
  price: number;
  quantity: number;
  status: string;
}

// Modal Components First

interface AddTransactionModalProps {
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
  onAchievementNotification?: (notification: {
    isOpen: boolean;
    xpEarned: number;
    newAchievements: Array<{ id: string; name: string; xp_bonus?: number }>;
    leveledUp: boolean;
    newLevel?: number;
  }) => void;
}

function AddTransactionModal({ companyId, onClose, onSuccess, onAchievementNotification }: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const type = formData.get('type') as string;
      const amount = parseFloat(formData.get('amount') as string);
      const description = formData.get('description') as string;

      if (!type || !amount || amount <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('company_transactions')
        .insert({
          company_id: companyId,
          transaction_type: type,
          amount: amount,
          description: description || null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update company balance and totals
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!company) throw new Error('Company not found');

      const isRevenue = type === 'revenue' || type === 'sale';
      const newBalance = isRevenue 
        ? company.current_balance + amount 
        : company.current_balance - amount;
      const newRevenue = isRevenue 
        ? company.total_revenue + amount 
        : company.total_revenue;
      const newExpenses = !isRevenue 
        ? company.total_expenses + amount 
        : company.total_expenses;

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          current_balance: newBalance,
          total_revenue: newRevenue,
          total_expenses: newExpenses,
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Check for company achievement milestones
      if (isRevenue && newRevenue > company.total_revenue && onAchievementNotification) {
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('child_id')
            .eq('id', companyId)
            .single();

          if (companyData?.child_id) {
            const { data: awardData, error: awardError } = await supabase.rpc('award_achievements_and_xp', {
              p_child_id: companyData.child_id,
              p_activity_type: 'lesson_complete',
              p_module_id: null,
              p_quiz_score: null,
            });

            if (!awardError && awardData && awardData.length > 0) {
              const result = awardData[0];
              const newAchievements = Array.isArray(result.new_achievements) ? result.new_achievements : [];
              if (newAchievements.length > 0 || (result.xp_earned && result.xp_earned > 0)) {
                onAchievementNotification({
                  isOpen: true,
                  xpEarned: result.xp_earned || 0,
                  newAchievements: newAchievements,
                  leveledUp: result.leveled_up || false,
                  newLevel: result.new_level,
                });
              }
            }
          }
        } catch (err) {
          console.warn('Failed to check company achievements:', err);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Add Transaction</h2>
            <p className="text-gray-600 text-sm mt-1">Record your business activity</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="revenue">Revenue (Money In)</option>
              <option value="expense">Expense (Money Out)</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (RM) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0.01"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="e.g., Sold 10 units of product"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditCompanyModalProps {
  company: Company;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCompanyModal({ company, onClose, onSuccess }: EditCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const companyName = formData.get('companyName') as string;
      const productName = formData.get('productName') as string;
      const specialty = formData.get('specialty') as string;

      if (!companyName || companyName.trim() === '') {
        setError('Company name is required');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          company_name: companyName.trim(),
          product_name: productName?.trim() || null,
          specialty: specialty || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Edit2 className="h-6 w-6 text-blue-500" />
              Edit Company
            </h2>
            <p className="text-gray-600 text-sm mt-1">Update your company details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editCompanyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="editCompanyName"
              name="companyName"
              required
              defaultValue={company.company_name}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="e.g., Awesome Toys Inc."
            />
          </div>

          <div>
            <label htmlFor="editProductName" className="block text-sm font-medium text-gray-700 mb-2">
              Product/Service Name
            </label>
            <input
              type="text"
              id="editProductName"
              name="productName"
              defaultValue={company.product_name || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="e.g., Educational Board Games"
            />
          </div>

          <div>
            <label htmlFor="editSpecialty" className="block text-sm font-medium text-gray-700 mb-2">
              Company Specialty
            </label>
            <select
              id="editSpecialty"
              name="specialty"
              defaultValue={company.specialty || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Select a specialty...</option>
              <option value="Technology">Technology</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Education">Education</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
              <option value="Arts & Crafts">Arts & Crafts</option>
              <option value="Retail">Retail</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">What industry is your company in?</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LaunchProductModalProps {
  company: Company;
  childSession: ChildSession;
  onClose: () => void;
  onSuccess: () => void;
}

function LaunchProductModal({ company, childSession, onClose, onSuccess }: LaunchProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid price greater than 0');
        setLoading(false);
        return;
      }

      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        setError('Please enter a valid quantity greater than 0');
        setLoading(false);
        return;
      }

      // Create marketplace listing
      const { error: insertError } = await supabase
        .from('marketplace_items')
        .insert({
          seller_child_id: childSession.childId,
          item_name: company.product_name || 'Product',
          description: description.trim() || null,
          price: priceNum,
          quantity: quantityNum,
          status: 'available',
        });

      if (insertError) throw insertError;

      // Create a transaction for "product launch" expense
      const launchCost = 50.00;
      const { data: companyData } = await supabase
        .from('companies')
        .select('current_balance, total_expenses')
        .eq('id', company.id)
        .single();

      if (companyData && companyData.current_balance >= launchCost) {
        await supabase.from('company_transactions').insert({
          company_id: company.id,
          transaction_type: 'expense',
          amount: launchCost,
          description: `Product launch marketing: ${company.product_name}`,
        });

        await supabase
          .from('companies')
          .update({
            current_balance: companyData.current_balance - launchCost,
            total_expenses: (companyData.total_expenses || 0) + launchCost,
          })
          .eq('id', company.id);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to launch product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Rocket className="h-6 w-6 text-orange-500" />
              Launch Product
            </h2>
            <p className="text-gray-600 text-sm mt-1">List your product in the marketplace</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Product:</strong> {company.product_name}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              💡 Launch cost: {formatCurrency(50.00)} (marketing expense)
            </p>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (RM) *
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="1"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Describe your product..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? 'Launching...' : 'Launch Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Component
export default function CompanyPage() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showLaunchProduct, setShowLaunchProduct] = useState(false);
  const [showSetPricing, setShowSetPricing] = useState(false);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [achievementNotification, setAchievementNotification] = useState<{
    isOpen: boolean;
    xpEarned: number;
    newAchievements: Array<{ id: string; name: string; xp_bonus?: number }>;
    leveledUp: boolean;
    newLevel?: number;
  } | null>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      setChildSession(session);
    } catch (err) {
      navigate('/child/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession) return;

    async function fetchCompany() {
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('child_id', childSession.childId)
          .single();

        if (companyError && companyError.code !== 'PGRST116') {
          throw companyError;
        }

        if (!companyData) {
          setShowSetup(true);
          setLoading(false);
          return;
        }

        setCompany(companyData);

        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('company_transactions')
          .select('*')
          .eq('company_id', companyData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);

        // Fetch marketplace items
        const { data: itemsData, error: itemsError } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('seller_child_id', childSession.childId)
          .order('created_at', { ascending: false });

        if (itemsError) console.error('Failed to fetch marketplace items:', itemsError);
        setMarketplaceItems(itemsData || []);
      } catch (err: any) {
        console.error('Failed to fetch company:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [childSession]);

  const handleSetupCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!childSession) return;

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get('companyName') as string;
    const productName = formData.get('productName') as string;
    const specialty = formData.get('specialty') as string;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          child_id: childSession.childId,
          company_name: companyName,
          product_name: productName || null,
          specialty: specialty || null,
          initial_capital: 4750.00,
          current_balance: 4750.00,
        })
        .select()
        .single();

      if (error) throw error;

      setCompany(data);
      setShowSetup(false);
    } catch (err: any) {
      alert('Failed to create company: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-bounce mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            Loading Your Company...
          </div>
          <div className="text-gray-600">
            Getting your business headquarters ready!
          </div>
        </div>
      </div>
    );
  }

  if (!childSession) {
    return null;
  }

  // Company Setup Form
  if (showSetup || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 font-sans">
        <ChildNavBar />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Building2 className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  🆕
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Create Your Company! 🏢
              </h1>
              <p className="text-gray-600 text-lg">
                Start your entrepreneurial journey! Create your virtual company and learn about business.
              </p>
            </div>

            <form onSubmit={handleSetupCompany} className="space-y-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., Awesome Toys Inc."
                />
              </div>

              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Service Name
                </label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., Educational Board Games"
                />
              </div>

              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Specialty
                </label>
                <select
                  id="specialty"
                  name="specialty"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select a specialty...</option>
                  <option value="Technology">Technology</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Education">Education</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Arts & Crafts">Arts & Crafts</option>
                  <option value="Retail">Retail</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">What industry is your company in?</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-6 h-6 text-yellow-600" />
                  <p className="text-lg font-bold text-yellow-800">
                    Starting Capital: {formatCurrency(4750.00)}
                  </p>
                </div>
                <p className="text-sm text-yellow-700">
                  You'll begin with {formatCurrency(4750.00)} to start your business adventure!
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg transform hover:-translate-y-0.5"
              >
                CREATE MY COMPANY 🚀
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const profit = company.total_revenue - company.total_expenses;
  const profitPercentage = company.total_revenue > 0 
    ? ((profit / company.total_revenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 font-sans">
      <ChildNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                  CEO
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                  {company.company_name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {company.specialty && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {company.specialty}
                    </span>
                  )}
                  {company.product_name && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {company.product_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowEditCompany(true)}
              className="px-5 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              title="Edit Company Details"
            >
              <Edit2 className="h-5 w-5" />
              Edit Company
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              Add Transaction
            </button>
            
            {company.product_name && (
              <>
                <button
                  onClick={() => setShowLaunchProduct(true)}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all flex items-center gap-2 shadow-lg transform hover:-translate-y-0.5"
                >
                  <Rocket className="h-5 w-5" />
                  Launch Product
                </button>
                
                {marketplaceItems.length > 0 && (
                  <button
                    onClick={() => setShowSetPricing(true)}
                    className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Tag className="h-5 w-5" />
                    Set Pricing
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Balance */}
          <div className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-blue-100 group-hover:shadow-xl group-hover:border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-blue-600 font-medium">Current Balance</div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{formatCurrency(company.current_balance)}</div>
              <div className="text-sm text-gray-600 mt-2">Available funds for your business</div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 shadow-lg border border-green-100 group-hover:shadow-xl group-hover:border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-green-600 font-medium">Total Revenue</div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{formatCurrency(company.total_revenue)}</div>
              <div className="text-sm text-gray-600 mt-2">All income earned so far</div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl p-6 shadow-lg border border-red-100 group-hover:shadow-xl group-hover:border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-red-600 font-medium">Total Expenses</div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{formatCurrency(company.total_expenses)}</div>
              <div className="text-sm text-gray-600 mt-2">All costs and spending</div>
            </div>
          </div>

          {/* Profit/Loss */}
          <div className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300">
            <div className={`bg-gradient-to-br from-white ${profit >= 0 ? 'to-green-50' : 'to-red-50'} rounded-2xl p-6 shadow-lg border ${profit >= 0 ? 'border-green-100' : 'border-red-100'} group-hover:shadow-xl group-hover:${profit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Profit</div>
                <div className={`w-12 h-12 bg-gradient-to-r ${profit >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'} rounded-xl flex items-center justify-center shadow-md`}>
                  {profit >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-white" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <div className={`text-3xl font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(profit)}
              </div>
              <div className="text-sm text-gray-600 mt-2">{profitPercentage}% margin</div>
            </div>
          </div>
        </div>

        {/* Product Catalog & Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Catalog */}
          {company.product_name && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Package className="h-6 w-6 text-blue-500" />
                  Product Catalog
                </h2>
                <span className="text-sm text-gray-500">
                  {marketplaceItems.filter(i => i.status === 'available').length} items available
                </span>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-gray-900 mb-1">Main Product:</p>
                <p className="text-lg text-gray-700">{company.product_name}</p>
              </div>
              
              {marketplaceItems.length > 0 ? (
                <div className="space-y-4">
                  {marketplaceItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{item.item_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'available' ? 'bg-green-100 text-green-800' :
                          item.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-800">
                          {formatCurrency(item.price)}
                        </span>
                        
                        {item.status === 'available' && (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{item.quantity || 0} units</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {marketplaceItems.length > 3 && (
                    <button className="w-full py-3 text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                      View All Products
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg mb-2">No products launched yet!</p>
                  <p className="text-sm">Launch your product to start selling in the marketplace.</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <ArrowLeftRight className="h-6 w-6 text-purple-500" />
                Recent Transactions
              </h2>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                + Add New
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ArrowLeftRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg mb-2">No transactions yet!</p>
                <p className="text-sm">Add your first transaction to start tracking your business.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-4 rounded-lg border ${
                      transaction.transaction_type === 'revenue' || transaction.transaction_type === 'sale'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.transaction_type.replace('_', ' ')}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`text-xl font-bold ${
                        transaction.transaction_type === 'revenue' || transaction.transaction_type === 'sale'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {transaction.transaction_type === 'revenue' || transaction.transaction_type === 'sale' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {transactions.length > 5 && (
                  <button className="w-full py-3 text-purple-600 font-medium rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors">
                    View All Transactions
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sales Challenge */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-500" />
              Sales Challenge
            </h2>
            <div className="text-sm font-medium text-gray-700">
              {marketplaceItems.filter(i => i.status === 'sold').length} / 5 SOLD
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Sell 5 items this week</span>
              <span>{Math.min((marketplaceItems.filter(i => i.status === 'sold').length / 5) * 100, 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((marketplaceItems.filter(i => i.status === 'sold').length / 5) * 100, 100)}%`
                }}
              />
            </div>
          </div>
          
          {marketplaceItems.filter(i => i.status === 'sold').length >= 5 ? (
            <div className="flex items-center justify-center gap-3 text-green-700 font-medium">
              <span className="text-xl">🏆</span>
              <span>Challenge Complete! Great job!</span>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center">
              {5 - marketplaceItems.filter(i => i.status === 'sold').length} more sales needed to complete the challenge!
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddTransaction && (
        <AddTransactionModal
          companyId={company.id}
          onClose={() => setShowAddTransaction(false)}
          onSuccess={async () => {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('id', company.id)
              .single();
            if (companyData) setCompany(companyData);

            const { data: transactionsData } = await supabase
              .from('company_transactions')
              .select('*')
              .eq('company_id', company.id)
              .order('created_at', { ascending: false })
              .limit(20);
            if (transactionsData) setTransactions(transactionsData);
          }}
          onAchievementNotification={setAchievementNotification}
        />
      )}

      {/* Edit Company Modal */}
      {showEditCompany && company && (
        <EditCompanyModal
          company={company}
          onClose={() => setShowEditCompany(false)}
          onSuccess={async () => {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('id', company.id)
              .single();
            if (companyData) setCompany(companyData);
          }}
        />
      )}

      {/* Achievement Notification */}
      {achievementNotification && (
        <AchievementNotification
          isOpen={achievementNotification.isOpen}
          onClose={() => setAchievementNotification(null)}
          xpEarned={achievementNotification.xpEarned}
          newAchievements={achievementNotification.newAchievements}
          leveledUp={achievementNotification.leveledUp}
          newLevel={achievementNotification.newLevel}
          type="lesson"
        />
      )}

      {/* Launch Product Modal */}
      {showLaunchProduct && company && childSession && (
        <LaunchProductModal
          company={company}
          childSession={childSession}
          onClose={() => setShowLaunchProduct(false)}
          onSuccess={async () => {
            const { data: itemsData } = await supabase
              .from('marketplace_items')
              .select('*')
              .eq('seller_child_id', childSession.childId)
              .order('created_at', { ascending: false });
            if (itemsData) setMarketplaceItems(itemsData);
            setShowLaunchProduct(false);
          }}
        />
      )}
    </div>
  );
}