import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import type { MenuCategory, MenuItemWithCategory } from '../../types';
import { MenuItem } from '../../components/admin/MenuItem/MenuItem';
import { CategoryModal } from '../../components/admin/CategoryModal';
import { MenuItemModal } from '../../components/admin/MenuItemModal';
import styles from './MenuManagementPage.module.css';

export function MenuManagementPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemWithCategory | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  const openEditModal = (item: MenuItemWithCategory) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
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
            className={`${styles.btn} ${styles.btnSecondary} ${styles.desktopOnly}`}
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowItemModal(true);
            }}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={16} />
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
                <div key={category.id} className={styles.categoryGroup}>
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${styles.tabBtn} ${selectedCategory === category.id ? styles.tabBtnActive : ''}`}
                  >
                    {category.name} ({count})
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className={styles.deleteCatBtn}
                    title="Delete Category"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.responsiveList}>
          <div className={styles.tableHeader}>
            <div>Item</div>
            <div>Category</div>
            <div>Price</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className={styles.itemsList}>
            {filteredItems.map(item => (
              <MenuItem
                key={item.id}
                item={item}
                isExpanded={expandedItem === item.id}
                onExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                onEdit={openEditModal}
                onDelete={handleDeleteItem}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              No menu items. Add your first item to get started.
            </div>
          )}
        </div>
      </div>

      <CategoryModal
        visible={showCategoryModal}
        onCancel={() => setShowCategoryModal(false)}
        onSuccess={() => {
          setShowCategoryModal(false);
          fetchData();
        }}
      />

      <MenuItemModal
        visible={showItemModal}
        onCancel={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setShowItemModal(false);
          setEditingItem(null);
          fetchData();
        }}
        categories={categories}
        editingItem={editingItem}
      />
    </div>
  );
}
