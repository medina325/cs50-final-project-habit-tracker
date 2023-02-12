import re

def is_username_an_email(username: str) -> bool:
    """
    Returns True if `username` matches the email regex, False otherwise
    """
    
    email_pattern = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}$'
    return bool(re.match(email_pattern, username))
