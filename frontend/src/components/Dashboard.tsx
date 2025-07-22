import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  TagIcon, 
  CurrencyDollarIcon, 
  HeartIcon, 
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { userApi, categoryApi, expenseApi, wishlistApi, budgetApi } from '../services/api';
import type { User, Category, Expense, WishlistItem, Budget } from '../types/api';

interface DashboardStats {
  totalUsers: number;
  totalCategories: number;
  totalExpenses: number;
  totalWishlistItems: number;
  totalBudgets: number;
  totalExpenseAmount: number;
  totalWishlistAmount: number;
  totalBudgetAmount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCategories: 0,
    totalExpenses: 0,
    totalWishlistItems: 0,
    totalBudgets: 0,
    totalExpenseAmount: 0,
    totalWishlistAmount: 0,
    totalBudgetAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBudgets, setActiveBudgets] = useState(0);
  const [totalBudgets, setTotalBudgets] = useState(0);
  const [overBudgetCount, setOverBudgetCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          usersResponse,
          categoriesResponse,
          expensesResponse,
          wishlistResponse,
          budgetsResponse
        ] = await Promise.all([
          userApi.getAll(),
          categoryApi.getAll(),
          expenseApi.getAll(),
          wishlistApi.getAll(),
          budgetApi.getAll()
        ]);

        // Handle the response data - the API returns arrays directly
        const users = Array.isArray(usersResponse) ? usersResponse : [];
        const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];
        const expenses = Array.isArray(expensesResponse) ? expensesResponse : [];
        const wishlistItems = Array.isArray(wishlistResponse) ? wishlistResponse : [];
        const budgets = Array.isArray(budgetsResponse) ? budgetsResponse : [];

        const totalExpenseAmount = expenses.reduce((sum: number, expense: Expense) => sum + expense.price, 0);
        const totalWishlistAmount = wishlistItems.reduce((sum: number, item: WishlistItem) => sum + item.price, 0);
        const totalBudgetAmount = budgets.reduce((sum: number, budget: Budget) => sum + budget.max_spend, 0);
        
        // Calculate additional metrics
        const activeBudgetsCount = budgets.filter(budget => {
          const now = new Date();
          const start = new Date(budget.start_date);
          const end = new Date(budget.end_date);
          return now >= start && now <= end;
        }).length;
        
        const overBudgetCount = budgets.filter(budget => budget.is_over_max).length;

        setStats({
          totalUsers: users.length,
          totalCategories: categories.length,
          totalExpenses: expenses.length,
          totalWishlistItems: wishlistItems.length,
          totalBudgets: activeBudgetsCount, // Show active budgets instead of total
          totalExpenseAmount,
          totalWishlistAmount,
          totalBudgetAmount,
        });
        
        setActiveBudgets(activeBudgetsCount);
        setTotalBudgets(budgets.length);
        setOverBudgetCount(overBudgetCount);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      subtitle: 'Registered users',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: TagIcon,
      color: 'bg-green-500',
      subtitle: 'Expense categories',
    },
    {
      title: 'Total Expenses',
      value: stats.totalExpenses,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      subtitle: 'Tracked expenses',
    },
    {
      title: 'Wishlist Items',
      value: stats.totalWishlistItems,
      icon: HeartIcon,
      color: 'bg-pink-500',
      subtitle: 'Planned purchases',
    },
    {
      title: 'Active Budgets',
      value: stats.totalBudgets,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      subtitle: `${activeBudgets} active / ${totalBudgets} total`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your expense tracking system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
                          <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
          </div>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-semibold text-red-600">
                ${stats.totalExpenseAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wishlist Value:</span>
              <span className="font-semibold text-blue-600">
                ${stats.totalWishlistAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget Allocation:</span>
              <span className="font-semibold text-green-600">
                ${stats.totalBudgetAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Budgets:</span>
              <span className="font-semibold text-blue-600">
                {activeBudgets} / {totalBudgets}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Over Budget:</span>
              <span className={`font-semibold ${overBudgetCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overBudgetCount} budgets
              </span>
            </div>
            <hr />
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Remaining Budget:</span>
              <span className={`font-semibold ${
                stats.totalBudgetAmount - stats.totalExpenseAmount >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                ${(stats.totalBudgetAmount - stats.totalExpenseAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/expenses'}
              className="w-full btn-primary"
            >
              Add New Expense
            </button>
            <button 
              onClick={() => window.location.href = '/budgets'}
              className="w-full btn-secondary"
            >
              Create Budget
            </button>
            <button 
              onClick={() => window.location.href = '/wishlist'}
              className="w-full btn-secondary"
            >
              Add Wishlist Item
            </button>
            <button 
              onClick={() => window.location.href = '/categories'}
              className="w-full btn-secondary"
            >
              Manage Categories
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Backend API:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync:</span>
              <span className="text-sm text-gray-900">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 