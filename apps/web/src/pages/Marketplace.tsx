import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, Search, DollarSign, User, Package, X, Upload, Image as ImageIcon, ShoppingCart, Check, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';

// Marketplace page component

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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

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

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch company info
        // Use * to avoid 406 errors with specific column selection and RLS
        if (!childSession) return;
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('child_id', childSession.childId)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
        } else if (companyData) {
          setMyCompany({
            company_name: companyData.company_name,
            product_name: companyData.product_name,
          });
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

        // Filter out own items from marketplace
        if (!childSession) return;
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
      }
    }

    fetchData();
  }, [childSession]);

  const handleRefresh = async () => {
    if (!childSession) return;

    try {
      setLoading(true);

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
          const { data: childData } = await supabase
            .from('children')
            .select('name')
            .eq('id', item.seller_child_id)
            .single();

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

      const otherItems = itemsWithSellers.filter(
        (item) => item.seller_child_id !== childSession.childId
      );
      setItems(otherItems);

      const myItemsList = itemsWithSellers.filter(
        (item) => item.seller_child_id === childSession.childId
      );
      setMyItems(myItemsList);
    } catch (err) {
      console.error('Failed to refresh marketplace:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh marketplace.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Marketplace 🛒
              </h1>
              <p className="text-lg text-gray-600">
                Discover and promote products from other young entrepreneurs!
              </p>
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Promote Product
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, sellers, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        {/* My Products Section */}
        {myItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isOwnItem={true}
                  onRefresh={handleRefresh}
                  onProductClick={() => setSelectedProductId(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Marketplace Items */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Discover Products
          </h2>
          {loading ? (
            <LoadingAnimation message="Loading marketplace..." variant="inline" showSkeleton={true} skeletonCount={8} />
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">No products found</p>
              <p className="text-gray-500">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Be the first to promote a product!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isOwnItem={false}
                  onRefresh={handleRefresh}
                  onProductClick={() => setSelectedProductId(item.id)}
                />
              ))}
            </div>
          )}
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

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onProductUpdate={handleRefresh}
      />
    </div>
  );
}

interface ProductCardProps {
  item: MarketplaceItem;
  isOwnItem: boolean;
  onRefresh: () => void;
  onProductClick: () => void;
}

function ProductCard({ item, isOwnItem, onRefresh, onProductClick }: ProductCardProps) {
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
      // Fetch buyer's company to check balance
      async function fetchBuyerCompany() {
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
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

    // Check if item is available (quantity > 0)
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
      // Start a transaction - we'll do this in steps
      // 1. Create purchase record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('marketplace_purchases')
        .insert({
          buyer_child_id: childSession.childId,
          item_id: item.id,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // 2. Create transaction for buyer (expense)
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

      // 3. Get current buyer company data to calculate new totals
      const { data: currentBuyerCompany, error: fetchBuyerError } = await supabase
        .from('companies')
        .select('total_expenses')
        .eq('id', buyerCompany.id)
        .single();

      if (fetchBuyerError) throw fetchBuyerError;

      // Update buyer's company balance
      const { error: buyerUpdateError } = await supabase
        .from('companies')
        .update({
          current_balance: buyerCompany.current_balance - item.price,
          total_expenses: (currentBuyerCompany?.total_expenses || 0) + item.price,
        })
        .eq('id', buyerCompany.id);

      if (buyerUpdateError) throw buyerUpdateError;

      // 4. Get seller's company
      const { data: sellerCompany, error: sellerCompanyError } = await supabase
        .from('companies')
        .select('*')
        .eq('child_id', item.seller_child_id)
        .single();

      if (sellerCompanyError && sellerCompanyError.code !== 'PGRST116') {
        // If seller doesn't have a company, that's okay - we'll skip revenue update
        console.warn('Seller company not found:', sellerCompanyError);
      } else if (sellerCompany) {
        // 5. Create transaction for seller (revenue)
        const { error: sellerTxError } = await supabase
          .from('company_transactions')
          .insert({
            company_id: sellerCompany.id,
            transaction_type: 'sale',
            amount: item.price,
            description: `Sold: ${item.item_name} to ${childSession.childName || 'a buyer'}`,
          });

        if (sellerTxError) throw sellerTxError;

        // 6. Update seller's company balance
        const { error: sellerUpdateError } = await supabase
          .from('companies')
          .update({
            current_balance: sellerCompany.current_balance + item.price,
            total_revenue: (sellerCompany.total_revenue || 0) + item.price,
          })
          .eq('id', sellerCompany.id);

        if (sellerUpdateError) throw sellerUpdateError;

        // 6a. Award achievements and XP for the seller (check for sale achievements)
        // Company achievements are checked on any activity type, so we use 'sale' for clarity
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
              // Log for debugging - seller will see achievements when they check their profile
              console.warn(`Seller earned ${newAchievements.length} achievement(s):`, 
                newAchievements.map((a: { name: string }) => a.name).join(', '));
            }
          }
        } catch (err) {
          // Don't fail purchase if achievement check fails
          console.warn('Failed to check achievements for seller:', err);
        }
      }

      // 7. Update purchase record with transaction ID
      await supabase
        .from('marketplace_purchases')
        .update({ transaction_id: buyerTransaction.id })
        .eq('id', purchaseData.id);

      // 8. Decrement quantity and update status if needed
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
        title: 'Purchase Successful! 🎉',
        description: `You've purchased ${item.item_name} for ${formatCurrency(item.price)}!`,
        variant: 'success',
      });

      setShowPurchaseConfirm(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to purchase item:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to complete purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-yellow-300 hover:shadow-xl transition-shadow">
      {/* Product Image - Clickable */}
      <div onClick={onProductClick} className="block cursor-pointer">
        <div className="h-48 bg-gradient-to-br from-yellow-100 to-pink-100 flex items-center justify-center hover:opacity-90 transition-opacity">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.item_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-20 w-20 text-gray-400" />
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <div onClick={onProductClick} className="block cursor-pointer hover:text-yellow-600 transition-colors">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{item.item_name}</h3>
        </div>
        {item.description && (
          <div onClick={onProductClick} className="block cursor-pointer">
            <p className="text-gray-600 mb-4 line-clamp-2 hover:text-gray-800 transition-colors">{item.description}</p>
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span className="font-semibold">{item.seller_name}</span>
          {item.seller_company && (
            <>
              <span>•</span>
              <span className="italic">{item.seller_company}</span>
            </>
          )}
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(item.price)}
            </span>
          </div>
          {item.status === 'available' && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span className="font-semibold">
                {item.quantity || 0} {item.quantity === 1 ? 'left' : 'left'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isOwnItem ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="flex-1 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : item.status === 'available' && (item.quantity || 0) > 0 ? (
          <button
            onClick={() => setShowPurchaseConfirm(true)}
            className="w-full py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Buy Now
          </button>
        ) : (
          <div className="w-full py-2 bg-gray-200 text-gray-600 font-semibold rounded-lg flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Sold
          </div>
        )}
      </div>

      {/* Remove Confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Remove Product?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove "{item.item_name}" from the marketplace?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleRemove}
                className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation */}
      {showPurchaseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-yellow-600" />
              Confirm Purchase
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-700 font-semibold mb-2">Item:</p>
                <p className="text-gray-900 text-lg">{item.item_name}</p>
              </div>
              <div>
                <p className="text-gray-700 font-semibold mb-2">Price:</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(item.price)}</p>
              </div>
              {(item.quantity || 0) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Available:</strong> {item.quantity || 0} {item.quantity === 1 ? 'item' : 'items'} remaining
                  </p>
                </div>
              )}
              {buyerCompany && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Your Balance:</strong> {formatCurrency(buyerCompany.current_balance)}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>After Purchase:</strong>{' '}
                    {formatCurrency(buyerCompany.current_balance - item.price)}
                  </p>
                </div>
              )}
              {buyerCompany && buyerCompany.current_balance < item.price && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ Insufficient funds! You need {formatCurrency(item.price - buyerCompany.current_balance)} more.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPurchaseConfirm(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                disabled={purchasing}
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || !!(buyerCompany && buyerCompany.current_balance < item.price)}
                className="flex-1 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Confirm Purchase
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg'];

  // Map file extensions to MIME types
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

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const isValidType = ALLOWED_TYPES.includes(file.type) || 
                        (fileExt && allowedExtensions.includes(fileExt));

    if (!isValidType) {
      setImageError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be less than 5 MB');
      return;
    }

    setImageError(null);
    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Determine correct MIME type
      let contentType = file.type;
      if (!contentType || 
          contentType === 'application/json' || 
          !ALLOWED_TYPES.includes(contentType)) {
        contentType = getMimeTypeFromExtension(fileExt || 'jpg');
      } else if (contentType === 'image/jfif' || contentType === 'image/pjpeg') {
        contentType = 'image/jpeg';
      }

      // Create a new Blob with the correct MIME type
      const fileBlob = new Blob([file], { type: contentType });
      const fileWithCorrectType = new File([fileBlob], file.name, {
        type: contentType,
        lastModified: file.lastModified,
      });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(fileName, fileWithCorrectType, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setImageUrl(urlData.publicUrl);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setImageError(error.message || 'Failed to upload image');
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

  // Pre-fill with company product if available
  useEffect(() => {
    if (company?.product_name) {
      setItemName(company.product_name);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
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

      if (!childSession?.childId) {
        toast({
          title: 'Error',
          description: 'Session expired. Please log in again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const insertData: any = {
        seller_child_id: childSession.childId,
        item_name: itemName.trim(),
        description: description.trim() || null,
        price: priceNum,
        image_url: imageUrl.trim() || null,
        status: 'available',
      };

      // Only include quantity if the column exists (migration may not be applied)
      // The database default will handle it if column doesn't exist
      try {
        insertData.quantity = quantityNum;
      } catch (e) {
        // Ignore if quantity field doesn't exist
      }

      const { error } = await supabase.from('marketplace_items').insert(insertData).select();

      if (error) {
        console.error('Marketplace insert error:', error);
        // Check if it's a constraint violation
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('This item already exists. Please try again.');
        } else if (error.code === '23514' || error.message?.includes('check constraint')) {
          throw new Error('Invalid data. Please check your input values.');
        } else if (error.code === '42703' || (error.message?.includes('column') && error.message?.includes('quantity'))) {
          // Column doesn't exist - retry without quantity
          delete insertData.quantity;
          const { error: retryError } = await supabase.from('marketplace_items').insert(insertData);
          if (retryError) throw retryError;
        } else if (error.code === 'PGRST301' || error.message?.includes('409')) {
          // Conflict error - might be duplicate or constraint
          throw new Error('Unable to add item. It may already exist or there was a conflict.');
        } else {
          throw error;
        }
      }

      toast({
        title: 'Success! 🎉',
        description: 'Your product has been added to the marketplace!',
      });
      onSuccess();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to add product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product to marketplace.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Promote Your Product</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Tell others about your product..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (RM) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="1"
                step="1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Image (Optional)
            </label>
            
            {/* Image Preview */}
            <div className="mb-3">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
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
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
                  uploadingImage || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Uploading...' : imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, or WebP (max 5 MB)
              </p>
              {imageError && (
                <p className="text-sm text-red-600 mt-1">{imageError}</p>
              )}
            </div>
          </div>

          {company && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Your company product "{company.product_name}" has
                been pre-filled. You can edit it or add a different product!
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Marketplace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditProductModalProps {
  item: MarketplaceItem;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProductModal({
  item,
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg'];

  // Map file extensions to MIME types
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

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const isValidType = ALLOWED_TYPES.includes(file.type) || 
                        (fileExt && allowedExtensions.includes(fileExt));

    if (!isValidType) {
      setImageError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be less than 5 MB');
      return;
    }

    setImageError(null);
    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Determine correct MIME type
      let contentType = file.type;
      if (!contentType || 
          contentType === 'application/json' || 
          !ALLOWED_TYPES.includes(contentType)) {
        contentType = getMimeTypeFromExtension(fileExt || 'jpg');
      } else if (contentType === 'image/jfif' || contentType === 'image/pjpeg') {
        contentType = 'image/jpeg';
      }

      // Create a new Blob with the correct MIME type
      const fileBlob = new Blob([file], { type: contentType });
      const fileWithCorrectType = new File([fileBlob], file.name, {
        type: contentType,
        lastModified: file.lastModified,
      });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(fileName, fileWithCorrectType, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setImageUrl(urlData.publicUrl);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setImageError(error.message || 'Failed to upload image');
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

      // Determine status based on quantity
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
        title: 'Success! 🎉',
        description: 'Your product has been updated!',
      });
      onSuccess();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to update product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Edit2 className="h-6 w-6" />
            Edit Product
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Tell others about your product..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (RM) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0"
                step="1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set to 0 to mark as sold
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Image (Optional)
            </label>
            
            {/* Image Preview */}
            <div className="mb-3">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
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
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
                  uploadingImage || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Uploading...' : imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, or WebP (max 5 MB)
              </p>
              {imageError && (
                <p className="text-sm text-red-600 mt-1">{imageError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

