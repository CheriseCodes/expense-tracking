from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from models import User, Category, Expense, ExpenseCategory, Wishlist, Budget
from schemas import (
    UserCreate, UserUpdate, CategoryCreate, CategoryUpdate, 
    ExpenseCreate, ExpenseUpdate, WishlistCreate, WishlistUpdate,
    BudgetCreate, BudgetUpdate
)
from sqlalchemy import func
from uuid import UUID
from security import sanitize_input, validate_uuid, validate_numeric_range, log_security_event
from datetime import date, datetime, timedelta
import calendar

def calculate_budget_dates(timeframe_type: str, timeframe_interval: Optional[int], recurring_start_date: Optional[date] = None) -> tuple[date, date]:
    """Calculate start and end dates for a budget based on timeframe type and interval"""
    today = date.today()
    
    if timeframe_type == 'custom':
        # For custom, dates are provided directly
        return recurring_start_date, recurring_start_date  # This will be overridden by the actual dates
    
    # For recurring budgets, calculate based on recurring start date
    if recurring_start_date is None:
        # Default to January 1st of current year
        recurring_start_date = date(today.year, 1, 1)
    
    if timeframe_type == 'yearly':
        # Calculate the current year period based on recurring start date
        years_since_target = (today.year - recurring_start_date.year) // timeframe_interval
        period_start = recurring_start_date.replace(year=recurring_start_date.year + (years_since_target * timeframe_interval))
        period_end = period_start.replace(year=period_start.year + timeframe_interval) - timedelta(days=1)
        
    elif timeframe_type == 'monthly':
        # Calculate the current month period based on recurring start date
        months_since_target = ((today.year - recurring_start_date.year) * 12 + (today.month - recurring_start_date.month)) // timeframe_interval
        period_start = recurring_start_date.replace(
            year=recurring_start_date.year + ((recurring_start_date.month - 1 + (months_since_target * timeframe_interval)) // 12),
            month=((recurring_start_date.month - 1 + (months_since_target * timeframe_interval)) % 12) + 1
        )
        
        # Calculate end date
        end_month = ((period_start.month - 1 + timeframe_interval) % 12) + 1
        end_year = period_start.year + ((period_start.month - 1 + timeframe_interval) // 12)
        period_end = date(end_year, end_month, 1) - timedelta(days=1)
        
    elif timeframe_type == 'weekly':
        # Calculate the current week period based on recurring start date
        days_since_target = (today - recurring_start_date).days
        weeks_since_target = days_since_target // (7 * timeframe_interval)
        period_start = recurring_start_date + timedelta(weeks=weeks_since_target * timeframe_interval)
        period_end = period_start + timedelta(weeks=timeframe_interval) - timedelta(days=1)
        
    else:
        raise ValueError(f"Invalid timeframe type: {timeframe_type}")
    
    return period_start, period_end

def get_current_budget_period(budget: Budget) -> tuple[date, date]:
    """Get the current budget period dates for a recurring budget"""
    if budget.timeframe_type == 'custom':
        return budget.start_date, budget.end_date
    
    return calculate_budget_dates(
        budget.timeframe_type, 
        budget.timeframe_interval, 
        budget.recurring_start_date
    )

# User CRUD operations
def get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    # Sanitize input
    user_data = user.dict()
    user_data['username'] = sanitize_input(user_data['username'])
    user_data['email'] = sanitize_input(user_data['email'])
    
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: UUID, user: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: UUID) -> bool:
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# Category CRUD operations
def get_category(db: Session, category_id: UUID) -> Optional[Category]:
    return db.query(Category).filter(Category.category_id == category_id).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
    return db.query(Category).offset(skip).limit(limit).all()

def get_category_by_name(db: Session, category_name: str) -> Optional[Category]:
    return db.query(Category).filter(Category.category_name == category_name).first()

def get_or_create_category(db: Session, category_name: str) -> Category:
    """Get existing category by name or create a new one"""
    # Sanitize input
    sanitized_name = sanitize_input(category_name.strip())
    
    # Check if category already exists
    existing_category = get_category_by_name(db, sanitized_name)
    if existing_category:
        return existing_category
    
    # Create new category
    db_category = Category(category_name=sanitized_name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def create_category(db: Session, category: CategoryCreate) -> Category:
    # Sanitize input
    category_data = category.dict()
    category_data['category_name'] = sanitize_input(category_data['category_name'])
    
    db_category = Category(**category_data)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: UUID, category: CategoryUpdate) -> Optional[Category]:
    db_category = get_category(db, category_id)
    if db_category:
        update_data = category.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_category, field, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: UUID) -> bool:
    db_category = get_category(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False

# Expense CRUD operations
def get_expense(db: Session, expense_id: UUID) -> Optional[Expense]:
    return db.query(Expense).options(joinedload(Expense.categories)).filter(Expense.expense_id == expense_id).first()

def get_expenses(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[UUID] = None,
    category_id: Optional[UUID] = None
) -> List[Expense]:
    query = db.query(Expense).options(joinedload(Expense.categories))
    if user_id:
        query = query.filter(Expense.user_id == user_id)
    if category_id:
        query = query.join(ExpenseCategory).filter(ExpenseCategory.category_id == category_id)
    return query.order_by(desc(Expense.date_purchased)).offset(skip).limit(limit).all()

def create_expense(db: Session, expense: ExpenseCreate) -> Expense:
    # Sanitize input
    expense_data = expense.dict()
    expense_data['item'] = sanitize_input(expense_data['item'])
    expense_data['vendor'] = sanitize_input(expense_data['vendor'])
    if expense_data.get('payment_method'):
        expense_data['payment_method'] = sanitize_input(expense_data['payment_method'])
    if expense_data.get('notes'):
        expense_data['notes'] = sanitize_input(expense_data['notes'])
    
    # Validate numeric values
    if not validate_numeric_range(expense_data['price']):
        raise ValueError("Price must be between 0 and 999999.99")
    
    # Extract new categories before creating expense
    new_categories = expense_data.pop('new_categories', []) or []
    
    db_expense = Expense(**expense_data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Create new categories and link them to the expense
    for category_name in new_categories:
        if category_name and category_name.strip():
            category = get_or_create_category(db, category_name.strip())
            add_expense_category(db, db_expense.expense_id, category.category_id)
            # Recalculate budgets for this category
            recalculate_budgets_for_expense(db, db_expense.user_id, category.category_id)
    
    return db_expense

def update_expense(db: Session, expense_id: UUID, expense: ExpenseUpdate) -> Optional[Expense]:
    db_expense = get_expense(db, expense_id)
    if db_expense:
        update_data = expense.dict(exclude_unset=True)
        
        # Extract new categories before updating expense
        new_categories = update_data.pop('new_categories', []) or []
        
        # Get existing categories before updating
        existing_categories = [ec.category_id for ec in db_expense.expense_categories]
        
        for field, value in update_data.items():
            setattr(db_expense, field, value)
        
        db.commit()
        db.refresh(db_expense)
        
        # Recalculate budgets for existing categories (in case amount changed)
        for category_id in existing_categories:
            recalculate_budgets_for_expense(db, db_expense.user_id, category_id)
        
        # Create new categories and link them to the expense
        for category_name in new_categories:
            if category_name and category_name.strip():
                category = get_or_create_category(db, category_name.strip())
                add_expense_category(db, db_expense.expense_id, category.category_id)
                # Recalculate budgets for this category
                recalculate_budgets_for_expense(db, db_expense.user_id, category.category_id)
        
    return db_expense

def delete_expense(db: Session, expense_id: UUID) -> bool:
    db_expense = get_expense(db, expense_id)
    if db_expense:
        # Get categories before deleting the expense
        categories_to_recalculate = [ec.category_id for ec in db_expense.expense_categories]
        user_id = db_expense.user_id
        
        db.delete(db_expense)
        db.commit()
        
        # Recalculate budgets for all categories that were associated with this expense
        for category_id in categories_to_recalculate:
            recalculate_budgets_for_expense(db, user_id, category_id)
        
        return True
    return False

# ExpenseCategory CRUD operations
def add_expense_category(db: Session, expense_id: UUID, category_id: UUID) -> ExpenseCategory:
    db_expense_category = ExpenseCategory(expense_id=expense_id, category_id=category_id)
    db.add(db_expense_category)
    db.commit()
    
    # Get the expense to find the user_id
    expense = get_expense(db, expense_id)
    if expense:
        # Recalculate budgets for this category
        recalculate_budgets_for_expense(db, expense.user_id, category_id)
    
    return db_expense_category

def remove_expense_category(db: Session, expense_id: UUID, category_id: UUID) -> bool:
    db_expense_category = db.query(ExpenseCategory).filter(
        ExpenseCategory.expense_id == expense_id,
        ExpenseCategory.category_id == category_id
    ).first()
    if db_expense_category:
        # Get the expense to find the user_id before deleting the relationship
        expense = get_expense(db, expense_id)
        user_id = expense.user_id if expense else None
        
        db.delete(db_expense_category)
        db.commit()
        
        # Recalculate budgets for this category
        if user_id:
            recalculate_budgets_for_expense(db, user_id, category_id)
        
        return True
    return False

def recalculate_budgets_for_expense(db: Session, user_id: UUID, category_id: UUID) -> None:
    """Recalculate budgets when an expense is created or updated"""
    # Find all budgets for this user and category
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category_id == category_id
    ).all()
    
    for budget in budgets:
        # Get current budget period dates
        current_start, current_end = get_current_budget_period(budget)
        
        # Recalculate current spend for the current period
        current_spend = get_total_expenses_in_date_range(
            db, 
            user_id=user_id, 
            category_id=category_id, 
            start_date=current_start, 
            end_date=current_end
        )
        
        budget.current_spend = current_spend
        budget.is_over_max = (budget.current_spend + budget.future_spend) > budget.max_spend
    
    db.commit()

# Wishlist CRUD operations
def get_wishlist_item(db: Session, wish_id: UUID) -> Optional[Wishlist]:
    return db.query(Wishlist).options(joinedload(Wishlist.user)).filter(Wishlist.wish_id == wish_id).first()

def get_wishlist_items(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[UUID] = None
) -> List[Wishlist]:
    query = db.query(Wishlist).options(joinedload(Wishlist.user))
    if user_id:
        query = query.filter(Wishlist.user_id == user_id)
    return query.order_by(Wishlist.priority).offset(skip).limit(limit).all()

def create_wishlist_item(db: Session, wishlist_item: WishlistCreate) -> Wishlist:
    db_wishlist_item = Wishlist(**wishlist_item.dict())
    db.add(db_wishlist_item)
    db.commit()
    db.refresh(db_wishlist_item)
    return db_wishlist_item

def update_wishlist_item(db: Session, wish_id: UUID, wishlist_item: WishlistUpdate) -> Optional[Wishlist]:
    db_wishlist_item = get_wishlist_item(db, wish_id)
    if db_wishlist_item:
        update_data = wishlist_item.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_wishlist_item, field, value)
        db.commit()
        db.refresh(db_wishlist_item)
    return db_wishlist_item

