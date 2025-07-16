"""
Security utilities for the FastAPI application
"""
import time
from typing import Dict, Tuple
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import re
import html

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[str, Tuple[int, float]] = {}

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if not text:
        return text
    
    # HTML escape
    text = html.escape(text)
    
    # Remove potentially dangerous characters
    text = re.sub(r'[<>"\']', '', text)
    
    # Remove SQL injection patterns
    sql_patterns = [
        r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
        r'(\b(OR|AND)\b\s+\d+\s*=\s*\d+)',
        r'(\b(OR|AND)\b\s+\'[^\']*\'\s*=\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\d+\s*LIKE\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\d+\s*IN\s*\([^)]*\))',
        r'(\b(OR|AND)\b\s+\d+\s*BETWEEN\s+\d+\s+AND\s+\d+)',
        r'(\b(OR|AND)\b\s+\d+\s*IS\s+NULL)',
        r'(\b(OR|AND)\b\s+\d+\s*IS\s+NOT\s+NULL)',
        r'(\b(OR|AND)\b\s+\d+\s*EXISTS\s*\([^)]*\))',
        r'(\b(OR|AND)\b\s+\d+\s*NOT\s+EXISTS\s*\([^)]*\))',
        r'(\b(OR|AND)\b\s+\d+\s*IN\s*\([^)]*\))',
        r'(\b(OR|AND)\b\s+\d+\s*NOT\s+IN\s*\([^)]*\))',
        r'(\b(OR|AND)\b\s+\d+\s*LIKE\s*\'[^\']*\')\s+ESCAPE\s+\'[^\']*\'',
        r'(\b(OR|AND)\b\s+\d+\s*REGEXP\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\d+\s*RLIKE\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\d+\s*SOUNDS\s+LIKE\s*\'[^\']*\')',
        r'(\b(OR|AND)\b\s+\d+\s*MATCH\s*\([^)]*\)\s+AGAINST\s*\([^)]*\))',
        r'(\b(OR|AND)\b\s+\d+\s*MATCH\s*\([^)]*\)\s+AGAINST\s*\([^)]*\)\s+IN\s+BOOLEAN\s+MODE)',
        r'(\b(OR|AND)\b\s+\d+\s*MATCH\s*\([^)]*\)\s+AGAINST\s*\([^)]*\)\s+WITH\s+QUERY\s+EXPANSION)',
        r'(\b(OR|AND)\b\s+\d+\s*MATCH\s*\([^)]*\)\s+AGAINST\s*\([^)]*\)\s+IN\s+NATURAL\s+LANGUAGE\s+MODE)',
    ]
    
    for pattern in sql_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text.strip()

def rate_limit_middleware(request: Request, max_requests: int = 100, window_seconds: int = 60):
    """
    Simple rate limiting middleware
    """
    client_ip = request.client.host
    current_time = time.time()
    
    if client_ip in rate_limit_storage:
        request_count, window_start = rate_limit_storage[client_ip]
        
        # Reset window if expired
        if current_time - window_start > window_seconds:
            rate_limit_storage[client_ip] = (1, current_time)
        else:
            # Check if limit exceeded
            if request_count >= max_requests:
                raise HTTPException(
                    status_code=429, 
                    detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds."
                )
            rate_limit_storage[client_ip] = (request_count + 1, window_start)
    else:
        rate_limit_storage[client_ip] = (1, current_time)

def validate_uuid(uuid_string: str) -> bool:
    """
    Validate UUID format
    """
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(uuid_string))

def validate_numeric_range(value: float, min_val: float = 0, max_val: float = 999999.99) -> bool:
    """
    Validate numeric values are within acceptable range
    """
    return min_val <= value <= max_val

def validate_string_length(text: str, max_length: int = 255) -> bool:
    """
    Validate string length
    """
    return len(text) <= max_length if text else True

def log_security_event(event_type: str, details: str, client_ip: str = None):
    """
    Log security events (in production, send to security monitoring system)
    """
    # In production, this should log to a security monitoring system
    print(f"SECURITY EVENT: {event_type} - {details} - IP: {client_ip}") 