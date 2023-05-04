from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError
from .forms import HabitTrackerForm
from .models import User, HabitTracker, Habit, TrackedDate

class HabitTrackerTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('test_user', 'test@mail.com', '1234')        

    def test_habit_tracker_unique_constraint(self):
        first_habit_tracker = HabitTracker.objects.create(user=self.user, month=1, year=2023)

        with self.assertRaisesRegex(IntegrityError, r'UNIQUE constraint failed'):
            HabitTracker.objects.create(
                user=first_habit_tracker.user,
                month=first_habit_tracker.month,
                year=first_habit_tracker.year
            )

    def test_validation_fails_when_habit_tracker_date_is_in_the_future(self):
        current_year = timezone.now().year
        form = HabitTrackerForm(data={'month': 1, 'year': current_year + 1})
        
        self.assertFalse(form.is_valid())
        
        errors = {
            field: exceptions[0].messages[0]
            for field, exceptions in form.errors.as_data().items()
        }
        expected_errors = {
            '__all__': 'The habit tracker is in the future.',
            'year': 'Ensure this value is less than or equal to 2023.',
        }
        self.assertDictEqual(errors, expected_errors)
        
    def test_validation_fails_when_month_is_outside_the_range_from_1_to_12(self):
        year = timezone.now().year
        invalid_months = [0, 13]
        
        expected_errors = [
            'Month value must be more than or equals to 1.',
            'Month value must be less than or equals to 12.'
        ]
        
        for month in invalid_months:
            form = HabitTrackerForm(data={'month': month, 'year': year})
            self.assertFalse(form.is_valid())
            
            errors_dict = form.errors.as_data()
            self.assertTrue('month' in errors_dict)

            if 'month' in errors_dict:
                self.assertIn(errors_dict['month'][0].messages[0], expected_errors)

    def test_validation_succeeds_when_month_is_withing_the_range_from_1_to_12(self):
        for month in range(1, 13):
            form = HabitTrackerForm(data={'month': month, 'year': timezone.now().year-1})
            self.assertTrue(form.is_valid())

class HabitTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('test_user', 'test@mail.com', '1234')        
        self.habit_tracker = HabitTracker.objects.create(
            user=self.user,
            month=1,
            year=2023
        )

    def test_habit_unique_constraint(self):
        first_habit = Habit.objects.create(
            user=self.user,
            habit_tracker=self.habit_tracker,
            name='test_habit',
            month=1,
            year=2023
        )

        with self.assertRaisesRegex(IntegrityError, r'UNIQUE constraint failed'):
            Habit.objects.create(
                user=first_habit.user,
                habit_tracker=first_habit.habit_tracker,
                name=first_habit.name,
                month=first_habit.month + 1, # TODO Remover esse campo
                year=first_habit.year # TODO Remover esse campo
            )

class TrackedDateTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('test_user', 'test@mail.com', '1234')        
        self.habit_tracker = HabitTracker.objects.create(
            user=self.user,
            month=1,
            year=2023
        )
        self.habit = Habit.objects.create(
            user=self.user,
            habit_tracker=self.habit_tracker,
            name='test_habit',
            month=1,
            year=2023
        )

    def test_habit_unique_constraint(self):
        first_tracked_date = TrackedDate.objects.create(
            habit=self.habit,
            date=timezone.datetime(2023, 1, 1),
            value='yes'
        )

        with self.assertRaisesRegex(IntegrityError, r'UNIQUE constraint failed'):
            TrackedDate.objects.create(
                habit=first_tracked_date.habit,
                date=first_tracked_date.date,
                value=first_tracked_date.value
            )
