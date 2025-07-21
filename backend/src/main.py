from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from uuid import UUID
from security import rate_limit_middleware, log_security_event, sanitize_input

from database import engine, get_db
from models import Base, User, Category, Expense, ExpenseCategory, Wishlist, Budget
from schemas import (
    User as UserSchema, UserCreate, UserUpdate,
    Category as CategorySchema, CategoryCreate, CategoryUpdate,
    Expense as ExpenseSchema, ExpenseCreate, ExpenseUpdate,
    ExpenseCategory as ExpenseCategorySchema, ExpenseCategoryCreate,
    Wishlist as WishlistSchema, WishlistCreate, WishlistUpdate,
    Budget as BudgetSchema, BudgetCreate, BudgetUpdate
)
from crud import (
    # User CRUD
    get_user, get_users, create_user, update_user, delete_user,
    # Category CRUD
    get_category, get_categories, create_category, update_category, delete_category,
    # Expense CRUD
    get_expense, get_expenses, create_expense, update_expense, delete_expense,
    # ExpenseCategory CRUD
    add_expense_category, remove_expense_category,
    # Wishlist CRUD
    get_wishlist_item, get_wishlist_items, create_wishlist_item, update_wishlist_item, delete_wishlist_item,
    # Budget CRUD
    get_budget, get_budgets, create_budget, update_budget, delete_budget,
    # Analytics
    get_total_expenses, get_expenses_by_category
)

# Database tables are created by Docker scripts
# No need to create tables here - they already exist

