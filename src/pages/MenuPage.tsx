import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { api } from '../services/api';
import { useSession } from '../stores/SessionContext';
import { useCart } from '../stores/CartContext';
import type { MenuItemWithCategory, MenuCategory } from '../types';

export function MenuPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, tableNumber, sessionId, qrToken } = useSession();
  const { addItem, removeItem, updateQuantity, items, getItemCount } = useCart();
  
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('table') || qrToken;

  useEffect(() => {
    const initSession = async () => {
      try {
        if (!token && !sessionId) {
          setError('Invalid QR code. Please scan again.');
          setLoading(false);
          return;
        }

        if (!restaurantSlug && token) {
          const tableData = await api.tables.getByToken(token);
          if (!tableData.restaurant_slug) {
            setError('Restaurant not found');
            setLoading(false);
            return;
          }
          navigate(`/${tableData.restaurant_slug}/menu?table=${token}`, { replace: true });
          return;
        }

        if (!restaurantSlug) {
          setError('Restaurant not found');
          setLoading(false);
          return;
        }

        if (!sessionId && token) {
          const sessionData = await api.tables.getOrCreateSession(token, restaurantSlug);
          const tableData = await api.tables.getByToken(token, restaurantSlug);
          setSession(tableData.id, sessionData.table_number, sessionData.session_id, token);
        }

        const [itemsData, categoriesData] = await Promise.all([
          api.menu.getItems(true, restaurantSlug),
          api.menu.getCategories(restaurantSlug),
        ]);

        setMenuItems(itemsData);
        setCategories(categoriesData.sort((a, b) => a.display_order - b.display_order));
        setLoading(false);
      } catch (err) {
        setError('Failed to load menu. Please try again.');
        setLoading(false);
      }
    };

    initSession();
  }, [token, sessionId, setSession, restaurantSlug]);

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  const getItemQuantity = (menuItemId: string) => {
    const item = items.find(i => i.menu_item.id === menuItemId);
    return item?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-2 safe-top">
          <div className="py-3 md:py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Menu</h1>
                {tableNumber && (
                  <p className="text-sm text-gray-500">Table {tableNumber}</p>
                )}
              </div>
              <button
                onClick={() => navigate(`/${restaurantSlug}/cart`)}
                className="relative p-2.5 min-h-[44px] min-w-[44px] text-gray-600 hover:text-orange-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="pb-3 md:pb-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="py-4 md:py-5 lg:py-6">
          <div className="space-y-4 md:space-y-5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4 md:p-5 flex gap-3 md:gap-4"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl md:text-2xl">🍽️</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5 md:mt-1">
                    {item.description}
                  </p>
                  <div className="flex justify-between items-center mt-2 md:mt-3">
                    <span className="font-bold text-orange-500 text-base md:text-lg">
                      ₹{item.price.toFixed(2)}
                    </span>
                    {getItemQuantity(item.id) > 0 ? (
                      <div className="flex items-center gap-2 md:gap-3">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-11 h-11 md:w-10 md:h-10 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 md:w-8 text-center font-medium text-base">
                          {getItemQuantity(item.id)}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                          className="w-11 h-11 md:w-10 md:h-10 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(item)}
                        className="px-5 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No items available in this category.
            </div>
          )}
        </main>

        {getItemCount() > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:p-5 safe-bottom">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => navigate(`/${restaurantSlug}/cart`)}
                className="w-full py-3.5 md:py-4 min-h-[52px] bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                View Cart ({getItemCount()} items)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
