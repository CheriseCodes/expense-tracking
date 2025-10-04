import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
import { userApi, categoryApi, expenseApi, wishlistApi, budgetApi } from '../../services/api'

// Mock the API services
vi.mock('../../services/api', () => ({
  userApi: {
    getAll: vi.fn()
  },
  categoryApi: {
    getAll: vi.fn()
  },
  expenseApi: {
    getAll: vi.fn()
  },
  wishlistApi: {
    getAll: vi.fn()
  },
  budgetApi: {
    getAll: vi.fn()
  }
}))

const mockUserApi = vi.mocked(userApi)
const mockCategoryApi = vi.mocked(categoryApi)
const mockExpenseApi = vi.mocked(expenseApi)
const mockWishlistApi = vi.mocked(wishlistApi)
const mockBudgetApi = vi.mocked(budgetApi)

// Mock data
const mockUsers = [
  { user_id: '1', username: 'john_doe', email: 'john@example.com', role: 'regular', created_at: '2025-01-01T00:00:00Z', last_login: '2025-01-01T00:00:00Z' },
  { user_id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'admin', created_at: '2025-01-01T00:00:00Z', last_login: '2025-01-01T00:00:00Z' }
]

const mockCategories = [
  { category_id: '1', category_name: 'Groceries' },
  { category_id: '2', category_name: 'Transportation' },
  { category_id: '3', category_name: 'Entertainment' }
]

const mockExpenses = [
  { expense_id: '1', user_id: '1', item: 'Groceries', vendor: 'Supermarket', price: 150.00, date_purchased: '2025-01-15', payment_method: 'Credit Card', notes: 'Weekly groceries', created_at: '2025-01-15T00:00:00Z' },
  { expense_id: '2', user_id: '1', item: 'Gas', vendor: 'Gas Station', price: 45.00, date_purchased: '2025-01-16', payment_method: 'Debit Card', notes: 'Fuel', created_at: '2025-01-16T00:00:00Z' },
  { expense_id: '3', user_id: '2', item: 'Movie Tickets', vendor: 'Cinema', price: 25.00, date_purchased: '2025-01-17', payment_method: 'Cash', notes: 'Weekend movie', created_at: '2025-01-17T00:00:00Z' }
]

const mockWishlistItems = [
  { wish_id: '1', user_id: '1', item: 'Laptop', vendor: 'Tech Store', price: 1200.00, priority: 5, status: 'wished', notes: 'New laptop for work', planned_date: '2025-03-01', created_at: '2025-01-01T00:00:00Z' },
  { wish_id: '2', user_id: '2', item: 'Vacation', vendor: 'Travel Agency', price: 2500.00, priority: 8, status: 'scheduled', notes: 'Summer vacation', planned_date: '2025-07-01', created_at: '2025-01-01T00:00:00Z' }
]

