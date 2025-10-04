import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { expenseApi, userApi, categoryApi } from '../services/api';
import type { Expense, ExpenseCreate, User, Category } from '../types/api';

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

// CSV Import interfaces
interface CSVRow {
  item: string;
  vendor: string;
  price: number;
  date_purchased: string;
  payment_method: string;
  notes: string;
  categories: string;
}

interface CSVImportData {
  csvContent: string;
  month: string;
  year: string;
  parsedData: CSVRow[];
  errors: string[];
}

// Currency validation function
const validateCurrency = (value: string): boolean => {
  const currencyRegex = /^\d*\.?\d{0,2}$/;
  return currencyRegex.test(value);
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
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
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

  // CSV Import state
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvImportData, setCsvImportData] = useState<CSVImportData>({
    csvContent: '',
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
    parsedData: [],
    errors: []
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Bulk selection state
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);


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
      // Clear selection when data is refreshed
      clearSelection();
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

  // Bulk selection functions
  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(filteredExpenses.map(expense => expense.expense_id)));
    }
  };

  const clearSelection = () => {
    setSelectedExpenses(new Set());
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    if (selectedExpenses.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Delete expenses one by one
      for (const expenseId of selectedExpenses) {
        try {
          await expenseApi.delete(expenseId);
          successCount++;
          
          // Add a small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errorCount++;
          const expense = expenses.find(e => e.expense_id === expenseId);
          const errorMessage = `${expense?.item || 'Unknown expense'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(`Failed to delete expense ${expenseId}:`, error);
        }
      }
      
      // Refresh data and clear selection
      await fetchData();
      clearSelection();
      
      // Show results
      if (errorCount > 0) {
        setError(`Bulk delete completed with errors: ${successCount} successful, ${errorCount} failed. Errors: ${errors.join('; ')}`);
      } else {
        setError(null);
      }
      
    } catch (error) {
      setError('Failed to delete expenses: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Bulk delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

    // CSV parsing function
    const parseCSV = (content: string, month: string, year: string): { data: CSVRow[], errors: string[] } => {
      const lines = content.trim().split('\n');
      const errors: string[] = [];
      const data: CSVRow[] = [];
  
      if (lines.length < 2) {
        errors.push('CSV must have at least a header row and one data row');
        return { data, errors };
      }
  
      const header = lines[0].split('\t').map(h => h.trim());
      
      // Define header mappings (case-insensitive)
      const headerMappings: { [key: string]: string } = {
        'item': 'item',
        'vendor': 'vendor', 
        'price': 'price',
        'date': 'date',
        'method': 'method',
        'payment_method': 'method',
        'payment method': 'method',
        'notes': 'notes',
        'note': 'notes',
        'categories': 'categories',
        'category': 'categories',
        'cat': 'categories'
      };
      
      // Map headers to their corresponding field names
      const headerMap: { [key: string]: number } = {};
      const foundFields: { [key: string]: boolean } = {};
      
      for (let i = 0; i < header.length; i++) {
        const headerName = header[i].toLowerCase();
        const mappedField = headerMappings[headerName];
        
        if (mappedField) {
          headerMap[mappedField] = i;
          foundFields[mappedField] = true;
        }
      }
      
      // Check if at least one recognized field is present
      const recognizedFields = Object.keys(foundFields);
      if (recognizedFields.length === 0) {
        errors.push(`No recognized columns found. Available columns: ${header.join(', ')}. Supported columns: Item, Vendor, Price, Date, Method, Notes`);
        return { data, errors };
      }
  
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split('\t');
        
        // Handle rows with missing columns by padding with empty strings
        while (row.length < header.length) {
          row.push('');
        }
        
        // Extract values using header mapping
        const item = headerMap['item'] !== undefined ? row[headerMap['item']] : '';
        const vendor = headerMap['vendor'] !== undefined ? row[headerMap['vendor']] : '';
        const priceStr = headerMap['price'] !== undefined ? row[headerMap['price']] : '';
        const dayStr = headerMap['date'] !== undefined ? row[headerMap['date']] : '';
        const method = headerMap['method'] !== undefined ? row[headerMap['method']] : '';
        const notes = headerMap['notes'] !== undefined ? row[headerMap['notes']] : '';
        const categories = headerMap['categories'] !== undefined ? row[headerMap['categories']] : '';
        
        // Validate fields only if they are present
        let hasErrors = false;
        
        // Validate item if present
        if (headerMap['item'] !== undefined && !item.trim()) {
          errors.push(`Row ${i + 1}: Item cannot be empty`);
          hasErrors = true;
        }
        
        // Validate vendor if present
        if (headerMap['vendor'] !== undefined && !vendor.trim()) {
          errors.push(`Row ${i + 1}: Vendor cannot be empty`);
          hasErrors = true;
        }
        
        // Validate price if present
        let price = 0;
        if (headerMap['price'] !== undefined) {
          if (!priceStr.trim()) {
            errors.push(`Row ${i + 1}: Price cannot be empty`);
            hasErrors = true;
          } else {
            price = parseFloat(priceStr);
            if (isNaN(price)) {
              errors.push(`Row ${i + 1}: Invalid price "${priceStr}"`);
              hasErrors = true;
            }
          }
        }
        
        // Validate date if present
        let dateStr = new Date().toISOString().split('T')[0]; // Default to today
        if (headerMap['date'] !== undefined) {
          if (!dayStr.trim()) {
            errors.push(`Row ${i + 1}: Date cannot be empty`);
            hasErrors = true;
          } else {
            const day = parseInt(dayStr);
            if (isNaN(day) || day < 1 || day > 31) {
              errors.push(`Row ${i + 1}: Invalid day "${dayStr}"`);
              hasErrors = true;
            } else {
              const monthNum = parseInt(month);
              const yearNum = parseInt(year);
              const date = new Date(yearNum, monthNum, day);
              dateStr = date.toISOString().split('T')[0];
            }
          }
        }
        
        if (hasErrors) continue;
  
        data.push({
          item: item.trim() || 'Unknown Item',
          vendor: vendor.trim() || 'Unknown Vendor',
          price: price || 0,
          date_purchased: dateStr,
          payment_method: method ? method.trim() : '',
          notes: notes ? notes.trim() : '',
          categories: categories ? categories.trim() : ''
        });
      }
  
      return { data, errors };
    };
  
    // Handle CSV content change
    const handleCSVContentChange = (content: string) => {
      const { data, errors } = parseCSV(content, csvImportData.month, csvImportData.year);
      setCsvImportData(prev => ({
        ...prev,
        csvContent: content,
        parsedData: data,
        errors
      }));
    };
  
    // Handle month/year change
    const handleDateChange = (month: string, year: string) => {
      const { data, errors } = parseCSV(csvImportData.csvContent, month, year);
      setCsvImportData(prev => ({
        ...prev,
        month,
        year,
        parsedData: data,
        errors
      }));
    };
  
    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleCSVContentChange(content);
      };
      reader.readAsText(file);
    };
  
    // Import expenses
    const handleImportExpenses = async () => {
      if (csvImportData.parsedData.length === 0) return;
  
      setIsImporting(true);
      setError(null);
      setImportProgress({ current: 0, total: csvImportData.parsedData.length });
      
      try {
        const selectedUser = users.find(u => u.user_id === formData.user_id);
        if (!selectedUser) {
          setError('Please select a user');
          return;
        }
  
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
  
        // Process expenses one by one with error handling for each
        for (let i = 0; i < csvImportData.parsedData.length; i++) {
          setImportProgress({ current: i + 1, total: csvImportData.parsedData.length });
          const row = csvImportData.parsedData[i];
          
          try {
            // Parse categories from CSV if present
            const newCategories: string[] = [];
            if (row.categories && row.categories.trim()) {
              // Split by comma and clean up each category name
              newCategories.push(...row.categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0));
            }

            const expenseData: ExpenseCreate = {
              user_id: selectedUser.user_id,
              item: row.item,
              vendor: row.vendor,
              price: row.price,
              date_purchased: row.date_purchased,
              payment_method: row.payment_method || undefined,
              notes: row.notes || undefined,
              new_categories: newCategories
            };
  
            await expenseApi.create(expenseData);
            successCount++;
            
            // Add a small delay between requests to prevent overwhelming the backend
            if (i < csvImportData.parsedData.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
          } catch (error) {
            errorCount++;
            let errorMessage = `Row ${i + 1} (${row.item}): `;
            
            if (error && typeof error === 'object' && 'response' in error) {
              // Axios error with response
              const axiosError = error as any;
              if (axiosError.response?.status === 500) {
                errorMessage += 'Server error (500) - expense may have been created but with issues';
              } else if (axiosError.response?.status) {
                errorMessage += `HTTP ${axiosError.response.status}: ${axiosError.response.data?.detail || 'Unknown error'}`;
              } else {
                errorMessage += 'Network error - check backend connection';
              }
            } else {
              errorMessage += error instanceof Error ? error.message : 'Unknown error';
            }
            
            errors.push(errorMessage);
            console.error(`Failed to import expense ${i + 1}:`, error);
            
            // Continue processing other expenses even if one fails
            continue;
          }
        }
  
        // Always refresh the expenses list to show any successfully created expenses
        // (even if there were 500 errors, some expenses might have been created)
        await fetchData();
        
        if (errorCount > 0) {
          setError(`Import completed with errors: ${successCount} successful, ${errorCount} failed. Errors: ${errors.join('; ')}`);
          // Don't close modal if there were errors, so user can see the error details
        } else {
          setError(null);
          // Close modal only if all imports were successful
          setShowCSVModal(false);
          setCsvImportData({
            csvContent: '',
            month: new Date().getMonth().toString(),
            year: new Date().getFullYear().toString(),
            parsedData: [],
            errors: []
          });
        }
        
      } catch (error) {
        setError('Failed to import expenses: ' + (error instanceof Error ? error.message : 'Unknown error'));
        console.error('Import error:', error);
        } finally {
        setIsImporting(false);
        setImportProgress({ current: 0, total: 0 });
      }
    };

  // Get unique vendors and payment methods for filter dropdowns
  const uniqueVendors = [...new Set(expenses.map(expense => expense.vendor).filter(Boolean))].sort();
  const uniquePaymentMethods = [...new Set(expenses.map(expense => expense.payment_method).filter(Boolean))].sort();

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('');
    setVendorFilter('');
    setPaymentMethodFilter('');
    setSearchTerm('');
    clearSelection(); // Clear selection when filters change
  };

  const filteredExpenses = expenses.filter(expense => {
    // Text search filter
    const searchMatch = 
      expense.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.categories?.some(cat => cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      false;

    // Category filter
    const categoryMatch = !categoryFilter || 
      expense.categories?.some(cat => cat.category_id === categoryFilter);

    // Vendor filter
    const vendorMatch = !vendorFilter || expense.vendor === vendorFilter;

    // Payment method filter
    const paymentMethodMatch = !paymentMethodFilter || expense.payment_method === paymentMethodFilter;

    return searchMatch && categoryMatch && vendorMatch && paymentMethodMatch;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.price, 0);

  if (loading) {
    return (
      <div data-testid="expenses-loading-state" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header START */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">Manage your expenses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCSVModal(true)}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Import CSV
          </button>
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
      </div>
      {/* Header END */}
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
            placeholder="Search items, vendors, users, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md border ${
              (categoryFilter || vendorFilter || paymentMethodFilter)
                ? 'text-primary-700 bg-primary-50 border-primary-300 hover:bg-primary-100'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(categoryFilter || vendorFilter || paymentMethodFilter) && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {[categoryFilter, vendorFilter, paymentMethodFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          {(categoryFilter || vendorFilter || paymentMethodFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Clear
            </button>
          )}
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

      {/* Filter Controls */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Vendors</option>
                {uniqueVendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Payment Methods</option>
                {uniquePaymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active Filter Indicators */}
          {(categoryFilter || vendorFilter || paymentMethodFilter) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {categoryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Category: {categories.find(c => c.category_id === categoryFilter)?.category_name}
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {vendorFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Vendor: {vendorFilter}
                    <button
                      onClick={() => setVendorFilter('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {paymentMethodFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Payment: {paymentMethodFilter}
                    <button
                      onClick={() => setPaymentMethodFilter('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedExpenses.size > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedExpenses.size} of {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                disabled={isDeleting}
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="btn-danger flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {'#'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    aria-label="Select all expenses"
                  />
                </th>
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
              {filteredExpenses.map((expense, i) => (
                <tr 
                  key={expense.expense_id} 
                  className={`hover:bg-gray-50 ${selectedExpenses.has(expense.expense_id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.has(expense.expense_id)}
                      onChange={() => toggleExpenseSelection(expense.expense_id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label={`Select ${expense.item}`}
                    />
                  </td>
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

      {/* CSV Import Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import Expenses from CSV
              </h3>
              
              {/* CSV Format Instructions */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Your CSV file should have at least one of these columns (tab-separated, any order):
                </p>
                <div className="text-sm text-blue-800 font-mono bg-blue-100 p-2 rounded mb-2">
                  <strong>Supported columns:</strong> Item, Vendor, Price, Date, Method (or Payment Method), Notes (or Note), Categories (or Category)
                </div>
                <div className="text-sm text-blue-800 font-mono bg-blue-100 p-2 rounded">
                  Examples:<br/>
                  • Full: Item	Vendor	Price	Date	Method	Notes	Categories<br/>
                  • Minimal: Item<br/>
                  • Custom: Price	Vendor	Item	Categories
                </div>
                <p className="text-sm text-blue-800 mt-2">
                  • <strong>Only 1 column required</strong> - any recognized column will work<br/>
                  • <strong>Date</strong> should be the day of the month (1-31) if present<br/>
                  • <strong>Month and Year</strong> will be set below<br/>
                  • <strong>Categories</strong> can be comma-separated (e.g., "Food, Groceries")<br/>
                  • <strong>Missing fields</strong> will use defaults (Unknown Item/Vendor, $0.00, today's date)
                </p>
              </div>

              {/* Month and Year Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={csvImportData.month}
                    onChange={(e) => handleDateChange(e.target.value, csvImportData.year)}
                    className="input-field"
                  >
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={csvImportData.year}
                    onChange={(e) => handleDateChange(csvImportData.month, e.target.value)}
                    className="input-field"
                    min="2000"
                    max="2100"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="input-field"
                />
              </div>

              {/* CSV Content Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or paste CSV content:
                </label>
                <textarea
                  value={csvImportData.csvContent}
                  onChange={(e) => handleCSVContentChange(e.target.value)}
                  className="input-field"
                  rows={8}
                  placeholder="Paste your CSV content here..."
                />
              </div>

              {/* User Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign expenses to user:
                </label>
                <select
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

              {/* Errors Display */}
              {csvImportData.errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Errors found:</h4>
                  <ul className="text-sm text-red-800 list-disc list-inside">
                    {csvImportData.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {csvImportData.parsedData.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    Preview ({csvImportData.parsedData.length} expenses ready to import):
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-green-800">
                          <th className="text-left p-1">Item</th>
                          <th className="text-left p-1">Vendor</th>
                          <th className="text-left p-1">Price</th>
                          <th className="text-left p-1">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvImportData.parsedData.slice(0, 5).map((row, index) => (
                          <tr key={index} className="text-green-700">
                            <td className="p-1">{row.item}</td>
                            <td className="p-1">{row.vendor}</td>
                            <td className="p-1">${row.price.toFixed(2)}</td>
                            <td className="p-1">{row.date_purchased}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvImportData.parsedData.length > 5 && (
                      <p className="text-sm text-green-600 mt-2">
                        ... and {csvImportData.parsedData.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {isImporting && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Importing expenses...
                    </span>
                    <span className="text-sm text-blue-700">
                      {importProgress.current} of {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCSVModal(false);
                    setCsvImportData({
                      csvContent: '',
                      month: new Date().getMonth().toString(),
                      year: new Date().getFullYear().toString(),
                      parsedData: [],
                      errors: []
                    });
                  }}
                  className="btn-secondary"
                  disabled={isImporting}
                >
                  {isImporting ? 'Close' : 'Cancel'}
                </button>
                {!isImporting && (
                  <button
                    type="button"
                    onClick={handleImportExpenses}
                    disabled={csvImportData.parsedData.length === 0 || !formData.user_id}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import {csvImportData.parsedData.length} Expenses
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 