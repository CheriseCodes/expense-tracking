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
    new_categories = expense_data.pop('new_categories', [])
    
    db_expense = Expense(**expense_data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Create new categories and link them to the expense
    for category_name in new_categories:
        if category_name and category_name.strip():
            category = get_or_create_category(db, category_name.strip())
            add_expense_category(db, db_expense.expense_id, category.category_id)
    
    return db_expense

def update_expense(db: Session, expense_id: UUID, expense: ExpenseUpdate) -> Optional[Expense]:
    db_expense = get_expense(db, expense_id)
    if db_expense:
        update_data = expense.dict(exclude_unset=True)
        
        # Extract new categories before updating expense
        new_categories = update_data.pop('new_categories', [])
        
        for field, value in update_data.items():
            setattr(db_expense, field, value)
        
        db.commit()
        db.refresh(db_expense)
        
        # Create new categories and link them to the expense
        for category_name in new_categories:
            if category_name and category_name.strip():
                category = get_or_create_category(db, category_name.strip())
                add_expense_category(db, db_expense.expense_id, category.category_id)
        
    return db_expense

def delete_expense(db: Session, expense_id: UUID) -> bool:
    db_expense = get_expense(db, expense_id)
    if db_expense:
        db.delete(db_expense)
        db.commit()
        return True
    return False

# ExpenseCategory CRUD operations
def add_expense_category(db: Session, expense_id: UUID, category_id: UUID) -> ExpenseCategory:
    db_expense_category = ExpenseCategory(expense_id=expense_id, category_id=category_id)
    db.add(db_expense_category)
    db.commit()
    return db_expense_category

def remove_expense_category(db: Session, expense_id: UUID, category_id: UUID) -> bool:
    db_expense_category = db.query(ExpenseCategory).filter(
        ExpenseCategory.expense_id == expense_id,
        ExpenseCategory.category_id == category_id
    ).first()
    if db_expense_category:
        db.delete(db_expense_category)
        db.commit()
        return True
    return False

# Wishlist CRUD operations
def get_wishlist_item(db: Session, wish_id: UUID) -> Optional[Wishlist]:
    return db.query(Wishlist).filter(Wishlist.wish_id == wish_id).first()

def get_wishlist_items(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[UUID] = None
) -> List[Wishlist]:
    query = db.query(Wishlist)
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
    db_budget = Budget(**budget.dict())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def update_budget(db: Session, budget_id: UUID, budget: BudgetUpdate) -> Optional[Budget]:
    db_budget = get_budget(db, budget_id)
    if db_budget:
        update_data = budget.dict(exclude_unset=True)
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

def get_expenses_by_category(db: Session, user_id: Optional[UUID] = None) -> List[dict]:
    query = db.query(
        Category.category_name,
        func.sum(Expense.price).label('total')
    ).join(ExpenseCategory).join(Expense)
    
    if user_id:
        query = query.filter(Expense.user_id == user_id)
    
    return query.group_by(Category.category_id, Category.category_name).all()