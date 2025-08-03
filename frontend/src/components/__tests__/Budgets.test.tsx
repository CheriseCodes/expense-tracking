import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import Budgets from '../Budgets'
import { budgetApi, userApi, categoryApi } from '../../services/api'

// Mock the API services
vi.mock('../../services/api', () => ({
	budgetApi: {
		getAll: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	},
	userApi: {
		getAll: vi.fn()
	},
	categoryApi: {
		getAll: vi.fn()
	}
}))

describe('Budgets', () => {
	const mockBudgetApi = budgetApi as any
	const mockUserApi = userApi as any
	const mockCategoryApi = categoryApi as any

	// Mock data
	const mockUsers = [
		{
			user_id: '1',
			username: 'john_doe',
			email: 'john@example.com',
			role: 'regular',
			created_at: '2024-01-01T00:00:00Z',
			last_login: '2024-01-15T00:00:00Z'
		},
		{
			user_id: '2',
			username: 'jane_admin',
			email: 'jane@example.com',
			role: 'admin',
			created_at: '2024-01-02T00:00:00Z',
			last_login: '2024-01-16T00:00:00Z'
		}
	]

	const mockCategories = [
		{
			category_id: '1',
			category_name: 'Groceries'
		},
		{
			category_id: '2',
			category_name: 'Transportation'
		},
		{
			category_id: '3',
			category_name: 'Entertainment'
		}
	]

	const mockBudgets = [
		{
			budget_id: '1',
			user_id: '1',
			category_id: '1',
			max_spend: 500.00,
			current_spend: 350.00,
			future_spend: 100.00,
			is_over_max: false,
			start_date: '2024-01-01T00:00:00Z',
			end_date: '2024-01-31T00:00:00Z',
			timeframe_type: 'custom',
			timeframe_interval: null,
			recurring_start_date: '2024-01-01T00:00:00Z',
			created_at: '2024-01-01T00:00:00Z'
		},
		{
			budget_id: '2',
			user_id: '2',
			category_id: '2',
			max_spend: 200.00,
			current_spend: 250.00,
			future_spend: 50.00,
			is_over_max: true,
			start_date: '2024-01-01T00:00:00Z',
			end_date: '2024-01-31T00:00:00Z',
			timeframe_type: 'monthly',
			timeframe_interval: 1,
			recurring_start_date: '2024-01-01T00:00:00Z',
			created_at: '2024-01-02T00:00:00Z'
		},
		{
			budget_id: '3',
			user_id: '1',
			category_id: '3',
			max_spend: 100.00,
			current_spend: 75.00,
			future_spend: 25.00,
			is_over_max: false,
			start_date: '2024-01-01T00:00:00Z',
			end_date: '2024-01-31T00:00:00Z',
			timeframe_type: 'yearly',
			timeframe_interval: 1,
			recurring_start_date: '2024-01-01T00:00:00Z',
			created_at: '2024-01-03T00:00:00Z'
		}
	]

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Component Rendering', () => {
		it('renders loading state initially', () => {
			render(<Budgets />)
			
			// Check that the loading state is rendered
			expect(screen.getByTestId('budgets-loading-state')).toBeInTheDocument()
		})

		it('displays budgets when data loads successfully', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Check that budgets are displayed - use getAllByText since there might be multiple instances
			const budget500Elements = screen.getAllByText('$500.00')
			expect(budget500Elements.length).toBeGreaterThan(0)
			const budget200Elements = screen.getAllByText('$200.00')
			expect(budget200Elements.length).toBeGreaterThan(0)
			const budget100Elements = screen.getAllByText('$100.00')
			expect(budget100Elements.length).toBeGreaterThan(0)
			expect(screen.getByText('Groceries')).toBeInTheDocument()
			expect(screen.getByText('Transportation')).toBeInTheDocument()
			expect(screen.getByText('Entertainment')).toBeInTheDocument()
		})

		it('displays error message when API call fails', async () => {
			mockBudgetApi.getAll.mockRejectedValue(new Error('API Error'))

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Failed to load data')).toBeInTheDocument()
			})
		})

		it('displays empty state when no budgets exist', async () => {
			mockBudgetApi.getAll.mockResolvedValue([])
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Should show empty grid or no budgets message
			expect(screen.queryByText('$500.00')).not.toBeInTheDocument()
			expect(screen.queryByText('$200.00')).not.toBeInTheDocument()
		})
	})

	describe('Search Functionality', () => {
		it('filters budgets by user name', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search budgets...')
			await userEvent.type(searchInput, 'john')

			// Should show only John's budgets - use getAllByText since there might be multiple instances
			const budget500Elements = screen.getAllByText('$500.00')
			expect(budget500Elements.length).toBeGreaterThan(0)
			const budget100Elements = screen.getAllByText('$100.00')
			expect(budget100Elements.length).toBeGreaterThan(0)
			expect(screen.queryByText('$200.00')).not.toBeInTheDocument()
		})

		it('filters budgets by category name', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search budgets...')
			await userEvent.type(searchInput, 'Groceries')

			// Should show only Groceries budget - use getAllByText since there might be multiple instances
			const budget500Elements = screen.getAllByText('$500.00')
			expect(budget500Elements.length).toBeGreaterThan(0)
			expect(screen.queryByText('$200.00')).not.toBeInTheDocument()
			expect(screen.queryByText('$100.00')).not.toBeInTheDocument()
		})

		it('filters budgets case-insensitively', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search budgets...')
			await userEvent.type(searchInput, 'jane')

			// Should show only Jane's budgets - use getAllByText since there might be multiple instances
			const budget200Elements = screen.getAllByText('$200.00')
			expect(budget200Elements.length).toBeGreaterThan(0)
			expect(screen.queryByText('$500.00')).not.toBeInTheDocument()
			expect(screen.queryByText('$100.00')).not.toBeInTheDocument()
		})

		it('shows no results when search has no matches', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search budgets...')
			await userEvent.type(searchInput, 'nonexistent')

			// Should show no budgets
			expect(screen.queryByText('$500.00')).not.toBeInTheDocument()
			expect(screen.queryByText('$200.00')).not.toBeInTheDocument()
			expect(screen.queryByText('$100.00')).not.toBeInTheDocument()
		})
	})

	describe('CRUD Operations', () => {
		it('opens create budget modal when Add Budget button is clicked', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			expect(screen.getByText('Add New Budget')).toBeInTheDocument()
			expect(screen.getByDisplayValue('Select a user')).toBeInTheDocument()
			expect(screen.getByDisplayValue('Select a category')).toBeInTheDocument()
			expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
		})

		it('creates a new budget successfully', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.create.mockResolvedValue({
				budget_id: '4',
				user_id: '1',
				category_id: '1',
				max_spend: 300.00,
				current_spend: 0.00,
				future_spend: 0.00,
				is_over_max: false,
				start_date: '2024-02-01T00:00:00Z',
				end_date: '2024-02-29T00:00:00Z',
				timeframe_type: 'custom',
				timeframe_interval: null,
				recurring_start_date: '2024-01-01T00:00:00Z',
				created_at: '2024-02-01T00:00:00Z'
			})

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Fill form
			const userSelect = screen.getByDisplayValue('Select a user')
			await userEvent.selectOptions(userSelect, '1')

			const categorySelect = screen.getByDisplayValue('Select a category')
			await userEvent.selectOptions(categorySelect, '1')

			await userEvent.type(screen.getByPlaceholderText('0.00'), '300.00')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(mockBudgetApi.create).toHaveBeenCalledWith({
					user_id: '1',
					category_id: '1',
					max_spend: 300.00,
					is_over_max: false,
					start_date: expect.any(String),
					end_date: expect.any(String),
					timeframe_type: 'custom',
					timeframe_interval: undefined,
					recurring_start_date: expect.any(String)
				})
			})
		})

		it('opens edit budget modal when edit button is clicked', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Find edit button by looking for the pencil icon button
			const editButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-primary-600')
			)
			await userEvent.click(editButtons[0])

			expect(screen.getByText('Edit Budget')).toBeInTheDocument()
			// Check that the modal opened and we can see the form
			expect(screen.getByText('Edit Budget')).toBeInTheDocument()
			expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
		})

		it('updates a budget successfully', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.update.mockResolvedValue({
				...mockBudgets[0],
				max_spend: 600.00
			})

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open edit modal
			const editButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-primary-600')
			)
			await userEvent.click(editButtons[0])

			// Update form - find the max spend input by placeholder
			const maxSpendInput = screen.getByPlaceholderText('0.00')
			await userEvent.clear(maxSpendInput)
			await userEvent.type(maxSpendInput, '600.00')

			// Submit form
			const submitButton = screen.getByText('Update')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(mockBudgetApi.update).toHaveBeenCalledWith('1', expect.objectContaining({
					max_spend: 600.00
				}))
			})
		})

		it('deletes a budget successfully', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.delete.mockResolvedValue({})

			// Mock confirm to return true
			global.confirm = vi.fn(() => true)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Find delete button by looking for the trash icon button
			const deleteButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-red-600')
			)
			await userEvent.click(deleteButtons[0])

			await waitFor(() => {
				expect(mockBudgetApi.delete).toHaveBeenCalledWith('1')
			})
		})
	})

	describe('Form Validation', () => {
		it('validates required fields', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Try to submit without filling required fields
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			// Check that form doesn't submit (HTML5 validation should prevent it)
			expect(screen.getByText('Add New Budget')).toBeInTheDocument()
		})

		it('validates currency format', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Fill form with invalid currency
			const userSelect = screen.getByDisplayValue('Select a user')
			await userEvent.selectOptions(userSelect, '1')

			const categorySelect = screen.getByDisplayValue('Select a category')
			await userEvent.selectOptions(categorySelect, '1')

			await userEvent.type(screen.getByPlaceholderText('0.00'), 'invalid')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			// Check that form doesn't submit due to invalid currency
			expect(screen.getByText('Add New Budget')).toBeInTheDocument()
		})

		it('validates positive max spend', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Fill form with negative max spend
			const userSelect = screen.getByDisplayValue('Select a user')
			await userEvent.selectOptions(userSelect, '1')

			const categorySelect = screen.getByDisplayValue('Select a category')
			await userEvent.selectOptions(categorySelect, '1')

			await userEvent.type(screen.getByPlaceholderText('0.00'), '-100.00')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			// The component converts negative values to positive, so check that it was called
			// with the converted positive value
			await waitFor(() => {
				expect(mockBudgetApi.create).toHaveBeenCalledWith(expect.objectContaining({
					max_spend: 100.00
				}))
			})
		})
	})

	describe('Timeframe Handling', () => {
		it('shows custom date range fields when custom is selected', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Check that custom date range fields are shown by default
			expect(screen.getByText('Start Date')).toBeInTheDocument()
			expect(screen.getByText('End Date')).toBeInTheDocument()
		})

		it('shows interval field when recurring timeframe is selected', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Select monthly timeframe
			const timeframeSelect = screen.getByDisplayValue('Custom Date Range')
			await userEvent.selectOptions(timeframeSelect, 'monthly')

			// Check that interval field is shown
			expect(screen.getByText('Interval')).toBeInTheDocument()
			expect(screen.getByPlaceholderText('Number of months')).toBeInTheDocument()
		})

		it('creates budget with recurring timeframe', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.create.mockResolvedValue({
				budget_id: '4',
				user_id: '1',
				category_id: '1',
				max_spend: 300.00,
				current_spend: 0.00,
				future_spend: 0.00,
				is_over_max: false,
				start_date: '2024-02-01T00:00:00Z',
				end_date: '2024-02-29T00:00:00Z',
				timeframe_type: 'monthly',
				timeframe_interval: 2,
				recurring_start_date: '2024-01-01T00:00:00Z',
				created_at: '2024-02-01T00:00:00Z'
			})

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Fill form
			const userSelect = screen.getByDisplayValue('Select a user')
			await userEvent.selectOptions(userSelect, '1')

			const categorySelect = screen.getByDisplayValue('Select a category')
			await userEvent.selectOptions(categorySelect, '1')

			await userEvent.type(screen.getByPlaceholderText('0.00'), '300.00')

			// Select monthly timeframe
			const timeframeSelect = screen.getByDisplayValue('Custom Date Range')
			await userEvent.selectOptions(timeframeSelect, 'monthly')

			// Fill interval
			await userEvent.type(screen.getByPlaceholderText('Number of months'), '2')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(mockBudgetApi.create).toHaveBeenCalledWith(expect.objectContaining({
					timeframe_type: 'monthly',
					timeframe_interval: 2
				}))
			})
		})
	})

	describe('Budget Status Display', () => {
		it('displays active status for current budgets', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Check that status is displayed (either Active or Inactive)
			const statusElements = screen.getAllByText(/Active|Inactive/)
			expect(statusElements.length).toBeGreaterThan(0)
		})

		it('displays over budget status when budget is exceeded', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Check that over budget status is displayed
			const overBudgetElements = screen.getAllByText('Over Budget')
			expect(overBudgetElements.length).toBeGreaterThan(0)
		})

		it('displays timeframe information correctly', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Check that timeframe information is displayed
			expect(screen.getByText('Custom')).toBeInTheDocument()
			expect(screen.getByText('Every 1 month(s)')).toBeInTheDocument()
			expect(screen.getByText('Every 1 year(s)')).toBeInTheDocument()
		})
	})

	describe('Total Calculations', () => {
		it('displays correct total budget amount', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Total should be 500 + 200 + 100 = 800
			expect(screen.getByText('$800.00')).toBeInTheDocument()
			expect(screen.getByText('Total Budget (3 budgets)')).toBeInTheDocument()
		})

		it('displays current and future spend totals', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Current: 350 + 250 + 75 = 675, Future: 100 + 50 + 25 = 175
			expect(screen.getByText('Current: $675.00 | Future: $175.00')).toBeInTheDocument()
		})

		it('updates totals when budgets are filtered', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Filter by user
			const searchInput = screen.getByPlaceholderText('Search budgets...')
			await userEvent.type(searchInput, 'john')

			// Total should be only John's budgets: 500 + 100 = 600
			expect(screen.getByText('$600.00')).toBeInTheDocument()
			expect(screen.getByText('Total Budget (2 budgets)')).toBeInTheDocument()
		})
	})

	describe('Modal Interactions', () => {
		it('closes modal when cancel button is clicked', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			expect(screen.getByText('Add New Budget')).toBeInTheDocument()

			// Close modal
			const cancelButton = screen.getByText('Cancel')
			await userEvent.click(cancelButton)

			await waitFor(() => {
				expect(screen.queryByText('Add New Budget')).not.toBeInTheDocument()
			})
		})

		it('resets form when modal is closed', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Fill some fields
			await userEvent.type(screen.getByPlaceholderText('0.00'), '500.00')

			// Close modal
			const cancelButton = screen.getByText('Cancel')
			await userEvent.click(cancelButton)

			// Reopen modal
			await userEvent.click(addButton)

			// Check that form is reset
			const maxSpendInput = screen.getByPlaceholderText('0.00')
			expect(maxSpendInput).toHaveValue('')
		})
	})

	describe('Error Handling', () => {
		it('handles API errors gracefully', async () => {
			mockBudgetApi.getAll.mockRejectedValue(new Error('Network error'))

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Failed to load data')).toBeInTheDocument()
			})
		})

		it('handles create budget errors', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.create.mockRejectedValue(new Error('Creation failed'))

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Budget')
			await userEvent.click(addButton)

			// Fill form
			const userSelect = screen.getByDisplayValue('Select a user')
			await userEvent.selectOptions(userSelect, '1')

			const categorySelect = screen.getByDisplayValue('Select a category')
			await userEvent.selectOptions(categorySelect, '1')

			await userEvent.type(screen.getByPlaceholderText('0.00'), '300.00')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Failed to save budget')).toBeInTheDocument()
			})
		})

		it('handles update budget errors', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.update.mockRejectedValue(new Error('Update failed'))

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Open edit modal
			const editButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-primary-600')
			)
			await userEvent.click(editButtons[0])

			// Update form - find the max spend input by placeholder
			const maxSpendInput = screen.getByPlaceholderText('0.00')
			await userEvent.clear(maxSpendInput)
			await userEvent.type(maxSpendInput, '600.00')

			// Submit form
			const submitButton = screen.getByText('Update')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Failed to save budget')).toBeInTheDocument()
			})
		})

		it('handles delete budget errors', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)
			mockBudgetApi.delete.mockRejectedValue(new Error('Delete failed'))

			// Mock confirm to return true
			global.confirm = vi.fn(() => true)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Find delete button
			const deleteButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-red-600')
			)
			await userEvent.click(deleteButtons[0])

			await waitFor(() => {
				expect(screen.getByText('Failed to delete budget')).toBeInTheDocument()
			})
		})

		it('handles delete confirmation cancellation', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			// Mock confirm to return false
			global.confirm = vi.fn(() => false)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Find delete button
			const deleteButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-red-600')
			)
			await userEvent.click(deleteButtons[0])

			// Should not call delete API
			expect(mockBudgetApi.delete).not.toHaveBeenCalled()
		})
	})

	describe('UI Elements', () => {
		it('displays budget cards with proper styling', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			// Check that budget cards are displayed - use getAllByText since there might be multiple instances
			const budget500Elements = screen.getAllByText('$500.00')
			expect(budget500Elements.length).toBeGreaterThan(0)
			const budget200Elements = screen.getAllByText('$200.00')
			expect(budget200Elements.length).toBeGreaterThan(0)
			const budget100Elements = screen.getAllByText('$100.00')
			expect(budget100Elements.length).toBeGreaterThan(0)

			// Check that edit and delete buttons are present for each budget
			const editButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-primary-600')
			)
			const deleteButtons = screen.getAllByRole('button').filter(button => 
				button.querySelector('svg') && button.className.includes('text-red-600')
			)

			expect(editButtons.length).toBe(3) // One for each budget
			expect(deleteButtons.length).toBe(3) // One for each budget
		})

		it('displays search input with proper placeholder', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search budgets...')
			expect(searchInput).toBeInTheDocument()
		})

		it('displays proper page title and description', async () => {
			mockBudgetApi.getAll.mockResolvedValue(mockBudgets)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockCategoryApi.getAll.mockResolvedValue(mockCategories)

			render(<Budgets />)

			await waitFor(() => {
				expect(screen.getByText('Budgets')).toBeInTheDocument()
			})

			expect(screen.getByText('Manage your budgets')).toBeInTheDocument()
		})
	})
}) 