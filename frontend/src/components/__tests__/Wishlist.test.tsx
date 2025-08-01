// frontend/src/components/__tests__/wishlist.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import Wishlist from '../Wishlist'
import { wishlistApi, userApi } from '../../services/api'
import { mockWishlistItems, mockUsers } from '../../test/utils'

// Mock the API services following functional programming patterns
vi.mock('../../services/api', () => ({
	wishlistApi: {
		getAll: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	},
	userApi: {
		getAll: vi.fn()
	}
}))

describe('Wishlist', () => {
	const mockWishlistApi = wishlistApi as any
	const mockUserApi = userApi as any

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Component Rendering', () => {
		it('renders loading state initially', () => {
			render(<Wishlist />)
			
			expect(screen.getByRole('status')).toBeInTheDocument()
		})

		it('displays wishlist items when data loads successfully', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Check that wishlist items are displayed
			expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
			expect(screen.getByText('Gaming Laptop')).toBeInTheDocument()
			expect(screen.getByText('Vacation Trip')).toBeInTheDocument()
			expect(screen.getByText('$999.00')).toBeInTheDocument()
			expect(screen.getByText('$1,499.00')).toBeInTheDocument()
			expect(screen.getByText('$2,500.00')).toBeInTheDocument()
		})

		it('displays error message when API call fails', async () => {
			mockWishlistApi.getAll.mockRejectedValue(new Error('API Error'))

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Failed to load data')).toBeInTheDocument()
			})
		})

		it('displays empty state when no wishlist items exist', async () => {
			mockWishlistApi.getAll.mockResolvedValue([])
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Should show empty state or no items message
			expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
		})
	})

	describe('Search Functionality', () => {
		it('filters wishlist items by search term', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search wishlist items...')
			await userEvent.type(searchInput, 'iPhone')

			// Should show only iPhone item
			expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
			expect(screen.queryByText('Gaming Laptop')).not.toBeInTheDocument()
			expect(screen.queryByText('Vacation Trip')).not.toBeInTheDocument()
		})

		it('filters by vendor name', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search wishlist items...')
			await userEvent.type(searchInput, 'Apple')

			// Should show only Apple Store items
			expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
			expect(screen.queryByText('Gaming Laptop')).not.toBeInTheDocument()
		})

		it('filters by user name', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search wishlist items...')
			await userEvent.type(searchInput, 'jane')

			// Should show only Jane's items
			expect(screen.getByText('Vacation Trip')).toBeInTheDocument()
			expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
		})
	})

	describe('CRUD Operations', () => {
		it('opens create wishlist item modal when Add Item button is clicked', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			expect(screen.getByText('Add New Wishlist Item')).toBeInTheDocument()
			expect(screen.getByLabelText('Item Name')).toBeInTheDocument()
			expect(screen.getByLabelText('Price')).toBeInTheDocument()
			expect(screen.getByLabelText('Priority')).toBeInTheDocument()
			expect(screen.getByLabelText('Status')).toBeInTheDocument()
		})

		it('creates a new wishlist item successfully', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockWishlistApi.create.mockResolvedValue({
				wish_id: '4',
				user_id: '1',
				item: 'New Item',
				vendor: 'New Store',
				price: 500.00,
				priority: 7,
				status: 'wished',
				created_at: '2024-01-04T00:00:00Z',
				user: mockUsers[0]
			})

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			// Fill form
			await userEvent.type(screen.getByLabelText('Item Name'), 'New Item')
			await userEvent.type(screen.getByLabelText('Vendor/Store'), 'New Store')
			await userEvent.type(screen.getByLabelText('Price'), '500.00')

			// Select user
			const userSelect = screen.getByLabelText('User')
			await userEvent.selectOptions(userSelect, '1')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(mockWishlistApi.create).toHaveBeenCalledWith({
					user_id: '1',
					item: 'New Item',
					vendor: 'New Store',
					price: 500.00,
					priority: 5, // Default value
					status: 'wished', // Default value
					notes: '',
					planned_date: ''
				})
			})
		})

		it('opens edit wishlist item modal when edit button is clicked', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const editButtons = screen.getAllByTestId('edit-button')
			await userEvent.click(editButtons[0])

			expect(screen.getByText('Edit Wishlist Item')).toBeInTheDocument()
			expect(screen.getByDisplayValue('iPhone 15 Pro')).toBeInTheDocument()
			expect(screen.getByDisplayValue('999.00')).toBeInTheDocument()
		})

		it('updates a wishlist item successfully', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockWishlistApi.update.mockResolvedValue({
				...mockWishlistItems[0],
				item: 'Updated iPhone 15 Pro',
				price: 1099.00
			})

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open edit modal
			const editButtons = screen.getAllByTestId('edit-button')
			await userEvent.click(editButtons[0])

			// Update form
			const itemInput = screen.getByDisplayValue('iPhone 15 Pro')
			await userEvent.clear(itemInput)
			await userEvent.type(itemInput, 'Updated iPhone 15 Pro')

			const priceInput = screen.getByDisplayValue('999.00')
			await userEvent.clear(priceInput)
			await userEvent.type(priceInput, '1099.00')

			// Submit form
			const submitButton = screen.getByText('Update')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(mockWishlistApi.update).toHaveBeenCalledWith('1', {
					user_id: '1',
					item: 'Updated iPhone 15 Pro',
					vendor: 'Apple Store',
					price: 1099.00,
					priority: 8,
					status: 'wished',
					notes: 'Need for work and photography',
					planned_date: '2024-03-15'
				})
			})
		})

		it('deletes a wishlist item successfully', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockWishlistApi.delete.mockResolvedValue({})

			// Mock confirm to return true
			global.confirm = vi.fn(() => true)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const deleteButtons = screen.getAllByTestId('delete-button')
			await userEvent.click(deleteButtons[0])

			await waitFor(() => {
				expect(mockWishlistApi.delete).toHaveBeenCalledWith('1')
			})
		})
	})

	describe('Form Validation', () => {
		it('validates required fields', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			// Try to submit without filling required fields
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			// Check for validation errors
			expect(screen.getByText('Item Name is required')).toBeInTheDocument()
			expect(screen.getByText('Price is required')).toBeInTheDocument()
			expect(screen.getByText('User is required')).toBeInTheDocument()
		})

		it('validates currency format', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			// Fill form with invalid price
			await userEvent.type(screen.getByLabelText('Item Name'), 'Test Item')
			await userEvent.type(screen.getByLabelText('Price'), 'invalid')

			// Select user
			const userSelect = screen.getByLabelText('User')
			await userEvent.selectOptions(userSelect, '1')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			// Check for validation error
			expect(screen.getByText('Price must be in valid currency format (e.g., 10.50)')).toBeInTheDocument()
		})

		it('validates positive price', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			// Fill form with negative price
			await userEvent.type(screen.getByLabelText('Item Name'), 'Test Item')
			await userEvent.type(screen.getByLabelText('Price'), '-10.00')

			// Select user
			const userSelect = screen.getByLabelText('User')
			await userEvent.selectOptions(userSelect, '1')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			// Check for validation error
			expect(screen.getByText('Price must be a positive number')).toBeInTheDocument()
		})
	})

	describe('Priority and Status Display', () => {
		it('displays priority with correct color coding', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Check priority display
			expect(screen.getByText('8 - High')).toBeInTheDocument()
			expect(screen.getByText('6 - Medium')).toBeInTheDocument()
			expect(screen.getByText('9 - Highest')).toBeInTheDocument()
		})

		it('displays status with correct color coding', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Check status display
			expect(screen.getByText('Wished')).toBeInTheDocument()
			expect(screen.getByText('Scheduled')).toBeInTheDocument()
		})
	})

	describe('Total Value Calculation', () => {
		it('displays correct total value', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Total should be 999 + 1499 + 2500 = 4998
			expect(screen.getByText('$4,998.00')).toBeInTheDocument()
			expect(screen.getByText('Total Value (3 items)')).toBeInTheDocument()
		})

		it('updates total value when items are filtered', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			const searchInput = screen.getByPlaceholderText('Search wishlist items...')
			await userEvent.type(searchInput, 'iPhone')

			// Total should be only 999
			expect(screen.getByText('$999.00')).toBeInTheDocument()
			expect(screen.getByText('Total Value (1 items)')).toBeInTheDocument()
		})
	})

	describe('Modal Interactions', () => {
		it('closes modal when cancel button is clicked', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			expect(screen.getByText('Add New Wishlist Item')).toBeInTheDocument()

			// Close modal
			const cancelButton = screen.getByText('Cancel')
			await userEvent.click(cancelButton)

			await waitFor(() => {
				expect(screen.queryByText('Add New Wishlist Item')).not.toBeInTheDocument()
			})
		})

		it('resets form when modal is closed', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			// Fill some fields
			await userEvent.type(screen.getByLabelText('Item Name'), 'Test Item')
			await userEvent.type(screen.getByLabelText('Price'), '100.00')

			// Close modal
			const cancelButton = screen.getByText('Cancel')
			await userEvent.click(cancelButton)

			// Reopen modal
			await userEvent.click(addButton)

			// Check that form is reset
			expect(screen.getByDisplayValue('')).toBeInTheDocument()
		})
	})

	describe('Error Handling', () => {
		it('handles API errors gracefully', async () => {
			mockWishlistApi.getAll.mockRejectedValue(new Error('Network error'))
			mockUserApi.getAll.mockResolvedValue(mockUsers)

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Failed to load data')).toBeInTheDocument()
			})
		})

		it('handles form submission errors', async () => {
			mockWishlistApi.getAll.mockResolvedValue(mockWishlistItems)
			mockUserApi.getAll.mockResolvedValue(mockUsers)
			mockWishlistApi.create.mockRejectedValue(new Error('Creation failed'))

			render(<Wishlist />)

			await waitFor(() => {
				expect(screen.getByText('Wishlist')).toBeInTheDocument()
			})

			// Open create modal
			const addButton = screen.getByText('Add Item')
			await userEvent.click(addButton)

			// Fill form
			await userEvent.type(screen.getByLabelText('Item Name'), 'Test Item')
			await userEvent.type(screen.getByLabelText('Price'), '100.00')

			// Select user
			const userSelect = screen.getByLabelText('User')
			await userEvent.selectOptions(userSelect, '1')

			// Submit form
			const submitButton = screen.getByText('Create')
			await userEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Failed to save wishlist item')).toBeInTheDocument()
			})
		})
	})
})