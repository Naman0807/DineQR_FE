import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Pencil, Plus, RefreshCw, Shield, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../stores/AuthContext';
import type { RestaurantStatus, RestaurantWithAdmin } from '../types';

interface FormState {
  restaurant_name: string;
  admin_username: string;
  admin_email: string;
  admin_password: string;
}

const EMPTY_FORM: FormState = {
  restaurant_name: '',
  admin_username: '',
  admin_email: '',
  admin_password: '',
};

export function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<RestaurantWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantWithAdmin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const stats = useMemo(() => {
    const total = restaurants.length;
    const active = restaurants.filter((r) => r.status === 'active').length;
    const pending = restaurants.filter((r) => r.status === 'pending').length;
    const revoked = restaurants.filter((r) => r.status === 'deactivated').length;
    return { total, active, pending, revoked };
  }, [restaurants]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.superadmin.getRestaurants();
      setRestaurants(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: RestaurantStatus) => {
    try {
      setUpdatingId(id);
      await api.superadmin.updateRestaurantStatus(id, newStatus);
      setSuccessMessage(`Restaurant status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchRestaurants();
    } catch (err: any) {
      setError(err.message || 'Failed to update restaurant status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (restaurant: RestaurantWithAdmin) => {
    const confirmed = window.confirm(`Remove restaurant "${restaurant.name}" and its admin access?`);
    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(restaurant.id);
      await api.superadmin.deleteRestaurant(restaurant.id);
      setSuccessMessage(`Removed ${restaurant.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchRestaurants();
    } catch (err: any) {
      setError(err.message || 'Failed to remove restaurant');
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreateForm = () => {
    setEditingRestaurant(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const openEditForm = (restaurant: RestaurantWithAdmin) => {
    setEditingRestaurant(restaurant);
    setForm({
      restaurant_name: restaurant.name,
      admin_username: restaurant.admin_username,
      admin_email: restaurant.admin_email,
      admin_password: '',
    });
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRestaurant(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingRestaurant) {
        await api.superadmin.updateRestaurant(editingRestaurant.id, {
          restaurant_name: form.restaurant_name,
          admin_username: form.admin_username,
          admin_email: form.admin_email,
          ...(form.admin_password ? { admin_password: form.admin_password } : {}),
        });
        setSuccessMessage('Restaurant admin updated');
      } else {
        await api.superadmin.createRestaurant(form);
        setSuccessMessage('Restaurant admin created');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      closeForm();
      await fetchRestaurants();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login', { replace: true });
  };

  const getStatusBadge = (status: RestaurantStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      deactivated: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage restaurant admin access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRestaurants}
            className="p-2.5 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 min-h-[44px] text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Total Restaurants</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Revoked</p>
          <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{successMessage}</div>
      )}
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRestaurant ? 'Edit Restaurant Admin' : 'Add Restaurant Admin'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.restaurant_name}
              onChange={(e) => setForm((prev) => ({ ...prev, restaurant_name: e.target.value }))}
              placeholder="Restaurant Name"
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="text"
              value={form.admin_username}
              onChange={(e) => setForm((prev) => ({ ...prev, admin_username: e.target.value }))}
              placeholder="Admin Username"
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => setForm((prev) => ({ ...prev, admin_email: e.target.value }))}
              placeholder="Admin Email"
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="password"
              value={form.admin_password}
              onChange={(e) => setForm((prev) => ({ ...prev, admin_password: e.target.value }))}
              placeholder={editingRestaurant ? 'New Password (optional)' : 'Admin Password'}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required={!editingRestaurant}
            />
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
              >
                {isSubmitting ? 'Saving...' : (editingRestaurant ? 'Save Changes' : 'Create')}
              </button>
              <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Restaurant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{restaurant.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {restaurant.admin_username}
                    <div className="text-xs text-gray-500">{restaurant.admin_email}</div>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(restaurant.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {restaurant.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(restaurant.id, 'active')}
                            disabled={updatingId === restaurant.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(restaurant.id, 'deactivated')}
                            disabled={updatingId === restaurant.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {restaurant.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(restaurant.id, 'deactivated')}
                          disabled={updatingId === restaurant.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300"
                        >
                          <XCircle className="w-4 h-4" />
                          Revoke
                        </button>
                      )}
                      {restaurant.status === 'deactivated' && (
                        <button
                          onClick={() => handleStatusUpdate(restaurant.id, 'active')}
                          disabled={updatingId === restaurant.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(restaurant)}
                        disabled={updatingId === restaurant.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(restaurant)}
                        disabled={updatingId === restaurant.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-12 text-gray-500">No restaurants registered yet.</div>
        )}
      </div>
    </div>
  );
}
