from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
import re

# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    role: str = Field(..., pattern=r'^(regular|admin)$', strip_whitespace=True)

class UserCreate(UserBase):
    password_hash: str = Field(..., min_length=60, max_length=73)  # bcrypt hash length

class UserUpdate(UserBase):
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern=r'^(regular|admin)$', strip_whitespace=True)
    password_hash: Optional[str] = Field(None, min_length=60, max_length=73)

class User(UserBase):
    user_id: UUID
    created_at: datetime
    last_login: datetime
    
    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    
    @validator('category_name')
    def validate_category_name(cls, v):
        # Remove any potentially dangerous characters
        v = re.sub(r'[<>"\']', '', v)
        return v.strip()

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    category_name: Optional[str] = Field(None, min_length=1, max_length=100, strip_whitespace=True)

class Category(CategoryBase):
    category_id: UUID
    
    class Config:
        from_attributes = True

# Expense schemas
class ExpenseBase(BaseModel):
    item: str = Field(..., min_length=1, max_length=255, strip_whitespace=True)
    vendor: str = Field(..., min_length=1, max_length=255, strip_whitespace=True)
    price: float = Field(..., gt=0, le=999999.99)  # Positive price with reasonable limit
    date_purchased: date
    payment_method: Optional[str] = Field(None, max_length=100, strip_whitespace=True)
    notes: Optional[str] = Field(None, max_length=1000, strip_whitespace=True)
    
    @validator('item', 'vendor', 'payment_method', 'notes')
    def validate_text_fields(cls, v):
        if v is not None:
            # Remove potentially dangerous characters
            v = re.sub(r'[<>"\']', '', v)
            return v.strip()
        return v

class ExpenseCreate(ExpenseBase):
    user_id: UUID
    new_categories: Optional[List[str]] = Field(None, description="List of new category names to create")

class ExpenseUpdate(ExpenseBase):
    item: Optional[str] = Field(None, min_length=1, max_length=255, strip_whitespace=True)
    vendor: Optional[str] = Field(None, min_length=1, max_length=255, strip_whitespace=True)
    price: Optional[float] = Field(None, gt=0, le=999999.99)
    date_purchased: Optional[date] = None
    payment_method: Optional[str] = Field(None, max_length=100, strip_whitespace=True)
    notes: Optional[str] = Field(None, max_length=1000, strip_whitespace=True)
    new_categories: Optional[List[str]] = Field(None, description="List of new category names to create")

class Expense(ExpenseBase):
    expense_id: UUID
    user_id: UUID
    created_at: datetime
    categories: Optional[List[Category]] = []
    
    class Config:
        from_attributes = True

# ExpenseCategory schemas
class ExpenseCategoryBase(BaseModel):
    expense_id: UUID
    category_id: UUID

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategory(ExpenseCategoryBase):
    class Config:
        from_attributes = True

# Wishlist schemas
class WishlistBase(BaseModel):
    item: str = Field(..., min_length=1, max_length=255, strip_whitespace=True)
    vendor: Optional[str] = Field(None, max_length=255, strip_whitespace=True)
    price: float = Field(..., gt=0, le=999999.99)
    priority: int = Field(..., ge=1, le=10)  # Priority 1-10
    status: str = Field(..., pattern=r'^(wished|scheduled|bought)$')
    notes: Optional[str] = Field(None, max_length=1000, strip_whitespace=True)
    planned_date: Optional[date] = None
    
    @validator('item', 'vendor', 'notes')
    def validate_text_fields(cls, v):
        if v is not None:
            v = re.sub(r'[<>"\']', '', v)
            return v.strip()
        return v

class WishlistCreate(WishlistBase):
    user_id: UUID

class WishlistUpdate(WishlistBase):
    item: Optional[str] = Field(None, min_length=1, max_length=255, strip_whitespace=True)
    vendor: Optional[str] = Field(None, max_length=255, strip_whitespace=True)
    price: Optional[float] = Field(None, gt=0, le=999999.99)
    priority: Optional[int] = Field(None, ge=1, le=10)
    status: Optional[str] = Field(None, pattern=r'^(wished|scheduled|bought)$')
    notes: Optional[str] = Field(None, max_length=1000, strip_whitespace=True)
    planned_date: Optional[date] = None

class Wishlist(WishlistBase):
    wish_id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    user: Optional[User] = None
    
    class Config:
        from_attributes = True

# Budget schemas
class BudgetBase(BaseModel):
    max_spend: float = Field(..., gt=0, le=999999.99)
    is_over_max: bool
    start_date: date
    end_date: date
    timeframe_type: str = Field(..., pattern=r'^(yearly|monthly|weekly|custom)$')
    timeframe_interval: Optional[int] = Field(None, ge=1, le=100)
    target_date: Optional[date] = None
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v
    
    @validator('timeframe_interval')
    def validate_timeframe_interval(cls, v, values):
        if 'timeframe_type' in values and values['timeframe_type'] != 'custom' and v is None:
            raise ValueError('timeframe_interval is required for non-custom timeframes')
        if 'timeframe_type' in values and values['timeframe_type'] == 'custom' and v is not None:
            raise ValueError('timeframe_interval should be null for custom timeframes')
        return v

class BudgetCreate(BudgetBase):
    user_id: UUID
    category_id: UUID

class BudgetUpdate(BudgetBase):
    max_spend: Optional[float] = Field(None, gt=0, le=999999.99)
    is_over_max: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timeframe_type: Optional[str] = Field(None, pattern=r'^(yearly|monthly|weekly|custom)$')
    timeframe_interval: Optional[int] = Field(None, ge=1, le=100)
    target_date: Optional[date] = None

class Budget(BudgetBase):
    budget_id: UUID
    user_id: UUID
    category_id: UUID
    current_spend: float = Field(..., ge=0, le=999999.99)
    future_spend: float = Field(..., ge=0, le=999999.99)
    
    class Config:
        from_attributes = True 