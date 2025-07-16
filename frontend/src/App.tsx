import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  UserGroupIcon, 
  TagIcon, 
  CurrencyDollarIcon, 
  HeartIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Categories from './components/Categories';
import Expenses from './components/Expenses';
import Wishlist from './components/Wishlist';
import Budgets from './components/Budgets';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Expense Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    Expense Tracker
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm min-h-screen">
            <nav className="mt-8">
              <div className="px-4 space-y-2">
                <Link
                  to="/"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HomeIcon className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
                <Link
                  to="/users"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserGroupIcon className="h-5 w-5 mr-3" />
                  Users
                </Link>
                <Link
                  to="/categories"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <TagIcon className="h-5 w-5 mr-3" />
                  Categories
                </Link>
                <Link
                  to="/expenses"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                  Expenses
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HeartIcon className="h-5 w-5 mr-3" />
                  Wishlist
                </Link>
                <Link
                  to="/budgets"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChartBarIcon className="h-5 w-5 mr-3" />
                  Budgets
                </Link>
              </div>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/budgets" element={<Budgets />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
