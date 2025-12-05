
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, Search, DollarSign, User, Package, X, Upload, Image as ImageIcon, ShoppingCart, Check, Edit2, TrendingUp, Star, Sparkles, Gift, Tag, Users, Store, Coins, Zap, TrendingDown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface MarketplaceItem {
  id: string;
  seller_child_id: string;
  item_name: string;
  description: string | null;
  price: number;
  quantity?: number;
  image_url: string | null;
  status: 'available' | 'sold' | 'removed';
  created_at: string;
  seller_name?: string;
  seller_company?: string;
}

interface Company {
  company_name: string;
  product_name: string | null;
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({ totalItems: 0, totalSellers: 0, totalValue: 0 });
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchMarketplaceData = async () => {
    if (!childSession) return;

    try {
      setLoading(true);

      // Fetch company info
      const { data: companyData } = await supabase
        .from('companies')
        .select('company_name, product_name')
        .eq('child_id', childSession.childId)
        .single();

      if (companyData) {
        setMyCompany(companyData);
      }

      // Fetch all available marketplace items
      const { data: itemsData, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch seller names and companies for each item
      const itemsWithSellers = await Promise.all(
        (itemsData || []).map(async (item) => {
          // Get seller child info
          const { data: childData } = await supabase
            .from('children')
            .select('name')
            .eq('id', item.seller_child_id)
            .single();

          // Get seller company info
          const { data: companyData } = await supabase
            .from('companies')
            .select('company_name')
            .eq('child_id', item.seller_child_id)
            .single();

          return {
            ...item,
            seller_name: childData?.name || 'Unknown',
            seller_company: companyData?.company_name || null,
          };
        })
      );

      // Calculate stats
      const totalValue = itemsWithSellers.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      const uniqueSellers = new Set(itemsWithSellers.map(item => item.seller_child_id));

      setStats({
        totalItems: itemsWithSellers.length,
        totalSellers: uniqueSellers.size,
        totalValue: totalValue
      });

      // Filter out own items from marketplace
      const otherItems = itemsWithSellers.filter(
        (item) => item.seller_child_id !== childSession.childId
      );
      setItems(otherItems);

      // Get my own items
      const myItemsList = itemsWithSellers.filter(
        (item) => item.seller_child_id === childSession.childId
      );
      setMyItems(myItemsList);
    } catch (err) {
      console.error('Failed to fetch marketplace data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace items.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (childSession) {
      fetchMarketplaceData();
    }
  }, [childSession]);

  const handleRefresh = async () => {
    if (!childSession || refreshing) return;
    
    setRefreshing(true);
    await fetchMarketplaceData();
  };

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.seller_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!childSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50">
      <ChildNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl border-3 border-yellow-600 flex items-center justify-center shadow-lg">
                    <ShoppingBag className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    MARKETPLACE
                  </h1>
                  <p className="text-lg text-gray-700">
                    Trade, buy, and sell with young entrepreneurs!
                  </p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Products</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Active Sellers</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalSellers}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Value</div>
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4 min-w-[250px]">
              <button
                onClick={() => setShowAddProduct(true)}
                className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 border-3 border-yellow-600 shadow-lg hover:shadow-xl"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-lg">Promote Product</span>
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 border-3 border-blue-600 shadow-md disabled:opacity-70"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Refresh Market
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, sellers, or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* My Products Section */}
        {myItems.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl border-2 border-yellow-600">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
              <span className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-gray-900 font-bold rounded-full border-2 border-yellow-300">
                {myItems.length} listed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isOwnItem={true}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          </div>
        )}

        {/* Marketplace Items */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl border-2 border-green-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Discover Products</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border-3 border-gray-300 shadow-xl">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-2xl font-bold text-gray-800 mb-2">Loading Marketplace...</p>
              <p className="text-gray-600">Finding awesome products for you!</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-3 border-gray-300 shadow-xl">
              <div className="p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl inline-block mb-6 border-2 border-yellow-300">
                <ShoppingBag className="h-20 w-20 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-3">No Products Found</p>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                {searchQuery
                  ? 'Try a different search term or browse all products'
                  : 'Be the first to promote a product and earn coins!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="mt-6 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold rounded-2xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 inline-flex items-center gap-3 border-3 border-yellow-600 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isOwnItem={false}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>

        {/* Safety Tip */}
        <div className="mt-10 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border-3 border-blue-300 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center border-3 border-blue-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">🌟 Marketplace Safety Tips</h3>
              <p className="text-gray-700">
                • All transactions are virtual and for educational purposes<br/>
                • Never share personal information with other users<br/>
                • Report any suspicious activity to a teacher or parent<br/>
                • Remember: This is a learning experience - have fun trading!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          childSession={childSession}
          company={myCompany}
          onClose={() => setShowAddProduct(false)}
          onSuccess={() => {
            setShowAddProduct(false);
            handleRefresh();
          }}
        />
      )}

      {/* Add CSS for clean font */}
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}

