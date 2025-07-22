import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { budgetApi, userApi, categoryApi } from '../services/api';
import type { Budget, BudgetCreate, BudgetUpdate, User, Category } from '../types/api';

interface BudgetFormData {
  user_id: string;
  category_id: string;
  current_spend: string; // Changed to string for currency validation
  future_spend: string; // Changed to string for currency validation
  max_spend: string; // Changed to string for currency validation
  is_over_max: boolean;
  start_date: string;
  end_date: string;
}

// Currency validation function
const validateCurrency = (value: string): boolean => {
  const currencyRegex = /^\d*\.?\d{0,2}$/;
  return currencyRegex.test(value);
};

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    user_id: '',
    category_id: '',
    current_spend: '',
    future_spend: '',
    max_spend: '',
    is_over_max: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [budgetsResponse, usersResponse, categoriesResponse] = await Promise.all([
        budgetApi.getAll(),
        userApi.getAll(),
        categoryApi.getAll()
      ]);

      setBudgets(Array.isArray(budgetsResponse) ? budgetsResponse : []);
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Budgets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all currency fields
    const fieldsToValidate = [
      { name: 'Current Spend', value: formData.current_spend },
      { name: 'Future Spend', value: formData.future_spend },
      { name: 'Max Spend', value: formData.max_spend }
    ];

    for (const field of fieldsToValidate) {
      if (!validateCurrency(field.value)) {
        setError(`${field.name} must be in valid currency format (e.g., 10.50)`);
        return;
      }
    }

    const currentSpend = parseFloat(formData.current_spend);
    const futureSpend = parseFloat(formData.future_spend);
    const maxSpend = parseFloat(formData.max_spend);

    if (isNaN(currentSpend) || currentSpend < 0) {
      setError('Current spend must be a non-negative number');
      return;
    }

    if (isNaN(futureSpend) || futureSpend < 0) {
      setError('Future spend must be a non-negative number');
      return;
    }

    if (isNaN(maxSpend) || maxSpend <= 0) {
      setError('Max spend must be a positive number');
      return;
    }

    // Calculate if over max
    const isOverMax = (currentSpend + futureSpend) > maxSpend;

    try {
      const budgetData = {
        user_id: formData.user_id,
        category_id: formData.category_id,
        current_spend: currentSpend,
        future_spend: futureSpend,
        max_spend: maxSpend,
        is_over_max: isOverMax,
        start_date: formData.start_date,
        end_date: formData.end_date
      };

      if (editingBudget) {
        await budgetApi.update(editingBudget.budget_id, budgetData);
      } else {
        await budgetApi.create(budgetData);
      }
      setShowModal(false);
      setEditingBudget(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError('Failed to save budget');
      console.error('Save budget error:', err);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      user_id: budget.user_id,
      category_id: budget.category_id,
      current_spend: budget.current_spend.toString(),
      future_spend: budget.future_spend.toString(),
      max_spend: budget.max_spend.toString(),
      is_over_max: budget.is_over_max,
      start_date: budget.start_date.split('T')[0],
      end_date: budget.end_date.split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await budgetApi.delete(budgetId);
      fetchData();
    } catch (err) {
      setError('Failed to delete budget');
      console.error('Delete budget error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      category_id: '',
      current_spend: '',
      future_spend: '',
      max_spend: '',
      is_over_max: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const handleCurrencyChange = (field: keyof Pick<BudgetFormData, 'current_spend' | 'future_spend' | 'max_spend'>, value: string) => {
    if (validateCurrency(value) || value === '') {
      setFormData({ ...formData, [field]: value });
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    if (!searchTerm) return true;
    
    const user = users.find(u => u.user_id === budget.user_id);
    const category = categories.find(c => c.category_id === budget.category_id);
    
    return (
      user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category?.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalMaxBudget = filteredBudgets.reduce((sum, budget) => sum + budget.max_spend, 0);
  const totalCurrentSpend = filteredBudgets.reduce((sum, budget) => sum + budget.current_spend, 0);
  const totalFutureSpend = filteredBudgets.reduce((sum, budget) => sum + budget.future_spend, 0);

  const isActive = (budget: Budget) => {
    const now = new Date();
    const start = new Date(budget.start_date);
    const end = new Date(budget.end_date);
    return now >= start && now <= end;
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
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600 mt-2">Manage your budgets</p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Budget
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
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${totalMaxBudget.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Total Budget ({filteredBudgets.length} budgets)
          </div>
          <div className="text-sm text-gray-500">
            Current: ${totalCurrentSpend.toFixed(2)} | Future: ${totalFutureSpend.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBudgets.map((budget) => (
          <div key={budget.budget_id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ${budget.max_spend.toFixed(2)}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isActive(budget) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isActive(budget) ? 'Active' : 'Inactive'}
                    </span>
                    {budget.is_over_max && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Over Budget
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {categories.find(c => c.category_id === budget.category_id)?.category_name || 'Uncategorized'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(budget)}
                  className="text-primary-600 hover:text-primary-900 p-1"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(budget.budget_id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User:</span>
                <span className="text-sm text-gray-900">
                  {users.find(u => u.user_id === budget.user_id)?.username || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Spend:</span>
                <span className="text-sm text-gray-900">
                  ${budget.current_spend.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Future Spend:</span>
                <span className="text-sm text-gray-900">
                  ${budget.future_spend.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Spent:</span>
                <span className={`text-sm font-medium ${budget.is_over_max ? 'text-red-600' : 'text-gray-900'}`}>
                  ${(budget.current_spend + budget.future_spend).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm text-gray-900">
                  {new Date(budget.start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">End Date:</span>
                <span className="text-sm text-gray-900">
                  {new Date(budget.end_date).toLocaleDateString()}
                </span>
              </div>
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
                {editingBudget ? 'Edit Budget' : 'Add New Budget'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Category
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      required
                      value={formData.current_spend}
                      onChange={(e) => handleCurrencyChange('current_spend', e.target.value)}
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
                    Future Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      required
                      value={formData.future_spend}
                      onChange={(e) => handleCurrencyChange('future_spend', e.target.value)}
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
                    Max Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      required
                      value={formData.max_spend}
                      onChange={(e) => handleCurrencyChange('max_spend', e.target.value)}
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
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBudget(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingBudget ? 'Update' : 'Create'}
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