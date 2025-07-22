import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  User,
  UserCreate,
  UserUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  WishlistItem,
  WishlistItemCreate,
  WishlistItemUpdate,
  Budget,
  BudgetCreate,
  BudgetUpdate,
  ApiResponse,
  ApiError
} from '../types/api';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// User API
export const userApi = {
  async getAll(): Promise<User[]> {
    const response = await api.get('/users/');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getById(id: string): Promise<User | null> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  async create(user: UserCreate): Promise<User> {
    const response = await api.post('/users/', user);
    return response.data;
  },
  
  async update(id: string, user: UserUpdate): Promise<User> {
    const response = await api.put(`/users/${id}`, user);
    return response.data;
  },
  
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

// Category API
export const categoryApi = {
  async getAll(): Promise<Category[]> {
    const response = await api.get('/categories/');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getById(id: string): Promise<Category | null> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  
  async create(category: CategoryCreate): Promise<Category> {
    const response = await api.post('/categories/', category);
    return response.data;
  },
  
  async update(id: string, category: CategoryUpdate): Promise<Category> {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },
  
  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

// Expense API
export const expenseApi = {
  async getAll(): Promise<Expense[]> {
    const response = await api.get('/expenses/');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getById(id: string): Promise<Expense | null> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },
  
  async create(expense: ExpenseCreate): Promise<Expense> {
    const response = await api.post('/expenses/', expense);
    return response.data;
  },
  
  async update(id: string, expense: ExpenseUpdate): Promise<Expense> {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data;
  },
  
  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
  
  async getByUserId(userId: string): Promise<Expense[]> {
    const response = await api.get(`/expenses/user/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getByCategoryId(categoryId: string): Promise<Expense[]> {
    const response = await api.get(`/expenses/category/${categoryId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Expense Category Management
  async addCategory(expenseId: string, categoryId: string): Promise<void> {
    await api.post(`/expenses/${expenseId}/categories/${categoryId}`);
  },

  async removeCategory(expenseId: string, categoryId: string): Promise<void> {
    await api.delete(`/expenses/${expenseId}/categories/${categoryId}`);
  },
};

// Wishlist API
export const wishlistApi = {
  async getAll(): Promise<WishlistItem[]> {
    const response = await api.get('/wishlist/');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getById(id: string): Promise<WishlistItem | null> {
    const response = await api.get(`/wishlist/${id}`);
    return response.data;
  },
  
  async create(item: WishlistItemCreate): Promise<WishlistItem> {
    const response = await api.post('/wishlist/', item);
    return response.data;
  },
  
  async update(id: string, item: WishlistItemUpdate): Promise<WishlistItem> {
    const response = await api.put(`/wishlist/${id}`, item);
    return response.data;
  },
  
  async delete(id: string): Promise<void> {
    await api.delete(`/wishlist/${id}`);
  },
  
  async getByUserId(userId: string): Promise<WishlistItem[]> {
    const response = await api.get(`/wishlist/user/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

// Budget API
export const budgetApi = {
  async getAll(): Promise<Budget[]> {
    const response = await api.get('/budgets/');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getById(id: string): Promise<Budget | null> {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  },
  
  async create(budget: BudgetCreate): Promise<Budget> {
    const response = await api.post('/budgets/', budget);
    return response.data;
  },
  
  async update(id: string, budget: BudgetUpdate): Promise<Budget> {
    const response = await api.put(`/budgets/${id}`, budget);
    return response.data;
  },
  
  async delete(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },
  
  async getByUserId(userId: string): Promise<Budget[]> {
    const response = await api.get(`/budgets/user/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
  
  async getByCategoryId(categoryId: string): Promise<Budget[]> {
    const response = await api.get(`/budgets/category/${categoryId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default api; 