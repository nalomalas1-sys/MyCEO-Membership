import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { AchievementNotification } from '@/components/child/AchievementNotification';
import { supabase } from '@/lib/supabase';
import { Building2, DollarSign, TrendingUp, TrendingDown, Plus, ArrowLeftRight } from 'lucide-react';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface Company {
  id: string;
  company_name: string;
  product_name: string | null;
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

export default function CompanyPage() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
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
        // Fetch company
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

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          child_id: childSession.childId,
          company_name: companyName,
          product_name: productName || null,
          initial_capital: 1000.00,
          current_balance: 1000.00,
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl">Loading your company...</div>
      </div>
    );
  }

  if (!childSession) {
    return null;
  }

  // Company Setup Form
  if (showSetup || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        <ChildNavBar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="text-center mb-6">
              <Building2 className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Company! 🏢</h1>
              <p className="text-gray-600">
                Start your entrepreneurial journey! Create your virtual company and learn about business.
              </p>
            </div>

            <form onSubmit={handleSetupCompany} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Educational Board Games"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💰 Starting Capital:</strong> You'll begin with $1,000 to start your business!
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-3 text-lg"
              >
                Create My Company! 🚀
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {company.company_name} 🏢
          </h1>
          {company.product_name && (
            <p className="text-lg text-gray-600">Product: {company.product_name}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${company.current_balance.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${company.total_revenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${company.total_expenses.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <div className={`card bg-gradient-to-br ${
            profit >= 0 
              ? 'from-green-50 to-emerald-50 border-green-200' 
              : 'from-red-50 to-rose-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Profit/Loss</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${profit.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {profitPercentage}% margin
                </p>
              </div>
              {profit >= 0 ? (
                <TrendingUp className="h-12 w-12 text-green-600" />
              ) : (
                <TrendingDown className="h-12 w-12 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddTransaction(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Transaction
          </button>
        </div>

        {/* Transactions */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Recent Transactions
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg mb-2">No transactions yet!</p>
              <p className="text-sm">Add your first transaction to start tracking your business.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 rounded-lg border-2 ${
                    transaction.transaction_type === 'revenue' || transaction.transaction_type === 'sale'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {transaction.transaction_type.replace('_', ' ')}
                      </p>
                      {transaction.description && (
                        <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${
                      transaction.transaction_type === 'revenue' || transaction.transaction_type === 'sale'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {transaction.transaction_type === 'revenue' || transaction.transaction_type === 'sale' ? '+' : '-'}
                      ${transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          companyId={company.id}
          onClose={() => setShowAddTransaction(false)}
          onSuccess={async () => {
            // Refresh company and transactions
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
    </div>
  );
}

interface AddTransactionModalProps {
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddTransactionModal({ companyId, onClose, onSuccess }: AddTransactionModalProps) {
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

      // Check for company achievement milestones when revenue increases
      if (isRevenue && newRevenue > company.total_revenue) {
        try {
          // Get child_id from company
          const { data: companyData } = await supabase
            .from('companies')
            .select('child_id')
            .eq('id', companyId)
            .single();

          if (companyData?.child_id) {
            // Call award function with a generic activity type to check company achievements
            // The function will check company revenue thresholds
            const { data: awardData, error: awardError } = await supabase.rpc('award_achievements_and_xp', {
              p_child_id: companyData.child_id,
              p_activity_type: 'lesson_complete', // Use any activity type - function checks company achievements on any activity
              p_module_id: null,
              p_quiz_score: null,
            });

            if (!awardError && awardData && awardData.length > 0) {
              const result = awardData[0];
              // Only show notification if there are new achievements or XP was earned
              if ((result.new_achievements && result.new_achievements.length > 0) || result.xp_earned > 0) {
                setAchievementNotification({
                  isOpen: true,
                  xpEarned: result.xp_earned || 0,
                  newAchievements: result.new_achievements || [],
                  leveledUp: result.leveled_up || false,
                  newLevel: result.new_level,
                });
              }
            }
          }
        } catch (err) {
          // Don't fail transaction if achievement check fails
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="revenue">Revenue (Money In)</option>
              <option value="expense">Expense (Money Out)</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount ($) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0.01"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Sold 10 units of product"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
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



