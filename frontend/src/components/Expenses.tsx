import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { expenseApi, userApi, categoryApi } from '../services/api';
import type { Expense, ExpenseCreate, ExpenseUpdate, User, Category } from '../types/api';

interface ExpenseFormData {
  user_id: string;
  item: string;
  vendor: string;
  price: string; // Changed to string for currency validation
  date_purchased: string;
  payment_method?: string;
  notes?: string;
  selected_categories: string[]; // Array of category IDs
  new_categories: string[]; // Array of new category names to create
}

// Currency validation function
const validateCurrency = (value: string): boolean => {
  const currencyRegex = /^\d*\.?\d{0,2}$/;
  return currencyRegex.test(value);
};

// Format currency for display
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    user_id: '',
    item: '',
    vendor: '',
    price: '',
    date_purchased: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
    selected_categories: [],
    new_categories: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesResponse, usersResponse, categoriesResponse] = await Promise.all([
        expenseApi.getAll(),
        userApi.getAll(),
        categoryApi.getAll()
      ]);
      setExpenses(Array.isArray(expensesResponse) ? expensesResponse : []);
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Expenses error:', err);
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
      const expenseData = {
        user_id: formData.user_id,
        item: formData.item,
        vendor: formData.vendor,
        price: price,
        date_purchased: formData.date_purchased,
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
        new_categories: formData.new_categories.filter(cat => cat.trim() !== '')
      };

      if (editingExpense) {
        await expenseApi.update(editingExpense.expense_id, expenseData);
      } else {
        const newExpense = await expenseApi.create(expenseData);
        
        // Add categories to the new expense
        for (const categoryId of formData.selected_categories) {
          try {
            await expenseApi.addCategory(newExpense.expense_id, categoryId);
          } catch (err) {
            console.error('Failed to add category to expense:', err);
          }
        }
      }
      
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError('Failed to save expense');
      console.error('Save expense error:', err);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      user_id: expense.user_id,
      item: expense.item,
      vendor: expense.vendor,
      price: expense.price.toString(),
      date_purchased: expense.date_purchased.split('T')[0],
      payment_method: expense.payment_method || '',
      notes: expense.notes || '',
      selected_categories: expense.categories?.map(cat => cat.category_id) || [],
      new_categories: []
    });
    setShowModal(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await expenseApi.delete(expenseId);
      fetchData();
    } catch (err) {
      setError('Failed to delete expense');
      console.error('Delete expense error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      item: '',
      vendor: '',
      price: '',
      date_purchased: new Date().toISOString().split('T')[0],
      payment_method: '',
      notes: '',
      selected_categories: [],
      new_categories: []
    });
  };

  const handlePriceChange = (value: string) => {
    if (validateCurrency(value) || value === '') {
      setFormData({ ...formData, price: value });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_categories: prev.selected_categories.includes(categoryId)
        ? prev.selected_categories.filter(id => id !== categoryId)
        : [...prev.selected_categories, categoryId]
    }));
  };

  const addNewCategory = () => {
    setFormData(prev => ({
      ...prev,
      new_categories: [...prev.new_categories, '']
    }));
  };

  const updateNewCategory = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      new_categories: prev.new_categories.map((cat, i) => 
        i === index ? value : cat
      )
    }));
  };

  const removeNewCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      new_categories: prev.new_categories.filter((_, i) => i !== index)
    }));
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.categories?.some(cat => cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    false
  );

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.price, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">Manage your expenses</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
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
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${totalAmount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Total Expenses ({filteredExpenses.length})
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item/Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.expense_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.item}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.vendor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {expense.user?.username || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {expense.categories?.map(cat => cat.category_name).join(', ') || 'No categories'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {expense.payment_method || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${expense.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date_purchased).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.expense_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Groceries, Gas, Dinner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Walmart, Shell, Restaurant Name"
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
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Credit Card, Cash, Bank Transfer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories
                  </label>
                  
                  {/* Existing Categories */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Existing Categories
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">No categories available</p>
                      ) : (
                        <div className="space-y-2">
                          {categories.map((category) => (
                            <label key={category.category_id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.selected_categories.includes(category.category_id)}
                                onChange={() => toggleCategory(category.category_id)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {category.category_name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Categories */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">
                        New Categories
                      </label>
                      <button
                        type="button"
                        onClick={addNewCategory}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Add New
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.new_categories.map((category, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => updateNewCategory(index, e.target.value)}
                            className="flex-1 input-field text-sm"
                            placeholder="Enter new category name"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewCategory(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Select existing categories or create new ones for this expense
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_purchased}
                    onChange={(e) => setFormData({ ...formData, date_purchased: e.target.value })}
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
                    placeholder="Optional notes about this expense"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingExpense(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingExpense ? 'Update' : 'Create'}
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