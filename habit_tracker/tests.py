from django.test import TestCase, Client
from django.utils import timezone
from django.db import IntegrityError
from django.urls import reverse, reverse_lazy
from .forms import HabitTrackerForm
from .models import User, HabitTracker, Habit, TrackedDate

def create_clients(user, password):
    logged_out_client = Client()
    logged_in_client = Client()
    logged_in_client.login(username=user.username, password=password)

    return logged_in_client, logged_out_client

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

    def test_habit_tracker_check_month_min_values_constraint(self):
        with self.assertRaisesRegex(IntegrityError, r'CHECK constraint failed: check_month_min_max_values'):
            HabitTracker.objects.create(
                user=self.user,
                month=0,
                year=2023
            )
    
    def test_habit_tracker_check_month_max_values_constraint(self):
        with self.assertRaisesRegex(IntegrityError, r'CHECK constraint failed: check_month_min_max_values'):
            HabitTracker.objects.create(
                user=self.user,
                month=13,
                year=2023
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
        password = '1234'
        self.user = User.objects.create_user(username='test_user', email='test@mail.com', password=password)

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
        )

        with self.assertRaisesRegex(IntegrityError, r'UNIQUE constraint failed'):
            Habit.objects.create(
                user=first_habit.user,
                habit_tracker=first_habit.habit_tracker,
                name=first_habit.name,
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

class HabitViewsTestCase(TestCase):
    def setUp(self):
        password = '1234'
        self.user = User.objects.create_user(username='test_user', email='test@mail.com', password=password)
        self.logged_out_client = Client()
        self.logged_in_client = Client()
        self.logged_in_client.login(username=self.user.username, password=password)
        
        # Dependency injection?
        self.habit_tracker = HabitTracker.objects.create(
            user=self.user,
            month=1,
            year=2023
        )
        
        self.create_habit_url = reverse('create_habit')
        self.update_habit_url = reverse('update_habit')

    def test_login_required_create_habit_view(self):
        res = self.logged_out_client.get(self.create_habit_url)
        self.assertEqual(res.status_code, 302)
        self.assertRedirects(
            response=res,
            expected_url=f"{reverse_lazy('login')}?next=/create_habit",
        )
        
    def test_get_create_habit_views_returns_405(self):
        res = self.logged_in_client.get(self.create_habit_url)
        self.assertEqual(res.status_code, 405)
            
    def test_get_update_habit_view_returns_405(self):
        res = self.logged_in_client.get(self.update_habit_url)
        self.assertEqual(res.status_code, 405)
        
    def test_get_delete_habit_view_returns_405(self):
        delete_habit_url = reverse('delete_habit', kwargs={'id': 1})
        res = self.logged_in_client.get(f'{delete_habit_url}')
        self.assertEqual(res.status_code, 405)
        
    def test_post_create_habit_view_returns_201(self):
        data = {
            'name': 'test_habit',
            'year': 2023,
            'month': 1
        }
        res = self.logged_in_client.post(
            self.create_habit_url,
            content_type='application/json',
            data={'data': data}
        )
        
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json().get('message'), f'New habit added')
        self.assertTrue(Habit.objects.filter(name=data['name']).exists())

    def test_post_create_habit_view_with_duplicated_habit_returns_400(self):
        habit_name = 'test_habit'
        for _ in range(2):
            res = self.logged_in_client.post(
                self.create_habit_url,
                content_type='application/json',
                data={
                    'data': {
                        'name': habit_name,
                        'year': 2023,
                        'month': 1
                    }
                }
            )
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json().get('message'), f'Habit {habit_name} already exists')
        
    def test_update_habit_view(self):
        habit = Habit.objects.create(
            user=self.user,
            habit_tracker=self.habit_tracker,
            name='test_habit',
        )

        data = {
            'habit_id': habit.id,
            'old_name': habit.name,
            'new_name': 'habit_test'
        }
        res = self.logged_in_client.post(
            self.update_habit_url,
            content_type='application/json',
            data={'data': data}
        )
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get('message'), f'Habit updated')

        updated_habit = Habit.objects.get(id=habit.id)
        self.assertEqual(updated_habit.name, data['new_name'])
    
    def test_delete_habit_view(self):
        habit = Habit.objects.create(
            user=self.user,
            habit_tracker=self.habit_tracker,
            name='test_habit',
        )
        
        delete_habit_url = reverse('delete_habit', kwargs={'id': habit.id})

        res = self.logged_in_client.post(
            delete_habit_url,
            content_type='application/json'
        )
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get('message'), f'Habit {habit.name} deleted')
        self.assertFalse(Habit.objects.filter(id=habit.id).exists())

    def test_delete_habit_view_with_non_existent_habit(self):
        habit = Habit.objects.create(
            user=self.user,
            habit_tracker=self.habit_tracker,
            name='test_habit',
        )
        
        delete_habit_url = reverse('delete_habit', kwargs={'id': habit.id + 1})

        res = self.logged_in_client.post(
            delete_habit_url,
            content_type='application/json'
        )
        
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json().get('message'), f'Habit not found')

class TrackedDateViewsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test_user', email='test@mail.com', password='1234')
        self.habit_tracker = HabitTracker.objects.create(user=self.user, month=1, year=2023)
        self.habit = Habit.objects.create(
            user=self.user,
            habit_tracker=self.habit_tracker,
            name='test_habit',
        )
        self.logged_in_client, self.logged_out_client = create_clients(self.user, '1234')
        self.create_tracked_date_url = reverse('track_habit')
        self.delete_tracked_date_url = reverse('untrack_habit')
    
    def test_get_create_tracked_date_views_returns_405(self):
        res = self.logged_in_client.get(self.create_tracked_date_url)
        self.assertEqual(res.status_code, 405)

    def test_get_delete_habit_view_returns_405(self):
        res = self.logged_in_client.get(self.delete_tracked_date_url)
        self.assertEqual(res.status_code, 405)
        
    def test_create_tracked_date(self):
        date = timezone.datetime.now().date()
        
        res = self.logged_in_client.post(
            self.create_tracked_date_url,
            content_type='application/json',
            data={
                'data': {
                    'habit_id': self.habit.id,
                    'name': self.habit.name,
                    'date': date
                }
            }
        )
        
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json().get('message'), f'Date {date.isoformat()} tracked')
        self.assertTrue(TrackedDate.objects.filter(habit=self.habit, date=date).exists())
    
    def test_create_tracked_date_in_the_future(self):
        date = timezone.datetime.now().date() + timezone.timedelta(days=5)
        
        res = self.logged_in_client.post(
            self.create_tracked_date_url,
            content_type='application/json',
            data={
                'data': {
                    'habit_id': self.habit.id,
                    'name': self.habit.name,
                    'date': date
                }
            }
        )
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json().get('message'), f'The tracked date is in the future.')
    
    def test_post_create_tracked_date_view_with_duplicated_tracked_date_returns_400(self):
        for _ in range(2):
            res = self.logged_in_client.post(
                self.create_tracked_date_url,
                content_type='application/json',
                data={
                    'data': {
                        'habit_id': self.habit.id,
                        'name': self.habit.name,
                        'date': timezone.datetime.now().date()
                    }
                }
            )
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json().get('message'), 'Something went wrong, perhaps the habit was already tracked for this date?')
    
    def test_delete_tracked_date_view(self):
        tracked_date = TrackedDate.objects.create(habit=self.habit, date=timezone.datetime.now().date())

        res = self.logged_in_client.post(
            self.delete_tracked_date_url,
            content_type='application/json',
            data={
                'data': {
                    'habit_id': self.habit.id,
                    'date': tracked_date.date
                }
            }
        )

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get('message'), f'Habit {self.habit.name} untracked for date {tracked_date.date.isoformat()}')
        self.assertFalse(TrackedDate.objects.filter(id=tracked_date.id).exists())