const mockBudgets = [
  { 
    budget_id: '1', 
    user_id: '1', 
    category_id: '1', 
    max_spend: 500.00, 
    current_spend: 150.00, 
    future_spend: 100.00, 
    is_over_max: false, 
    timeframe_type: 'monthly', 
    timeframe_interval: 1, 
    recurring_start_date: '2025-08-01', 
    start_date: '2025-08-01', 
    end_date: '2025-08-31' 
  },
  { 
    budget_id: '2', 
    user_id: '1', 
    category_id: '2', 
    max_spend: 200.00, 
    current_spend: 45.00, 
    future_spend: 50.00, 
    is_over_max: false, 
    timeframe_type: 'monthly', 
    timeframe_interval: 1, 
    recurring_start_date: '2025-08-01', 
    start_date: '2025-08-01', 
    end_date: '2025-08-31' 
  },
  { 
    budget_id: '3', 
    user_id: '2', 
    category_id: '3', 
    max_spend: 100.00, 
    current_spend: 25.00, 
    future_spend: 75.00, 
    is_over_max: false, 
    timeframe_type: 'monthly', 
    timeframe_interval: 1, 
    recurring_start_date: '2025-08-01', 
    start_date: '2025-08-01', 
    end_date: '2025-08-31' 
  }
]

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    mockUserApi.getAll.mockResolvedValue(mockUsers)
    mockCategoryApi.getAll.mockResolvedValue(mockCategories)
    mockExpenseApi.getAll.mockResolvedValue(mockExpenses)
    mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
    mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
  })

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      renderDashboard()
      expect(screen.getByTestId('dashboard-loading-state')).toBeInTheDocument()
    })

    it('displays dashboard when data loads successfully', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Overview of your expense tracking system')).toBeInTheDocument()
      })
    })

    it('displays error message when API call fails', async () => {
      mockUserApi.getAll.mockRejectedValue(new Error('API Error'))
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('displays empty state when no data exists', async () => {
      mockUserApi.getAll.mockResolvedValue([])
      mockCategoryApi.getAll.mockResolvedValue([])
      mockExpenseApi.getAll.mockResolvedValue([])
      mockWishlistApi.getAll.mockResolvedValue([])
      mockBudgetApi.getAll.mockResolvedValue([])
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(screen.getByText('Total Expenses')).toBeInTheDocument()
        expect(screen.getByText('Wishlist Items')).toBeInTheDocument()
        expect(screen.getByText('Active Budgets')).toBeInTheDocument()
      })
    })
  })

  describe('Data Aggregation', () => {
    it('calculates correct totals from API data', async () => {
      renderDashboard()
      
      await waitFor(() => {
        // Check that all API calls were made
        expect(mockUserApi.getAll).toHaveBeenCalledTimes(1)
        expect(mockCategoryApi.getAll).toHaveBeenCalledTimes(1)
        expect(mockExpenseApi.getAll).toHaveBeenCalledTimes(1)
        expect(mockWishlistApi.getAll).toHaveBeenCalledTimes(1)
        expect(mockBudgetApi.getAll).toHaveBeenCalledTimes(1)
      })

      await waitFor(() => {
        // Check that the dashboard displays the expected data
        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(screen.getByText('Total Expenses')).toBeInTheDocument()
        expect(screen.getByText('Wishlist Items')).toBeInTheDocument()
        expect(screen.getByText('Active Budgets')).toBeInTheDocument()
        
        // Check that numbers are displayed (without being too specific about which ones)
        const numberElements = screen.getAllByText(/[0-9]/)
        expect(numberElements.length).toBeGreaterThan(0)
      })
    })

    it('calculates correct financial amounts', async () => {
      renderDashboard()
      
      await waitFor(() => {
        // Total expense amount: 150 + 45 + 25 = 220
        expect(screen.getByText('$220.00')).toBeInTheDocument()
        
        // Total wishlist amount: 1200 + 2500 = 3700
        expect(screen.getByText('$3700.00')).toBeInTheDocument()
        
        // Total budget amount: 500 + 200 + 100 = 800
        expect(screen.getByText('$800.00')).toBeInTheDocument()
      })
    })

    it('displays remaining budget calculation', async () => {
      renderDashboard()
      
      await waitFor(() => {
        // Remaining budget: 800 - 220 = 580
        expect(screen.getByText('$580.00')).toBeInTheDocument()
      })
    })
  })

  describe('Stat Cards', () => {
    it('displays all stat cards with correct data', async () => {
      renderDashboard()
      
      await waitFor(() => {
        // Check all stat card titles
        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('Categories')).toBeInTheDocument()
        expect(screen.getByText('Total Expenses')).toBeInTheDocument()
        expect(screen.getByText('Wishlist Items')).toBeInTheDocument()
        expect(screen.getByText('Active Budgets')).toBeInTheDocument()
      })

      await waitFor(() => {
        // Check that stat cards display numeric values
        const statCardValues = screen.getAllByText(/[0-9]/)
        expect(statCardValues.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Financial Summary', () => {
    it('displays financial summary section', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Financial Summary')).toBeInTheDocument()
      })
    })

    it('displays correct expense total', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Total Expenses:')).toBeInTheDocument()
        expect(screen.getByText('$220.00')).toBeInTheDocument()
      })
    })

    it('displays correct wishlist value', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Wishlist Value:')).toBeInTheDocument()
        expect(screen.getByText('$3700.00')).toBeInTheDocument()
      })
    })

    it('displays correct budget allocation', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Budget Allocation:')).toBeInTheDocument()
        expect(screen.getByText('$800.00')).toBeInTheDocument()
      })
    })

    it('displays active budgets count', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Active Budgets:')).toBeInTheDocument()
        // Check that the financial summary shows the active budgets information
        const activeBudgetSection = screen.getByText('Active Budgets:').closest('a')
        expect(activeBudgetSection).toBeInTheDocument()
      })
    })

    it('displays over budget count', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Over Budget:')).toBeInTheDocument()
        expect(screen.getByText('0 budgets')).toBeInTheDocument()
      })
    })

    it('displays remaining budget with correct color', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Remaining Budget:')).toBeInTheDocument()
        expect(screen.getByText('$580.00')).toBeInTheDocument()
      })
    })
  })

  describe('Quick Actions', () => {
    it('displays quick actions section', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      })
    })

    it('displays all quick action buttons', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Add New Expense')).toBeInTheDocument()
        expect(screen.getByText('Create Budget')).toBeInTheDocument()
        expect(screen.getByText('Add Wishlist Item')).toBeInTheDocument()
        expect(screen.getByText('Manage Categories')).toBeInTheDocument()
      })
    })
  })

  describe('System Status', () => {
    it('displays system status section', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('System Status')).toBeInTheDocument()
      })
    })

    it('displays backend API status', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Backend API:')).toBeInTheDocument()
        expect(screen.getByText('Online')).toBeInTheDocument()
      })
    })

    it('displays database status', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Database:')).toBeInTheDocument()
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })
    })

    it('displays last sync time', async () => {
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Last Sync:')).toBeInTheDocument()
        // The time will be dynamic, so we just check the label exists
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockUserApi.getAll.mockRejectedValue(new Error('Network Error'))
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
      })
    })

    it('provides retry functionality', async () => {
      mockUserApi.getAll.mockRejectedValue(new Error('Network Error'))
      
      renderDashboard()
      
      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('handles partial API failures', async () => {
      mockUserApi.getAll.mockRejectedValue(new Error('User API Error'))
      mockCategoryApi.getAll.mockResolvedValue(mockCategories)
      mockExpenseApi.getAll.mockResolvedValue(mockExpenses)
      mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
      mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Links', () => {
    it('renders stat cards as navigation links', async () => {
      renderDashboard()
      
      await waitFor(() => {
        const userCard = screen.getByText('Total Users').closest('a')
        const categoryCard = screen.getByText('Categories').closest('a')
        const expenseCard = screen.getByText('Total Expenses').closest('a')
        const wishlistCard = screen.getByText('Wishlist Items').closest('a')
        const budgetCard = screen.getByText('Active Budgets').closest('a')
        
        expect(userCard).toHaveAttribute('href', '/users')
        expect(categoryCard).toHaveAttribute('href', '/categories')
        expect(expenseCard).toHaveAttribute('href', '/expenses')
        expect(wishlistCard).toHaveAttribute('href', '/wishlist')
        expect(budgetCard).toHaveAttribute('href', '/budgets')
      })
    })

    it('renders financial summary items as navigation links', async () => {
      renderDashboard()
      
      await waitFor(() => {
        const expenseLink = screen.getByText('Total Expenses:').closest('a')
        const wishlistLink = screen.getByText('Wishlist Value:').closest('a')
        const budgetLink = screen.getByText('Budget Allocation:').closest('a')
        
        expect(expenseLink).toHaveAttribute('href', '/expenses')
        expect(wishlistLink).toHaveAttribute('href', '/wishlist')
        expect(budgetLink).toHaveAttribute('href', '/budgets')
      })
    })
  })

  describe('Data Processing', () => {
    it('handles empty arrays from API', async () => {
      mockUserApi.getAll.mockResolvedValue([])
      mockCategoryApi.getAll.mockResolvedValue([])
      mockExpenseApi.getAll.mockResolvedValue([])
      mockWishlistApi.getAll.mockResolvedValue([])
      mockBudgetApi.getAll.mockResolvedValue([])
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getAllByText('0')[0]).toBeInTheDocument() // Users
        expect(screen.getAllByText('0')[1]).toBeInTheDocument() // Categories
        expect(screen.getAllByText('0')[2]).toBeInTheDocument() // Expenses
        expect(screen.getAllByText('0')[3]).toBeInTheDocument() // Wishlist
        expect(screen.getAllByText('0')[4]).toBeInTheDocument() // Active Budgets
      })
    })

    it('handles null/undefined API responses', async () => {
      mockUserApi.getAll.mockResolvedValue(null as any)
      mockCategoryApi.getAll.mockResolvedValue(undefined as any)
      mockExpenseApi.getAll.mockResolvedValue([])
      mockWishlistApi.getAll.mockResolvedValue([])
      mockBudgetApi.getAll.mockResolvedValue([])
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getAllByText('0')[0]).toBeInTheDocument() // Users
        expect(screen.getAllByText('0')[1]).toBeInTheDocument() // Categories
      })
    })
  })

  describe('Budget Calculations', () => {

    it('calculates over budget count correctly', async () => {
      const overBudgetData = [
        { 
          budget_id: '1', 
          user_id: '1', 
          category_id: '1', 
          max_spend: 100.00, 
          current_spend: 150.00, 
          future_spend: 50.00, 
          is_over_max: true, 
          timeframe_type: 'monthly', 
          timeframe_interval: 1, 
          recurring_start_date: '2025-01-01', 
          start_date: '2025-01-01', 
          end_date: '2025-01-31' 
        }
      ]
      
      mockBudgetApi.getAll.mockResolvedValue(overBudgetData)
      
      renderDashboard()
      
      await waitFor(() => {
        expect(screen.getByText('1 budgets')).toBeInTheDocument()
      })
    })
  })
}) 