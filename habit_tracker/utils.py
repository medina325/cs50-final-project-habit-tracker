import re
import calendar
import itertools
from django.core.paginator import Paginator

def is_username_an_email(username: str) -> bool:
    """
    Returns True if `username` matches the email regex, False otherwise
    """
    
    email_pattern = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}$'
    return bool(re.match(email_pattern, username))

def get_week(year: int, month: int, week_number: int):
    """
    Utility that paginates a month's dates, to emulate the behaviour of a "week
    generator", where `week_number` is the page number, behaving as the week
    number inside a month (starting from 1).
    """
    
    month_weeks = calendar.Calendar().monthdatescalendar(year, month)    
    dates = list(itertools.chain(*month_weeks))
    p = Paginator(dates, 7)
    
    return p.get_page(week_number)
