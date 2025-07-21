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
  getAll: (): Promise<AxiosResponse<ApiResponse<User[]>>> => 
    api.get('/users/'),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<User>>> => 
    api.get(`/users/${id}`),
  
  create: (user: UserCreate): Promise<AxiosResponse<ApiResponse<User>>> => 
    api.post('/users/', user),
  
  update: (id: string, user: UserUpdate): Promise<AxiosResponse<ApiResponse<User>>> => 
    api.put(`/users/${id}`, user),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/users/${id}`),
};

// Category API
export const categoryApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Category[]>>> => 
    api.get('/categories/'),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<Category>>> => 
    api.get(`/categories/${id}`),
  
  create: (category: CategoryCreate): Promise<AxiosResponse<ApiResponse<Category>>> => 
    api.post('/categories/', category),
  
  update: (id: string, category: CategoryUpdate): Promise<AxiosResponse<ApiResponse<Category>>> => 
    api.put(`/categories/${id}`, category),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/categories/${id}`),
};

// Expense API
export const expenseApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Expense[]>>> => 
    api.get('/expenses/'),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<Expense>>> => 
    api.get(`/expenses/${id}`),
  
  create: (expense: ExpenseCreate): Promise<AxiosResponse<ApiResponse<Expense>>> => 
    api.post('/expenses/', expense),
  
  update: (id: string, expense: ExpenseUpdate): Promise<AxiosResponse<ApiResponse<Expense>>> => 
    api.put(`/expenses/${id}`, expense),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/expenses/${id}`),
  
  getByUserId: (userId: string): Promise<AxiosResponse<ApiResponse<Expense[]>>> => 
    api.get(`/expenses/user/${userId}`),
  
  getByCategoryId: (categoryId: string): Promise<AxiosResponse<ApiResponse<Expense[]>>> => 
    api.get(`/expenses/category/${categoryId}`),
};

// Wishlist API
export const wishlistApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<WishlistItem[]>>> => 
    api.get('/wishlist/'),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<WishlistItem>>> => 
    api.get(`/wishlist/${id}`),
  
  create: (item: WishlistItemCreate): Promise<AxiosResponse<ApiResponse<WishlistItem>>> => 
    api.post('/wishlist/', item),
  
  update: (id: string, item: WishlistItemUpdate): Promise<AxiosResponse<ApiResponse<WishlistItem>>> => 
    api.put(`/wishlist/${id}`, item),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/wishlist/${id}`),
  
  getByUserId: (userId: string): Promise<AxiosResponse<ApiResponse<WishlistItem[]>>> => 
    api.get(`/wishlist/user/${userId}`),
};

// Budget API
export const budgetApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Budget[]>>> => 
    api.get('/budgets/'),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<Budget>>> => 
    api.get(`/budgets/${id}`),
  
  create: (budget: BudgetCreate): Promise<AxiosResponse<ApiResponse<Budget>>> => 
    api.post('/budgets/', budget),
  
  update: (id: string, budget: BudgetUpdate): Promise<AxiosResponse<ApiResponse<Budget>>> => 
    api.put(`/budgets/${id}`, budget),
  
  delete: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/budgets/${id}`),
  
  getByUserId: (userId: string): Promise<AxiosResponse<ApiResponse<Budget[]>>> => 
    api.get(`/budgets/user/${userId}`),
  
  getByCategoryId: (categoryId: string): Promise<AxiosResponse<ApiResponse<Budget[]>>> => 
    api.get(`/budgets/category/${categoryId}`),
};

export default api; 