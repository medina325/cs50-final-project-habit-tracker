import datetime
from django.forms import ModelForm, ValidationError
from django.utils import timezone
from .models import HabitTracker, Habit, TrackedDate

def is_date_in_the_future(date: datetime):
    return date > timezone.now().date()

def is_month_valid(month: int):
    return 1 <= month <= 12

class HabitTrackerForm(ModelForm):
    class Meta:
        model = HabitTracker
        fields = ['year', 'month']

    def clean(self):
        cleaned_data = super().clean()

        month = cleaned_data.get('month')
        year = cleaned_data.get('year')
        
        if not is_month_valid(month):
            raise ValidationError('Month value must be within the range from 1 to 12.')
        
        habit_tracker_date = timezone.datetime(year, month, 1).date()
        if is_date_in_the_future(habit_tracker_date):
            raise ValidationError('The habit tracker is in the future.')
        
        return cleaned_data

class HabitForm(ModelForm):
    class Meta:
        model = Habit
        fields = ['name']

class TrackedDateForm(ModelForm):
    class Meta:
        model = TrackedDate
        fields = ['date']

    def clean(self):
        cleaned_data = super().clean()

        tracked_date = cleaned_data['date']
        
        if is_date_in_the_future(tracked_date):
            raise ValidationError({'date': 'The tracked date is in the future.'})

        return cleaned_data