interface ProductCardProps {
  item: MarketplaceItem;
  isOwnItem: boolean;
  onRefresh: () => void;
}

function ProductCard({ item, isOwnItem, onRefresh }: ProductCardProps) {
  const { toast } = useToast();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [buyerCompany, setBuyerCompany] = useState<{ id: string; current_balance: number; company_name: string } | null>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setChildSession(session);
      } catch (err) {
        console.error('Failed to parse child session:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (childSession && showPurchaseConfirm) {
      async function fetchBuyerCompany() {
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('id, current_balance, company_name')
            .eq('child_id', childSession!.childId)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          setBuyerCompany(data || null);
        } catch (err) {
          console.error('Failed to fetch buyer company:', err);
        }
      }
      fetchBuyerCompany();
    }
  }, [childSession, showPurchaseConfirm]);

  const handleRemove = async () => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status: 'removed' })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product removed from marketplace.',
      });
      onRefresh();
      setShowRemoveConfirm(false);
    } catch (err) {
      console.error('Failed to remove product:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove product.',
        variant: 'destructive',
      });
    }
  };

  const handlePurchase = async () => {
    if (!childSession || !buyerCompany) {
      toast({
        title: 'Error',
        description: 'Please create a company first to make purchases.',
        variant: 'destructive',
      });
      return;
    }

    const availableQuantity = item.quantity || 0;
    if (availableQuantity <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This item is no longer available.',
        variant: 'destructive',
      });
      setShowPurchaseConfirm(false);
      return;
    }

    if (buyerCompany.current_balance < item.price) {
      toast({
        title: 'Insufficient Funds',
        description: `You need ${formatCurrency(item.price)} but only have ${formatCurrency(buyerCompany.current_balance)}.`,
        variant: 'destructive',
      });
      setShowPurchaseConfirm(false);
      return;
    }

    setPurchasing(true);

    try {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('marketplace_purchases')
        .insert({
          buyer_child_id: childSession.childId,
          item_id: item.id,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const { data: buyerTransaction, error: buyerTxError } = await supabase
        .from('company_transactions')
        .insert({
          company_id: buyerCompany.id,
          transaction_type: 'purchase',
          amount: item.price,
          description: `Purchased: ${item.item_name} from ${item.seller_name}`,
        })
        .select()
        .single();

      if (buyerTxError) throw buyerTxError;

      const { data: currentBuyerCompany, error: fetchBuyerError } = await supabase
        .from('companies')
        .select('total_expenses')
        .eq('id', buyerCompany.id)
        .single();

      if (fetchBuyerError) throw fetchBuyerError;

      const { error: buyerUpdateError } = await supabase
        .from('companies')
        .update({
          current_balance: buyerCompany.current_balance - item.price,
          total_expenses: (currentBuyerCompany?.total_expenses || 0) + item.price,
        })
        .eq('id', buyerCompany.id);

      if (buyerUpdateError) throw buyerUpdateError;

      const { data: sellerCompany, error: sellerCompanyError } = await supabase
        .from('companies')
        .select('id, current_balance, total_revenue')
        .eq('child_id', item.seller_child_id)
        .single();

      if (sellerCompanyError && sellerCompanyError.code !== 'PGRST116') {
        console.warn('Seller company not found:', sellerCompanyError);
      } else if (sellerCompany) {
        const { error: sellerTxError } = await supabase
          .from('company_transactions')
          .insert({
            company_id: sellerCompany.id,
            transaction_type: 'sale',
            amount: item.price,
            description: `Sold: ${item.item_name} to ${childSession.childName || 'a buyer'}`,
          });

        if (sellerTxError) throw sellerTxError;

        const { error: sellerUpdateError } = await supabase
          .from('companies')
          .update({
            current_balance: sellerCompany.current_balance + item.price,
            total_revenue: (sellerCompany.total_revenue || 0) + item.price,
          })
          .eq('id', sellerCompany.id);

        if (sellerUpdateError) throw sellerUpdateError;

        try {
          const { data: awardData, error: awardError } = await supabase.rpc('award_achievements_and_xp', {
            p_child_id: item.seller_child_id,
            p_activity_type: 'sale',
            p_module_id: null,
            p_quiz_score: null,
          });

          if (!awardError && awardData && awardData.length > 0) {
            const result = awardData[0];
            const newAchievements = Array.isArray(result.new_achievements) ? result.new_achievements : [];
            if (newAchievements.length > 0) {
              console.log(`Seller earned ${newAchievements.length} achievement(s):`, 
                newAchievements.map((a: any) => a.name).join(', '));
            }
          }
        } catch (err) {
          console.warn('Failed to check achievements for seller:', err);
        }
      }

      await supabase
        .from('marketplace_purchases')
        .update({ transaction_id: buyerTransaction.id })
        .eq('id', purchaseData.id);

      const currentQuantity = (item.quantity || 1) - 1;
      const newStatus = currentQuantity <= 0 ? 'sold' : 'available';
      
      const { error: itemUpdateError } = await supabase
        .from('marketplace_items')
        .update({ 
          quantity: currentQuantity,
          status: newStatus
        })
        .eq('id', item.id);

      if (itemUpdateError) throw itemUpdateError;

      toast({
        title: '🎉 Purchase Successful!',
        description: `You've purchased ${item.item_name} for ${formatCurrency(item.price)}!`,
        variant: 'success',
      });

      setShowPurchaseConfirm(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to purchase item:', err);
      toast({
        title: 'Purchase Failed',
        description: err.message || 'Failed to complete purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const isLowStock = (item.quantity || 0) < 3 && (item.quantity || 0) > 0;

  return (
    <div className="group relative transform transition-all duration-300 hover:-translate-y-1">
      <div className="relative bg-white rounded-2xl overflow-hidden border-3 border-gray-300 shadow-lg hover:shadow-xl">
        {/* Product Image */}
        <div className="relative h-48 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.item_name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-16 w-16 text-yellow-300" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold border-2 ${
            item.status === 'available' 
              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white border-green-600' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-600'
          }`}>
            {item.status === 'available' ? 'AVAILABLE' : 'SOLD'}
          </div>
          
          {/* Low Stock Warning */}
          {isLowStock && (
            <div className="absolute top-16 right-4 px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold rounded-full border-2 border-orange-600">
              🔥 LOW STOCK: {item.quantity} LEFT
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.item_name}</h3>
            {item.description && (
              <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
            )}
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="p-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{item.seller_name}</p>
              {item.seller_company && (
                <p className="text-xs text-gray-600">{item.seller_company}</p>
              )}
            </div>
          </div>

          {/* Price and Quantity */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">PRICE</p>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(item.price)}
                </span>
              </div>
            </div>
            {item.status === 'available' && (item.quantity || 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl border-2 border-blue-200">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-blue-800">
                  {item.quantity || 0} LEFT
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {isOwnItem ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 border-2 border-blue-600 shadow-md"
              >
                <div className="flex items-center justify-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  EDIT
                </div>
              </button>
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="flex-1 py-3 bg-gradient-to-r from-red-400 to-pink-400 text-white font-bold rounded-xl hover:from-red-500 hover:to-pink-500 transition-all duration-300 border-2 border-red-600 shadow-md"
              >
                REMOVE
              </button>
            </div>
          ) : item.status === 'available' && (item.quantity || 0) > 0 ? (
            <button
              onClick={() => setShowPurchaseConfirm(true)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-green-600 shadow-md hover:shadow-lg"
            >
              <ShoppingCart className="h-5 w-5" />
              BUY NOW
            </button>
          ) : (
            <div className="w-full py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 border-2 border-gray-600">
              <Check className="h-5 w-5" />
              SOLD OUT
            </div>
          )}
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-3 border-gray-300 shadow-2xl">
            <div className="text-center mb-6">
              <div className="p-3 bg-gradient-to-r from-red-100 to-pink-100 rounded-full inline-block mb-4 border-2 border-red-300">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Remove Product?</h3>
              <p className="text-gray-600">
                Are you sure you want to remove <span className="font-bold text-yellow-700">"{item.item_name}"</span> from the marketplace?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 font-bold rounded-xl hover:from-gray-400 hover:to-gray-500 transition-all duration-300 border-2 border-gray-500 shadow-md"
              >
                CANCEL
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 border-2 border-red-600 shadow-md"
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {showPurchaseConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-3 border-gray-300 shadow-2xl">
            <div className="text-center mb-6">
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full inline-block mb-4 border-2 border-green-300">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Purchase</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300">
                <p className="text-gray-700 font-semibold mb-1">ITEM</p>
                <p className="text-lg font-bold text-yellow-800">{item.item_name}</p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-400">
                <p className="text-gray-700 font-semibold mb-1">PRICE</p>
                <p className="text-3xl font-bold text-amber-700">{formatCurrency(item.price)}</p>
              </div>

              {(item.quantity || 0) > 0 && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300">
                  <p className="text-sm font-medium text-blue-800">
                    📦 <span className="font-bold">AVAILABLE:</span> {item.quantity || 0} {item.quantity === 1 ? 'ITEM' : 'ITEMS'}
                  </p>
                </div>
              )}
              
              {buyerCompany && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300">
                  <p className="text-sm font-medium text-blue-800">
                    💰 <span className="font-bold">YOUR BALANCE:</span> {formatCurrency(buyerCompany.current_balance)}
                  </p>
                  <p className="text-sm font-medium text-blue-800 mt-1">
                    📊 <span className="font-bold">AFTER PURCHASE:</span> {formatCurrency(buyerCompany.current_balance - item.price)}
                  </p>
                </div>
              )}
              
              {buyerCompany && buyerCompany.current_balance < item.price && (
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-300">
                  <p className="text-sm font-bold text-red-800">
                    ⚠️ INSUFFICIENT FUNDS! NEED {formatCurrency(item.price - buyerCompany.current_balance)} MORE
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowPurchaseConfirm(false)}
                disabled={purchasing}
                className="flex-1 py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 font-bold rounded-xl hover:from-gray-400 hover:to-gray-500 transition-all duration-300 border-2 border-gray-500 shadow-md disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || (buyerCompany?.current_balance ?? 0) < item.price}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 border-2 border-green-600 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    CONFIRM PURCHASE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditProductModal
          item={item}
          childSession={childSession!}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

interface AddProductModalProps {
  childSession: ChildSession;
  company: Company | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AddProductModal({
  childSession,
  company,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const { toast } = useToast();
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg'];

  const getMimeTypeFromExtension = (extension: string): string => {
    const ext = extension.toLowerCase();
    const mimeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'jfif': 'image/jpeg',
      'pjpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
    };
    return mimeMap[ext] || 'image/jpeg';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const isValidType = ALLOWED_TYPES.includes(file.type) || 
                        (fileExt && allowedExtensions.includes(fileExt));

    if (!isValidType) {
      setImageError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be less than 5 MB');
      return;
    }

    setImageError(null);
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      let contentType = file.type;
      if (!contentType || 
          contentType === 'application/json' || 
          !ALLOWED_TYPES.includes(contentType)) {
        contentType = getMimeTypeFromExtension(fileExt || 'jpg');
      } else if (contentType === 'image/jfif' || contentType === 'image/pjpeg') {
        contentType = 'image/jpeg';
      }

      const fileBlob = new Blob([file], { type: contentType });
      const fileWithCorrectType = new File([fileBlob], file.name, {
        type: contentType,
        lastModified: file.lastModified,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(fileName, fileWithCorrectType, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      const { data: urlData } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setImageUrl(urlData.publicUrl);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image');
      setImagePreview(null);
      setImageUrl('');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl('');
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (company?.product_name) {
      setItemName(company.product_name);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast({
          title: 'Invalid Price',
          description: 'Please enter a valid price greater than 0.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        toast({
          title: 'Invalid Quantity',
          description: 'Please enter a valid quantity greater than 0.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('marketplace_items').insert({
        seller_child_id: childSession.childId,
        item_name: itemName.trim(),
        description: description.trim() || null,
        price: priceNum,
        quantity: quantityNum,
        image_url: imageUrl.trim() || null,
        status: 'available',
      });

      if (error) throw error;

      toast({
        title: '🎉 Success!',
        description: 'Your product has been added to the marketplace!',
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to add product:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add product to marketplace.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border-3 border-gray-300 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b-4 border-gray-300 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl border-2 border-yellow-600">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Promote Your Product</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl transition-all duration-300"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="p-1.5 bg-yellow-100 rounded-lg border border-yellow-300">
                <Tag className="h-4 w-4 text-yellow-600" />
              </span>
              <span>PRODUCT NAME *</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 rounded-lg border border-blue-300">
                <Edit2 className="h-4 w-4 text-blue-600" />
              </span>
              <span>DESCRIPTION</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 resize-none"
              placeholder="Tell others about your product..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="p-1.5 bg-green-100 rounded-lg border border-green-300">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </span>
                <span>PRICE (RM) *</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 rounded-lg border border-purple-300">
                  <Package className="h-4 w-4 text-purple-600" />
                </span>
                <span>QUANTITY *</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="1"
                step="1"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base"
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="p-1.5 bg-pink-100 rounded-lg border border-pink-300">
                <ImageIcon className="h-4 w-4 text-pink-600" />
              </span>
              <span>PRODUCT IMAGE (OPTIONAL)</span>
            </label>
            
            {/* Image Preview */}
            <div className="mb-4">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-40 h-40 object-cover rounded-2xl border-2 border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full p-1.5 hover:from-red-600 hover:to-pink-600 transition-all duration-300 border-2 border-white"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-400 rounded-2xl flex flex-col items-center justify-center hover:border-yellow-400 transition-colors">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center">UPLOAD IMAGE</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif,image/pjpeg"
                onChange={handleFileSelect}
                disabled={uploadingImage || loading}
                className="hidden"
                id="product-image-upload"
              />
              <label
                htmlFor="product-image-upload"
                className={`inline-flex items-center gap-2 px-5 py-3 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer transition-all duration-300 ${
                  uploadingImage || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                }`}
              >
                <Upload className="h-5 w-5" />
                {uploadingImage ? 'UPLOADING...' : imagePreview ? 'CHANGE IMAGE' : 'CHOOSE IMAGE'}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                SUPPORTS: JPEG, PNG, WEBP (MAX 5 MB)
              </p>
              {imageError && (
                <p className="text-sm text-red-600 mt-2 font-medium">{imageError}</p>
              )}
            </div>
          </div>

          {company && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300">
              <p className="text-sm text-blue-800 font-medium">
                <Sparkles className="h-4 w-4 inline mr-2" />
                <span className="font-bold">TIP:</span> Your company product "{company.product_name}" has been pre-filled!
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t-2 border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 font-bold rounded-xl hover:from-gray-400 hover:to-gray-500 transition-all duration-300 border-2 border-gray-500 shadow-md disabled:opacity-50"
              disabled={loading}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 border-2 border-yellow-600 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ADDING...
                </>
              ) : (
                <>
                  <Gift className="h-5 w-5" />
                  ADD TO MARKETPLACE
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditProductModalProps {
  item: MarketplaceItem;
  childSession: ChildSession;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProductModal({
  item,
  childSession,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const { toast } = useToast();
  const [itemName, setItemName] = useState(item.item_name);
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(item.price.toString());
  const [quantity, setQuantity] = useState((item.quantity || 1).toString());
  const [imageUrl, setImageUrl] = useState(item.image_url || '');
  const [imagePreview, setImagePreview] = useState<string | null>(item.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg'];

  const getMimeTypeFromExtension = (extension: string): string => {
    const ext = extension.toLowerCase();
    const mimeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'jfif': 'image/jpeg',
      'pjpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
    };
    return mimeMap[ext] || 'image/jpeg';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const isValidType = ALLOWED_TYPES.includes(file.type) || 
                        (fileExt && allowedExtensions.includes(fileExt));

    if (!isValidType) {
      setImageError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be less than 5 MB');
      return;
    }

    setImageError(null);
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      let contentType = file.type;
      if (!contentType || 
          contentType === 'application/json' || 
          !ALLOWED_TYPES.includes(contentType)) {
        contentType = getMimeTypeFromExtension(fileExt || 'jpg');
      } else if (contentType === 'image/jfif' || contentType === 'image/pjpeg') {
        contentType = 'image/jpeg';
      }

      const fileBlob = new Blob([file], { type: contentType });
      const fileWithCorrectType = new File([fileBlob], file.name, {
        type: contentType,
        lastModified: file.lastModified,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(fileName, fileWithCorrectType, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      const { data: urlData } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setImageUrl(urlData.publicUrl);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image');
      setImagePreview(null);
      setImageUrl('');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl('');
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast({
          title: 'Invalid Price',
          description: 'Please enter a valid price greater than 0.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum < 0) {
        toast({
          title: 'Invalid Quantity',
          description: 'Please enter a valid quantity (0 or greater).',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const newStatus = quantityNum <= 0 ? 'sold' : 'available';

      const { error } = await supabase
        .from('marketplace_items')
        .update({
          item_name: itemName.trim(),
          description: description.trim() || null,
          price: priceNum,
          quantity: quantityNum,
          image_url: imageUrl.trim() || null,
          status: newStatus,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: '🎉 Success!',
        description: 'Your product has been updated!',
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update product.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border-3 border-gray-300 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b-4 border-gray-300 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl border-2 border-blue-600">
              <Edit2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl transition-all duration-300"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              PRODUCT NAME *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 resize-none"
              placeholder="Tell others about your product..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                PRICE (RM) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                QUANTITY *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0"
                step="1"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 text-base"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">
                SET TO 0 TO MARK AS SOLD
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              PRODUCT IMAGE (OPTIONAL)
            </label>
            
            {/* Image Preview */}
            <div className="mb-4">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-40 h-40 object-cover rounded-2xl border-2 border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full p-1.5 hover:from-red-600 hover:to-pink-600 transition-all duration-300 border-2 border-white"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-400 rounded-2xl flex flex-col items-center justify-center hover:border-yellow-400 transition-colors">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center">NO IMAGE</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif,image/pjpeg"
                onChange={handleFileSelect}
                disabled={uploadingImage || loading}
                className="hidden"
                id="edit-product-image-upload"
              />
              <label
                htmlFor="edit-product-image-upload"
                className={`inline-flex items-center gap-2 px-5 py-3 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer transition-all duration-300 ${
                  uploadingImage || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                }`}
              >
                <Upload className="h-5 w-5" />
                {uploadingImage ? 'UPLOADING...' : imagePreview ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                SUPPORTS: JPEG, PNG, WEBP (MAX 5 MB)
              </p>
              {imageError && (
                <p className="text-sm text-red-600 mt-2 font-medium">{imageError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 font-bold rounded-xl hover:from-gray-400 hover:to-gray-500 transition-all duration-300 border-2 border-gray-500 shadow-md disabled:opacity-50"
              disabled={loading}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 border-2 border-blue-600 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  UPDATING...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  UPDATE PRODUCT
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
