import re
import calendar
import itertools
from datetime import date as datetime_date

from django.core.paginator import Paginator
from django.db import IntegrityError

from .models import Habit, TrackedDate
from .enums import HabitState

def is_username_an_email(username: str) -> bool:
    """
    Returns True if `username` matches the email regex, False otherwise
    """
    
    email_pattern = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}$'
    return bool(re.match(email_pattern, username))

def get_week(year: int, month: int, week_number: int = 1):
    """
    Utility that paginates a month's dates, to emulate the behaviour of a "week
    generator", where `week_number` is the page number, behaving as the week
    number inside a month (starting from 1).
    """
    
    month_weeks = calendar.Calendar().monthdatescalendar(year, month)    
    dates = list(itertools.chain(*month_weeks))
    p = Paginator(dates, 7)
    
    return p.get_page(week_number)

def toggle_tracked_date(habit_id: int, state: HabitState, date: str):
    if not HabitState.is_valid_key(state):
        raise ValueError(f'No status called {state}')

    habit = Habit.objects.get(id=habit_id)

    if state == HabitState.TRACKED:
        untrack_date(habit, date)
    elif state == HabitState.NOT_TRACKED:
        track_date(habit, date)

def untrack_date(habit: Habit, date: str):
    try:
        tracked_date = TrackedDate.objects.get(
            habit=habit,
            date=datetime_date.fromisoformat(date)
        )
        tracked_date.delete()
    except TrackedDate.DoesNotExist:
            raise IntegrityError('Something went wrong, perhaps there is no habit tracked for this date?')

def track_date(habit: Habit, date: str):
    tracked_date = TrackedDate(habit=habit,
                        date=datetime_date.fromisoformat(date),
                        value='yes')
    try:
        tracked_date.save()
    except IntegrityError:
        raise IntegrityError('Something went wrong, perhaps the habit was already tracked for this date?')
