export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login: string;
}

export interface UserCreate {
  username: string;
  email: string;
  role: string;
  password_hash: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  role?: string;
  password_hash?: string;
}

export interface Category {
  category_id: string;
  category_name: string;
}

export interface CategoryCreate {
  category_name: string;
}

export interface CategoryUpdate {
  category_name?: string;
}

export interface Expense {
  expense_id: string;
  user_id: string;
  item: string;
  vendor: string;
  price: number;
  date_purchased: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  user?: User;
  category?: Category;
}

export interface ExpenseCreate {
  user_id: string;
  item: string;
  vendor: string;
  price: number;
  date_purchased: string;
  payment_method?: string;
  notes?: string;
}

export interface ExpenseUpdate {
  user_id?: string;
  item?: string;
  vendor?: string;
  price?: number;
  date_purchased?: string;
  payment_method?: string;
  notes?: string;
}

export interface WishlistItem {
  wish_id: string;
  user_id: string;
  item: string;
  vendor?: string;
  price: number;
  priority: number; // 1-10
  status: string; // wished, scheduled, bought
  notes?: string;
  planned_date?: string;
  created_at: string;
  user?: User;
}

export interface WishlistItemCreate {
  user_id: string;
  item: string;
  vendor?: string;
  price: number;
  priority: number; // 1-10
  status: string; // wished, scheduled, bought
  notes?: string;
  planned_date?: string;
}

export interface WishlistItemUpdate {
  user_id?: string;
  item?: string;
  vendor?: string;
  price?: number;
  priority?: number; // 1-10
  status?: string; // wished, scheduled, bought
  notes?: string;
  planned_date?: string;
}

export interface Budget {
  budget_id: string;
  user_id: string;
  category_id: string;
  current_spend: number;
  future_spend: number;
  max_spend: number;
  is_over_max: boolean;
  start_date: string;
  end_date: string;
  user?: User;
  category?: Category;
}

export interface BudgetCreate {
  user_id: string;
  category_id: string;
  current_spend: number;
  future_spend: number;
  max_spend: number;
  is_over_max: boolean;
  start_date: string;
  end_date: string;
}

export interface BudgetUpdate {
  user_id?: string;
  category_id?: string;
  current_spend?: number;
  future_spend?: number;
  max_spend?: number;
  is_over_max?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
} 