# Create FastAPI app
app = FastAPI(
    title="Expense Tracking API",
    description="A FastAPI application for tracking expenses, categories, wishlist, and budgets",
    version="1.0.0"
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0"]  # In production, specify your domain
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Expense Tracking API", "version": "1.0.0"}

# Security middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Rate limiting
    try:
        rate_limit_middleware(request, max_requests=100, window_seconds=60)
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
    
    # Log suspicious requests
    if any(suspicious in request.url.path.lower() for suspicious in ['../', '..\\', 'admin', 'config']):
        log_security_event("SUSPICIOUS_PATH", f"Path: {request.url.path}", request.client.host)
    
    response = await call_next(request)
    return response

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# User endpoints
@app.get("/users/", response_model=List[UserSchema])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all users"""
    users = get_users(db, skip=skip, limit=limit)
    return users

@app.get("/users/{user_id}", response_model=UserSchema)
def read_user(user_id: UUID, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    user = get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    return create_user(db=db, user=user)

@app.put("/users/{user_id}", response_model=UserSchema)
def update_existing_user(user_id: UUID, user: UserUpdate, db: Session = Depends(get_db)):
    """Update an existing user"""
    updated_user = update_user(db=db, user_id=user_id, user=user)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.delete("/users/{user_id}")
def delete_existing_user(user_id: UUID, db: Session = Depends(get_db)):
    """Delete a user"""
    success = delete_user(db=db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Category endpoints
@app.get("/categories/", response_model=List[CategorySchema])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all categories"""
    categories = get_categories(db, skip=skip, limit=limit)
    return categories

@app.get("/categories/{category_id}", response_model=CategorySchema)
def read_category(category_id: UUID, db: Session = Depends(get_db)):
    """Get a specific category by ID"""
    category = get_category(db, category_id=category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.post("/categories/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
def create_new_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    return create_category(db=db, category=category)

@app.put("/categories/{category_id}", response_model=CategorySchema)
def update_existing_category(category_id: UUID, category: CategoryUpdate, db: Session = Depends(get_db)):
    """Update an existing category"""
    updated_category = update_category(db=db, category_id=category_id, category=category)
    if updated_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category

@app.delete("/categories/{category_id}")
def delete_existing_category(category_id: UUID, db: Session = Depends(get_db)):
    """Delete a category"""
    success = delete_category(db=db, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Expense endpoints
@app.get("/expenses/", response_model=List[ExpenseSchema])
def read_expenses(
    skip: int = 0, 
    limit: int = 100, 
    user_id: Optional[UUID] = None,
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Get all expenses, optionally filtered by user or category"""
    expenses = get_expenses(db, skip=skip, limit=limit, user_id=user_id, category_id=category_id)
    return expenses

@app.get("/expenses/{expense_id}", response_model=ExpenseSchema)
def read_expense(expense_id: UUID, db: Session = Depends(get_db)):
    """Get a specific expense by ID"""
    expense = get_expense(db, expense_id=expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@app.post("/expenses/", response_model=ExpenseSchema, status_code=status.HTTP_201_CREATED)
def create_new_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense"""
    return create_expense(db=db, expense=expense)

@app.put("/expenses/{expense_id}", response_model=ExpenseSchema)
def update_existing_expense(expense_id: UUID, expense: ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an existing expense"""
    updated_expense = update_expense(db=db, expense_id=expense_id, expense=expense)
    if updated_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated_expense

@app.delete("/expenses/{expense_id}")
def delete_existing_expense(expense_id: UUID, db: Session = Depends(get_db)):
    """Delete an expense"""
    success = delete_expense(db=db, expense_id=expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ExpenseCategory endpoints
@app.post("/expenses/{expense_id}/categories/{category_id}", response_model=ExpenseCategorySchema)
def add_category_to_expense(expense_id: UUID, category_id: UUID, db: Session = Depends(get_db)):
    """Add a category to an expense"""
    return add_expense_category(db=db, expense_id=expense_id, category_id=category_id)

@app.delete("/expenses/{expense_id}/categories/{category_id}")
def remove_category_from_expense(expense_id: UUID, category_id: UUID, db: Session = Depends(get_db)):
    """Remove a category from an expense"""
    success = remove_expense_category(db=db, expense_id=expense_id, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense-category relationship not found")
    return {"message": "Category removed from expense successfully"}

# Wishlist endpoints
@app.get("/wishlist/", response_model=List[WishlistSchema])
def read_wishlist_items(
    skip: int = 0, 
    limit: int = 100, 
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Get all wishlist items, optionally filtered by user"""
    wishlist_items = get_wishlist_items(db, skip=skip, limit=limit, user_id=user_id)
    return wishlist_items

@app.get("/wishlist/{wish_id}", response_model=WishlistSchema)
def read_wishlist_item(wish_id: UUID, db: Session = Depends(get_db)):
    """Get a specific wishlist item by ID"""
    wishlist_item = get_wishlist_item(db, wish_id=wish_id)
    if wishlist_item is None:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return wishlist_item

@app.post("/wishlist/", response_model=WishlistSchema, status_code=status.HTTP_201_CREATED)
def create_new_wishlist_item(wishlist_item: WishlistCreate, db: Session = Depends(get_db)):
    """Create a new wishlist item"""
    return create_wishlist_item(db=db, wishlist_item=wishlist_item)

@app.put("/wishlist/{wish_id}", response_model=WishlistSchema)
def update_existing_wishlist_item(wish_id: UUID, wishlist_item: WishlistUpdate, db: Session = Depends(get_db)):
    """Update an existing wishlist item"""
    updated_wishlist_item = update_wishlist_item(db=db, wish_id=wish_id, wishlist_item=wishlist_item)
    if updated_wishlist_item is None:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return updated_wishlist_item

@app.delete("/wishlist/{wish_id}")
def delete_existing_wishlist_item(wish_id: UUID, db: Session = Depends(get_db)):
    """Delete a wishlist item"""
    success = delete_wishlist_item(db=db, wish_id=wish_id)
    if not success:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"message": "Wishlist item deleted successfully"}

# Budget endpoints
@app.get("/budgets/", response_model=List[BudgetSchema])
def read_budgets(
    skip: int = 0, 
    limit: int = 100, 
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Get all budgets, optionally filtered by user"""
    budgets = get_budgets(db, skip=skip, limit=limit, user_id=user_id)
    return budgets

@app.get("/budgets/{budget_id}", response_model=BudgetSchema)
def read_budget(budget_id: UUID, db: Session = Depends(get_db)):
    """Get a specific budget by ID"""
    budget = get_budget(db, budget_id=budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@app.post("/budgets/", response_model=BudgetSchema, status_code=status.HTTP_201_CREATED)
def create_new_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    """Create a new budget"""
    return create_budget(db=db, budget=budget)

@app.put("/budgets/{budget_id}", response_model=BudgetSchema)
def update_existing_budget(budget_id: UUID, budget: BudgetUpdate, db: Session = Depends(get_db)):
    """Update an existing budget"""
    updated_budget = update_budget(db=db, budget_id=budget_id, budget=budget)
    if updated_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return updated_budget

@app.delete("/budgets/{budget_id}")
def delete_existing_budget(budget_id: UUID, db: Session = Depends(get_db)):
    """Delete a budget"""
    success = delete_budget(db=db, budget_id=budget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted successfully"}

# Analytics endpoints
@app.get("/analytics/total")
def get_total_expenses_analytics(
    user_id: Optional[UUID] = None, 
    category_id: Optional[UUID] = None, 
    db: Session = Depends(get_db)
):
    """Get total expenses, optionally filtered by user or category"""
    total = get_total_expenses(db, user_id=user_id, category_id=category_id)
    return {"total": total}

@app.get("/analytics/by-category")
def get_expenses_by_category_analytics(
    user_id: Optional[UUID] = None, 
    db: Session = Depends(get_db)
):
    """Get expenses grouped by category"""
    results = get_expenses_by_category(db, user_id=user_id)
    return [{"category": name, "total": float(total)} for name, total in results]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)