def delete_wishlist_item(db: Session, wish_id: UUID) -> bool:
    db_wishlist_item = get_wishlist_item(db, wish_id)
    if db_wishlist_item:
        db.delete(db_wishlist_item)
        db.commit()
        return True
    return False

# Budget CRUD operations
def get_budget(db: Session, budget_id: UUID) -> Optional[Budget]:
    return db.query(Budget).filter(Budget.budget_id == budget_id).first()

def get_budgets(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[UUID] = None
) -> List[Budget]:
    query = db.query(Budget)
    if user_id:
        query = query.filter(Budget.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_budget(db: Session, budget: BudgetCreate) -> Budget:
    # Calculate dates based on timeframe type
    if budget.timeframe_type == 'custom':
        start_date = budget.start_date
        end_date = budget.end_date
    else:
        start_date, end_date = calculate_budget_dates(
            budget.timeframe_type, 
            budget.timeframe_interval, 
            budget.recurring_start_date
        )
    
    # Calculate current spend from existing expenses in this category for this user within the date range
    current_spend = get_total_expenses_in_date_range(db, user_id=budget.user_id, category_id=budget.category_id, start_date=start_date, end_date=end_date)
    
    # For now, set future_spend to 0 (this could be enhanced later)
    future_spend = 0.0
    
    # Calculate if over max
    total_spend = current_spend + future_spend
    is_over_max = total_spend > budget.max_spend
    
    # Create budget with calculated values
    budget_data = budget.dict()
    budget_data['current_spend'] = current_spend
    budget_data['future_spend'] = future_spend
    budget_data['is_over_max'] = is_over_max
    budget_data['start_date'] = start_date
    budget_data['end_date'] = end_date
    
    db_budget = Budget(**budget_data)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def update_budget(db: Session, budget_id: UUID, budget: BudgetUpdate) -> Optional[Budget]:
    db_budget = get_budget(db, budget_id)
    if db_budget:
        update_data = budget.dict(exclude_unset=True)
        
        # Recalculate current spend if category or user changed
        if 'category_id' in update_data or 'user_id' in update_data:
            user_id = update_data.get('user_id', db_budget.user_id)
            category_id = update_data.get('category_id', db_budget.category_id)
            current_spend = get_total_expenses(db, user_id=user_id, category_id=category_id)
            update_data['current_spend'] = current_spend
        
        # Recalculate is_over_max if max_spend changed
        if 'max_spend' in update_data:
            current_spend = update_data.get('current_spend', db_budget.current_spend)
            future_spend = update_data.get('future_spend', db_budget.future_spend)
            total_spend = current_spend + future_spend
            update_data['is_over_max'] = total_spend > update_data['max_spend']
        
        for field, value in update_data.items():
            setattr(db_budget, field, value)
        
        db.commit()
        db.refresh(db_budget)
    return db_budget

def delete_budget(db: Session, budget_id: UUID) -> bool:
    db_budget = get_budget(db, budget_id)
    if db_budget:
        db.delete(db_budget)
        db.commit()
        return True
    return False

# Analytics functions
def get_total_expenses(db: Session, user_id: Optional[UUID] = None, category_id: Optional[UUID] = None) -> float:
    query = db.query(Expense)
    if user_id:
        query = query.filter(Expense.user_id == user_id)
    if category_id:
        query = query.join(ExpenseCategory).filter(ExpenseCategory.category_id == category_id)
    result = query.with_entities(func.sum(Expense.price)).scalar()
    return result or 0.0

def get_total_expenses_in_date_range(db: Session, user_id: Optional[UUID] = None, category_id: Optional[UUID] = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> float:
    """Calculate total expenses within a specific date range"""
    query = db.query(Expense)
    if user_id:
        query = query.filter(Expense.user_id == user_id)
    if category_id:
        query = query.join(ExpenseCategory).filter(ExpenseCategory.category_id == category_id)
    if start_date:
        query = query.filter(Expense.date_purchased >= start_date)
    if end_date:
        query = query.filter(Expense.date_purchased <= end_date)
    result = query.with_entities(func.sum(Expense.price)).scalar()
    return result or 0.0

def get_expenses_by_category(db: Session, user_id: Optional[UUID] = None) -> List[dict]:
    """Aggregate expenses by category with explicit join path to avoid ambiguity."""
    query = (
        db.query(
            Category.category_name,
            func.sum(Expense.price).label('total')
        )
        .select_from(Category)
        .join(ExpenseCategory, ExpenseCategory.category_id == Category.category_id)
        .join(Expense, Expense.expense_id == ExpenseCategory.expense_id)
    )

    if user_id:
        query = query.filter(Expense.user_id == user_id)

    return query.group_by(Category.category_id, Category.category_name).all()