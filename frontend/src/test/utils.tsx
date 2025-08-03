// frontend/src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ReactElement } from 'react'

// Custom render function with router context following component composition patterns
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<BrowserRouter>
			{children}
		</BrowserRouter>
	)
}

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data following proper TypeScript interfaces
interface MockUser {
	user_id: string
	username: string
	email: string
	role: string
	created_at: string
	last_login: string
}

interface MockWishlistItem {
	wish_id: string
	user_id: string
	item: string
	vendor?: string
	price: number
	priority: number
	status: string
	notes?: string
	planned_date?: string
	created_at: string
	user?: MockUser
}

// Mock data with proper TypeScript typing
export const mockUsers: MockUser[] = [
	{
		user_id: '1',
		username: 'john_doe',
		email: 'john@example.com',
		role: 'user',
		created_at: '2024-01-01T00:00:00Z',
		last_login: '2024-01-15T00:00:00Z'
	},
	{
		user_id: '2',
		username: 'jane_smith',
		email: 'jane@example.com',
		role: 'user',
		created_at: '2024-01-02T00:00:00Z',
		last_login: '2024-01-16T00:00:00Z'
	}
]

export const mockWishlistItems: MockWishlistItem[] = [
	{
		wish_id: '1',
		user_id: '1',
		item: 'iPhone 15 Pro',
		vendor: 'Apple Store',
		price: 999.00,
		priority: 8,
		status: 'wished',
		notes: 'Need for work and photography',
		planned_date: '2024-03-15',
		created_at: '2024-01-01T00:00:00Z',
		user: mockUsers[0]
	},
	{
		wish_id: '2',
		user_id: '1',
		item: 'Gaming Laptop',
		vendor: 'Best Buy',
		price: 1499.00,
		priority: 6,
		status: 'scheduled',
		notes: 'For gaming and development',
		planned_date: '2024-04-01',
		created_at: '2024-01-02T00:00:00Z',
		user: mockUsers[0]
	},
	{
		wish_id: '3',
		user_id: '2',
		item: 'Vacation Trip',
		vendor: 'Travel Agency',
		price: 2500.00,
		priority: 9,
		status: 'wished',
		notes: 'Europe trip for summer',
		created_at: '2024-01-03T00:00:00Z',
		user: mockUsers[1]
	}
]

// Re-export everything following functional programming patterns
export * from '@testing-library/react'
export { customRender as render }