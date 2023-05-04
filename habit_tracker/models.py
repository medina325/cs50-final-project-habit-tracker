import calendar
from django.db import models
from datetime import datetime
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from .custom_validators import no_empty_strings
from django.core.exceptions import ValidationError

class User(AbstractUser):
    pass

class HabitTracker(models.Model):
    user = models.ForeignKey('User', related_name='habit_trackers', on_delete=models.CASCADE)

    active = models.BooleanField(default=True)
    month = models.PositiveIntegerField(validators=[
        MinValueValidator(1, message='Month value must be more than or equals to 1.'),
        MaxValueValidator(12, message='Month value must be less than or equals to 12.')
    ])
    year = models.PositiveIntegerField(validators=[
        MaxValueValidator(datetime.now().year)
    ])

    creation_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def month_name(self):
        """
        Property that returns full's month name
        """
        try:
            return calendar.month_name[self.month]
        except IndexError:
            raise ValidationError(f'Month {self.month} does not exist. Only values from 1 to 12 are valid.')

    def serialize(self):
        return {
            'user': self.user.id,
            'active': self.active,
            'month': self.month,
            'month_name': self.month_name,
            'year': self.year
        }

    def __str__(self):
        return f"{self.user.username.capitalize()}'s Habit Tracker for {self.month_name} - {self.year}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'year', 'month'], name='unique_habit_tracker'
            ),
            models.CheckConstraint(
                check=models.Q(month__gte=1) & models.Q(month__lte=12),
                name='check_month_min_max_values'
            ),
        ]

class Habit(models.Model):
    user = models.ForeignKey('User', related_name='habits', on_delete=models.CASCADE)
    habit_tracker = models.ForeignKey('HabitTracker', related_name='habits', on_delete=models.RESTRICT)

    name = models.TextField(validators=[no_empty_strings])
    month = models.PositiveIntegerField(validators=[
        MinValueValidator(1),
        MaxValueValidator(12)
    ])
    year = models.PositiveIntegerField()

    creation_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def capitalized_name(self):
        return self.name.capitalize()

    def serialize(self):
        return {
            'user': self.user.id,
            'name': self.capitalized_name
        }

    def __str__(self):
        return (
            f"{self.user.username}'s {self.name.capitalize()} habit, for the "
            f"month {self.habit_tracker.month_name} and year {self.habit_tracker.year}"
        )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'habit_tracker', 'name'], name='unique_user_habit_per_habit_tracker'
            )
        ]
    
class TrackedDate(models.Model):
    habit = models.ForeignKey('Habit', related_name='tracked_dates', on_delete=models.CASCADE)

    date = models.DateField()
    value = models.TextField()

    creation_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def isoformat(self):
        return self.date.isoformat()

    def serialize(self):
        return {
            'habit': self.habit.id,
            'date': self.date,
            'value': self.value,
        }

    def __str__(self):
        return f"Date {self.date} tracked for the habit {self.habit.capitalized_name}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['date', 'habit'], name='unique_tracking_date_for_habit'
            )
        ]
