import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';
import type { MenuCategory, MenuItemWithCategory, MenuItemCreate, MenuItemUpdate } from '../../types';
import styles from './MenuManagementPage.module.css';

export function MenuManagementPage() {
  // ... (state remains same)
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemWithCategory | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [itemForm, setItemForm] = useState<MenuItemCreate>({
    category_id: '',
    name: '',
    description: '',
    price: 0,
    is_available: true,
    image_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        api.menu.getCategories(),
        api.menu.getItems(false),
      ]);
      setCategories(categoriesData.sort((a, b) => a.display_order - b.display_order));
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await api.menu.createCategory({ name: categoryName });
      setCategoryName('');
      setShowCategoryModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? All items in it will also be deleted.')) return;
    try {
      await api.menu.deleteCategory(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCreateItem = async () => {
    try {
      await api.menu.createItem(itemForm);
      setShowItemModal(false);
      resetItemForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Failed to create menu item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      const updateData: MenuItemUpdate = {
        name: itemForm.name,
        description: itemForm.description,
        price: itemForm.price,
        is_available: itemForm.is_available,
        image_url: itemForm.image_url,
      };
      await api.menu.updateItem(editingItem.id, updateData);
      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      fetchData();
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update menu item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.menu.deleteItem(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (item: MenuItemWithCategory) => {
    try {
      await api.menu.toggleAvailability(item.id, !item.is_available);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      category_id: categories[0]?.id || '',
      name: '',
      description: '',
      price: 0,
      is_available: true,
      image_url: '',
    });
  };

  const openEditModal = (item: MenuItemWithCategory) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setShowItemModal(true);
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Menu Management</h1>
          <p className={styles.subtitle}>Manage categories and menu items</p>
        </div>
        <div className={styles.actions}>
          <button
            onClick={() => setShowCategoryModal(true)}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => {
              resetItemForm();
              setEditingItem(null);
              setShowItemModal(true);
            }}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabsArea}>
          <div className={styles.tabsList}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`${styles.tabBtn} ${selectedCategory === null ? styles.tabBtnActive : ''}`}
            >
              All ({menuItems.length})
            </button>
            {categories.map(category => {
              const count = menuItems.filter(i => i.category_id === category.id).length;
              return (
                <div key={category.id} className="flex items-center gap-1 group">
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${styles.tabBtn} ${selectedCategory === category.id ? styles.tabBtnActive : ''}`}
                  >
                    {category.name} ({count})
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors sm:opacity-0 group-hover:opacity-100 hidden sm:block"
                    title="Delete Category"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View */}
        <div className={`${styles.mobileList} lg:hidden`}>
          {filteredItems.map(item => (
            <div key={item.id} className={styles.mobileItem}>
              <div className="flex gap-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className={styles.itemImage} />
                ) : (
                  <div className={styles.itemPlaceholder}>
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.category?.name}</p>
                    </div>
                    <span className={styles.price}>₹{item.price.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`${styles.badge} ${item.is_available ? styles.badgeAvailable : styles.badgeUnavailable}`}
                    >
                      {item.is_available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </button>

                    <div className={styles.actionBtns}>
                      <button
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                        className={styles.iconBtn}
                      >
                        {expandedItem === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className={styles.iconBtn}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedItem === item.id && item.description && (
                    <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100 leading-relaxed">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              No menu items. Add your first item to get started.
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className={`${styles.tableContainer} hidden lg:block`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.itemInfo}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className={styles.itemImage} />
                      ) : (
                        <div className={styles.itemPlaceholder}>
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemDesc}>{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600">{item.category?.name}</span>
                  </td>
                  <td>
                    <span className={styles.price}>₹{item.price.toFixed(2)}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`${styles.badge} ${item.is_available ? styles.badgeAvailable : styles.badgeUnavailable}`}
                    >
                      {item.is_available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        onClick={() => openEditModal(item)}
                        className={styles.iconBtn}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              No menu items. Add your first item to get started.
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-md">
            <h2 className="text-lg md:text-xl font-bold mb-4">Add Category</h2>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            />
            <div className="flex gap-2 md:gap-3 justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2.5 min-h-[44px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!categoryName.trim()}
                className="px-4 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              {editingItem ? 'Edit Item' : 'Add Menu Item'}
            </h2>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={itemForm.category_id}
                  onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={!!editingItem}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input
                  type="text"
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.is_available}
                  onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Available</span>
              </label>
            </div>

            <div className="flex gap-2 md:gap-3 justify-end mt-5 md:mt-6">
              <button
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2.5 min-h-[44px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleCreateItem}
                disabled={!itemForm.name || !itemForm.category_id || itemForm.price <= 0}
                className="px-4 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
