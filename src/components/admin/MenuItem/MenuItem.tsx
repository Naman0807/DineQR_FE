import { Package, Check, X, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { MenuItemWithCategory } from '../../../types';
import styles from './MenuItem.module.css';

interface MenuItemProps {
    item: MenuItemWithCategory;
    isExpanded: boolean;
    onExpand: () => void;
    onEdit: (item: MenuItemWithCategory) => void;
    onDelete: (id: string) => void;
    onToggleAvailability: (item: MenuItemWithCategory) => void;
}

export function MenuItem({
    item,
    isExpanded,
    onExpand,
    onEdit,
    onDelete,
    onToggleAvailability,
}: MenuItemProps) {
    return (
        <div className={styles.item}>
            <div className={styles.mobileMain}>
                {/* Item Column */}
                <div className={styles.content}>
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className={styles.image} />
                    ) : (
                        <div className={styles.placeholder}>
                            <Package className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div className={styles.titleRow}>
                        <div>
                            <h4 className={styles.name}>{item.name}</h4>
                            <p className={`${styles.categoryLabel} lg:hidden`}>{item.category?.name}</p>
                        </div>
                        <span className={`${styles.price} lg:hidden`}>₹{item.price.toFixed(2)}</span>
                    </div>
                </div>

                {/* Category Column (Desktop Only) */}
                <div className={`${styles.categoryCell} hidden lg:block`}>
                    {item.category?.name}
                </div>

                {/* Price Column (Desktop Only) */}
                <div className={`${styles.desktopPrice} hidden lg:block`}>
                    ₹{item.price.toFixed(2)}
                </div>

                {/* Status Column */}
                <div className={styles.statusCell}>
                    <button
                        onClick={() => onToggleAvailability(item)}
                        className={`${styles.badge} ${item.is_available ? styles.badgeAvailable : styles.badgeUnavailable}`}
                    >
                        {item.is_available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {item.is_available ? 'Available' : 'Out of Stock'}
                    </button>
                </div>

                {/* Actions Column */}
                <div className={styles.actionBtns}>
                    <button
                        onClick={onExpand}
                        className={`${styles.iconBtn} lg:hidden`}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => onEdit(item)}
                        className={styles.iconBtn}
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mobile Expanded Content */}
            {isExpanded && item.description && (
                <div className={`${styles.expandedContent} lg:hidden`}>
                    <p className={styles.description}>{item.description}</p>
                </div>
            )}

            {/* Desktop Description - shown inline in desktop grid */}
            {item.description && (
                <div className={`${styles.descriptionRow} hidden lg:block`}>
                    <p className={styles.description}>{item.description}</p>
                </div>
            )}
        </div>
    );
}
