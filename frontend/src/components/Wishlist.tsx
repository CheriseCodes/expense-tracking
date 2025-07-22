import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { wishlistApi, userApi } from '../services/api';
import type { WishlistItem, WishlistItemCreate, WishlistItemUpdate, User } from '../types/api';

interface WishlistFormData {
  user_id: string;
  item: string;
  vendor: string;
  price: string; // Changed to string for currency validation
  priority: number; // 1-10
  status: string; // wished, scheduled, bought
  notes: string;
  planned_date: string;
}

// Currency validation function
const validateCurrency = (value: string): boolean => {
  const currencyRegex = /^\d*\.?\d{0,2}$/;
  return currencyRegex.test(value);
};

// Priority options for 1-10 scale
const priorityOptions = [
  { value: 1, label: '1 - Lowest', color: 'text-green-600' },
  { value: 2, label: '2', color: 'text-green-500' },
  { value: 3, label: '3', color: 'text-green-400' },
  { value: 4, label: '4', color: 'text-yellow-500' },
  { value: 5, label: '5 - Medium', color: 'text-yellow-600' },
  { value: 6, label: '6', color: 'text-yellow-500' },
  { value: 7, label: '7', color: 'text-orange-500' },
  { value: 8, label: '8', color: 'text-orange-600' },
  { value: 9, label: '9', color: 'text-red-500' },
  { value: 10, label: '10 - Highest', color: 'text-red-600' },
];

// Status options
const statusOptions = [
  { value: 'wished', label: 'Wished', color: 'text-blue-600' },
  { value: 'scheduled', label: 'Scheduled', color: 'text-yellow-600' },
  { value: 'bought', label: 'Bought', color: 'text-green-600' },
];

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [formData, setFormData] = useState<WishlistFormData>({
    user_id: '',
    item: '',
    vendor: '',
    price: '',
    priority: 5,
    status: 'wished',
    notes: '',
    planned_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wishlistResponse, usersResponse] = await Promise.all([
        wishlistApi.getAll(),
        userApi.getAll()
      ]);
      setWishlistItems(Array.isArray(wishlistResponse) ? wishlistResponse : []);
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate price format
    if (!validateCurrency(formData.price)) {
      setError('Price must be in valid currency format (e.g., 10.50)');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Price must be a positive number');
      return;
    }

    try {
      const wishlistData = {
        user_id: formData.user_id,
        item: formData.item,
        vendor: formData.vendor || undefined,
        price: price,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes || undefined,
        planned_date: formData.planned_date || undefined
      };

      if (editingItem) {
        await wishlistApi.update(editingItem.wish_id, wishlistData);
      } else {
        await wishlistApi.create(wishlistData);
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError('Failed to save wishlist item');
      console.error('Save wishlist error:', err);
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setFormData({
      user_id: item.user_id,
      item: item.item,
      vendor: item.vendor || '',
      price: item.price.toString(),
      priority: item.priority,
      status: item.status,
      notes: item.notes || '',
      planned_date: item.planned_date || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist item?')) return;
    
    try {
      await wishlistApi.delete(itemId);
      fetchData();
    } catch (err) {
      setError('Failed to delete wishlist item');
      console.error('Delete wishlist error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      item: '',
      vendor: '',
      price: '',
      priority: 5,
      status: 'wished',
      notes: '',
      planned_date: '',
    });
  };

  const handlePriceChange = (value: string) => {
    if (validateCurrency(value) || value === '') {
      setFormData({ ...formData, price: value });
    }
  };

  const filteredItems = wishlistItems.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.vendor && item.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.user?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredItems.reduce((sum, item) => sum + item.price, 0);

  const getPriorityColor = (priority: number) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'text-gray-600';
  };

  const getPriorityLabel = (priority: number) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority.toString();
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
          <p className="text-gray-600 mt-2">Manage your wishlist items</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search wishlist items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Total Value ({filteredItems.length} items)
          </div>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.wish_id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <HeartIcon className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.item}
                  </h3>
                  {item.vendor && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.vendor}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-primary-600 hover:text-primary-900 p-1"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.wish_id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Priority:</span>
                <span className={`text-sm font-medium ${getPriorityColor(item.priority)}`}>
                  {getPriorityLabel(item.priority)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm text-gray-900">
                  {item.user?.username || 'Unknown'}
                </span>
              </div>
              {item.planned_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Planned:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(item.planned_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {item.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                {item.notes}
              </div>
            )}
            <div className="mt-4 text-xs text-gray-500">
              Added: {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit Wishlist Item' : 'Add New Wishlist Item'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    className="input-field"
                    placeholder="e.g., iPhone 15, Gaming Laptop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor/Store
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Apple Store, Amazon, Best Buy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <select
                    required
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      required
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="input-field pl-8"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter amount in format: 10.50 (up to 2 decimal places)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_date}
                    onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Optional notes about this item"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 