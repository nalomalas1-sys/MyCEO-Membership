import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';
import { 
  Package, 
  DollarSign, 
  User, 
  Building2, 
  Calendar,
  ShoppingCart,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

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

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface ProductDetailsModalProps {
  productId: string | null;
  onClose: () => void;
  onProductUpdate?: () => void;
}

export function ProductDetailsModal({ productId, onClose, onProductUpdate }: ProductDetailsModalProps) {
  const { toast } = useToast();
  const [product, setProduct] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [buyerCompany, setBuyerCompany] = useState<{ id: string; current_balance: number; company_name: string } | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [isOwnItem, setIsOwnItem] = useState(false);

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
    if (productId) {
      fetchProduct();
    } else {
      setProduct(null);
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (childSession && product) {
      setIsOwnItem(product.seller_child_id === childSession.childId);
      
      if (showPurchaseConfirm && !isOwnItem) {
        fetchBuyerCompany();
      }
    }
  }, [childSession, product, showPurchaseConfirm, isOwnItem]);

  async function fetchProduct() {
    if (!productId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Product Not Found',
          description: 'This product does not exist or has been removed.',
          variant: 'destructive',
        });
        onClose();
        return;
      }

      // Fetch seller information
      const { data: childData } = await supabase
        .from('children')
        .select('name')
        .eq('id', data.seller_child_id)
        .single();

      const { data: companyData } = await supabase
        .from('companies')
        .select('company_name')
        .eq('child_id', data.seller_child_id)
        .single();

      setProduct({
        ...data,
        seller_name: childData?.name || 'Unknown',
        seller_company: companyData?.company_name || null,
      });
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      toast({
        title: 'Error',
        description: 'Failed to load product details.',
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function fetchBuyerCompany() {
    if (!childSession) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('child_id', childSession.childId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBuyerCompany(data || null);
    } catch (err) {
      console.error('Failed to fetch buyer company:', err);
    }
  }

  const handlePurchase = async () => {
    if (!childSession || !buyerCompany || !product) {
      toast({
        title: 'Error',
        description: 'Please create a company first to make purchases.',
        variant: 'destructive',
      });
      return;
    }

    const availableQuantity = product.quantity || 0;
    if (availableQuantity <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This item is no longer available.',
        variant: 'destructive',
      });
      setShowPurchaseConfirm(false);
      return;
    }

    if (buyerCompany.current_balance < product.price) {
      toast({
        title: 'Insufficient Funds',
        description: `You need ${formatCurrency(product.price)} but only have ${formatCurrency(buyerCompany.current_balance)}.`,
        variant: 'destructive',
      });
      setShowPurchaseConfirm(false);
      return;
    }

    setPurchasing(true);

    try {
      // Create purchase record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('marketplace_purchases')
        .insert({
          buyer_child_id: childSession.childId,
          item_id: product.id,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create transaction for buyer (expense)
      const { data: buyerTransaction, error: buyerTxError } = await supabase
        .from('company_transactions')
        .insert({
          company_id: buyerCompany.id,
          transaction_type: 'purchase',
          amount: product.price,
          description: `Purchased: ${product.item_name} from ${product.seller_name}`,
        })
        .select()
        .single();

      if (buyerTxError) throw buyerTxError;

      // Get current buyer company data
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
          current_balance: buyerCompany.current_balance - product.price,
          total_expenses: (currentBuyerCompany?.total_expenses || 0) + product.price,
        })
        .eq('id', buyerCompany.id);

      if (buyerUpdateError) throw buyerUpdateError;

      // Get seller's company
      const { data: sellerCompany, error: sellerCompanyError } = await supabase
        .from('companies')
        .select('*')
        .eq('child_id', product.seller_child_id)
        .single();

      if (sellerCompanyError && sellerCompanyError.code !== 'PGRST116') {
        console.warn('Seller company not found:', sellerCompanyError);
      } else if (sellerCompany) {
        // Create transaction for seller (revenue)
        const { error: sellerTxError } = await supabase
          .from('company_transactions')
          .insert({
            company_id: sellerCompany.id,
            transaction_type: 'sale',
            amount: product.price,
            description: `Sold: ${product.item_name} to ${childSession.childName || 'a buyer'}`,
          });

        if (sellerTxError) throw sellerTxError;

        // Update seller's company balance
        const { error: sellerUpdateError } = await supabase
          .from('companies')
          .update({
            current_balance: sellerCompany.current_balance + product.price,
            total_revenue: (sellerCompany.total_revenue || 0) + product.price,
          })
          .eq('id', sellerCompany.id);

        if (sellerUpdateError) throw sellerUpdateError;

        // Award achievements and XP for the seller
        try {
          const { data: awardData, error: awardError } = await supabase.rpc('award_achievements_and_xp', {
            p_child_id: product.seller_child_id,
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

      // Update purchase record with transaction ID
      await supabase
        .from('marketplace_purchases')
        .update({ transaction_id: buyerTransaction.id })
        .eq('id', purchaseData.id);

      // Decrement quantity and update status if needed
      const currentQuantity = (product.quantity || 1) - 1;
      const newStatus = currentQuantity <= 0 ? 'sold' : 'available';
      
      const { error: itemUpdateError } = await supabase
        .from('marketplace_items')
        .update({ 
          quantity: currentQuantity,
          status: newStatus
        })
        .eq('id', product.id);

      if (itemUpdateError) throw itemUpdateError;

      toast({
        title: 'Purchase Successful! 🎉',
        description: `You've purchased ${product.item_name} for ${formatCurrency(product.price)}!`,
        variant: 'success',
      });

      setShowPurchaseConfirm(false);
      fetchProduct(); // Refresh product data
      if (onProductUpdate) {
        onProductUpdate(); // Refresh the parent component's product list
      }
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

  if (!productId) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <LoadingAnimation message="Loading product details..." variant="modal" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const isLowStock = (product.quantity || 0) < 3 && (product.quantity || 0) > 0;
  const isAvailable = product.status === 'available' && (product.quantity || 0) > 0;

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto p-4"
        onClick={handleBackdropClick}
      >
        <div className="min-h-full flex items-center justify-center">
          <div 
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-yellow-300 max-w-4xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="relative h-96 md:h-auto bg-gradient-to-br from-yellow-100 to-pink-100 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-32 w-32 text-gray-400" />
                )}
                
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold border-2 ${
                  product.status === 'available' 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white border-green-600' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-600'
                }`}>
                  {product.status === 'available' ? 'AVAILABLE' : 'SOLD'}
                </div>
                
                {/* Low Stock Warning */}
                {isLowStock && (
                  <div className="absolute top-20 right-4 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white text-sm font-bold rounded-full border-2 border-orange-600">
                    🔥 LOW STOCK: {product.quantity} LEFT
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.item_name}</h1>
                
                {/* Price */}
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Seller Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Sold By</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-lg font-bold text-gray-900">{product.seller_name}</span>
                  </div>
                  {product.seller_company && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 italic">{product.seller_company}</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="mb-6 space-y-3">
                  {product.quantity !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">Quantity Available:</span>
                      <span className="text-lg font-bold text-blue-600">{product.quantity}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Listed on {new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                {childSession ? (
                  isOwnItem ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 font-medium">This is your product</p>
                    </div>
                  ) : isAvailable ? (
                    <button
                      onClick={() => setShowPurchaseConfirm(true)}
                      className="w-full py-4 bg-yellow-400 text-gray-900 font-bold text-lg rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-3 shadow-lg"
                    >
                      <ShoppingCart className="h-6 w-6" />
                      Buy Now
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-gray-200 text-gray-600 font-semibold rounded-lg flex items-center justify-center gap-2">
                      <Check className="h-6 w-6" />
                      Sold Out
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-yellow-600" />
              Confirm Purchase
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-700 font-semibold mb-2">Item:</p>
                <p className="text-gray-900 text-lg">{product.item_name}</p>
              </div>
              <div>
                <p className="text-gray-700 font-semibold mb-2">Price:</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(product.price)}</p>
              </div>
              {(product.quantity || 0) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Available:</strong> {product.quantity || 0} {product.quantity === 1 ? 'item' : 'items'} remaining
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
                    {formatCurrency(buyerCompany.current_balance - product.price)}
                  </p>
                </div>
              )}
              {buyerCompany && buyerCompany.current_balance < product.price && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ Insufficient funds! You need {formatCurrency(product.price - buyerCompany.current_balance)} more.
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
                disabled={
                  purchasing ||
                  !!(buyerCompany && buyerCompany.current_balance < product.price)
                }
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
    </>
  );
}

