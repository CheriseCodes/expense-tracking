from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Date, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False)
    password_hash = Column(String(73), nullable=False)
    role = Column(String(30), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    last_login = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    expenses = relationship("Expense", back_populates="user")
    wishlist_items = relationship("Wishlist", back_populates="user")
    budgets = relationship("Budget", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_name = Column(String, nullable=False)
    
    # Relationships
    expense_categories = relationship("ExpenseCategory", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
    expenses = relationship("Expense", secondary="expense_categories", back_populates="categories", overlaps="expense_categories")

class Expense(Base):
    __tablename__ = "expenses"
    
    expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    item = Column(String, nullable=False)
    vendor = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    date_purchased = Column(Date, nullable=False)
    payment_method = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    expense_categories = relationship("ExpenseCategory", back_populates="expense", overlaps="expenses")
    categories = relationship("Category", secondary="expense_categories", back_populates="expenses", overlaps="expense_categories")

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.expense_id"), primary_key=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.category_id"), primary_key=True)
    
    # Relationships
    expense = relationship("Expense", back_populates="expense_categories", overlaps="categories,expenses")
    category = relationship("Category", back_populates="expense_categories", overlaps="categories,expenses")

class Wishlist(Base):
    __tablename__ = "wishlist"
    
    wish_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    item = Column(String, nullable=False)
    vendor = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    priority = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)  # wished, scheduled, bought
    notes = Column(Text, nullable=True)
    planned_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=True, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="wishlist_items")

class Budget(Base):
    __tablename__ = "budgets"
    
    budget_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.category_id"), nullable=False)
    current_spend = Column(Float, nullable=False)
    future_spend = Column(Float, nullable=False)
    max_spend = Column(Float, nullable=False)
    is_over_max = Column(Boolean, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # New fields for timeframe system
    timeframe_type = Column(String(20), nullable=False)  # yearly, monthly, weekly, custom
    timeframe_interval = Column(Integer, nullable=True)  # number of years/months/weeks (null for custom)
    recurring_start_date = Column(Date, nullable=True)  # reference date for recurring budgets
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")