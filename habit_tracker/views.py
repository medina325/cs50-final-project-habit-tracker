import json
from datetime import date, datetime

from django.shortcuts import render
from django.urls import reverse, reverse_lazy
from django.http import JsonResponse, HttpResponseRedirect, HttpResponse
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from .forms import HabitTrackerForm, HabitForm, TrackedDateForm
from .models import User, HabitTracker, Habit
from .utils import is_username_an_email, get_week, toggle_tracked_date
from .enums import HabitState

THEMES = ['default', 'purple', 'blue', 'pink', 'green', 'orange']

def index(request, year=date.today().year, month=date.today().month):
    """
    View that renders main page containing a habit tracker.
    
    Its URL may contain a year and a month, specifying which habit tracker
    to query from the database. In case there's no year or month specified,
    a habit tracker for the current year and month will be created.
    """
    
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))
    
    form = HabitTrackerForm(data={'month': month, 'year': year})
    
    if not form.is_valid():
        return HttpResponseRedirect(reverse("index"))

    habit_tracker, _ = HabitTracker.objects.get_or_create(
        user=request.user,
        month=month,
        year=year
    )
    
    habits = [
        {
            'id': habit.id,
            'name': habit.name,
            'tracked_dates': [tracked_date.date for tracked_date in habit.tracked_dates.all()],
            'habit_tracker_id': habit_tracker.id
        }
        for habit in habit_tracker.habits.all()
    ]
    
    week_number = request.GET.get('week', 1)
    week = get_week(year, month, week_number)
    
    return render(request, 'habit_tracker/index.html', {
        'year': year,
        'month': month,
        'week': week,
        'active': habit_tracker.active,
        'habits': habits,
        'user_theme': request.session.get('theme', 'default'),
        'themes': THEMES,
    })

@login_required(login_url=reverse_lazy('login'))
def toggle_habit_tracking(request):
    if request.method != 'POST':
        return HttpResponseRedirect(reverse("index"))
    
    data = json.loads(request.body)
    form = TrackedDateForm(data)

    if not form.is_valid():
        return HttpResponse(form.errors['date'][0], status=400)
    
    try:
        toggle_tracked_date(data['habit_id'], HabitState.get_key_from_value(data['state']), data['date'])
    except Exception as e:
        return HttpResponse(str(e), status=400)
    
    habit = Habit.objects.get(id=data['habit_id'])
    tracked_date = datetime.fromisoformat(data['date']).date()

    return render(request, "habit_tracker/components/tracking_unit.html", {
        'habit': {
            'id': data['habit_id'],
            'name': data['habit'],
            'tracked_dates': [tracked_date.date for tracked_date in habit.tracked_dates.all()]
        },
        'day': tracked_date,
        'month': tracked_date.month
    })

@login_required(login_url=reverse_lazy('login'))
def create_habit(request):
    if request.method != 'POST':
        return HttpResponseRedirect(reverse("index"))

    data = json.loads(request.body)

    form = HabitForm(data)
    if not form.is_valid():
        return HttpResponse(form.errors, status=400)
    
    habit_tracker = HabitTracker.objects.get(
        user=request.user,
        month=data['month'],
        year=data['year']
    )
    
    try:
        habit = Habit.objects.create(
            user=request.user,
            habit_tracker=habit_tracker,
            name=data['name']
        )
    except IntegrityError: # TODO Seria mais interessante utilizar um middleware para capturar esse tipo de erro
        return HttpResponse(f"Habit {data['name']} already exists", status=400)

    response = render(request, 'habit_tracker/components/habit_row.html', {
        'habit': {
            'id': habit.id,
            'name': habit.name,
            'tracked_dates': [tracked_date.date for tracked_date in habit.tracked_dates.all()]
        },
        'week': get_week(int(data['year']), int(data['month'])),
        'month': int(data['month'])
    }, status=201)

    response['HX-Trigger'] = json.dumps({"habitCreated": "New habit added"})
    response['HX-Habit-Name'] = habit.name
    return response

@login_required(login_url=reverse_lazy('login'))
def update_habit(request):
    if not request.method == 'POST':
        return HttpResponseRedirect(reverse("index"))
    
    data = json.loads(request.body)
    
    # TODO Update tracking days
    try:
        habit = Habit.objects.get(id=data['habit_id_update'])

        form = HabitForm(data={'name': data['new_name']})
        if not form.is_valid():
            return HttpResponse(f"New name {data['name']} is not valid", status=400)
            
        habit.name = form.cleaned_data['name']
        habit.save()
    except Habit.DoesNotExist:
        return HttpResponse(f"Habit {data['name']} does not exist", status=404)
    except IntegrityError:
        return JsonResponse({'message': f"Habit {data['new_name']} already exists"}, status=400)

    response = render(request, 'habit_tracker/components/habit_row.html', {
        'habit': {
            'id': habit.id,
            'name': habit.name,
            'tracked_dates': [tracked_date.date for tracked_date in habit.tracked_dates.all()]
        },
        'week': get_week(int(data['year']), int(data['month'])),
        'month': int(data['month'])
    }, status=201)

    response['HX-Trigger'] = json.dumps({"habitUpdated": "Habit updated"})
    return response

@login_required(login_url=reverse_lazy('login'))
def delete_habit(request, id):
    if not request.method == 'POST':
        return JsonResponse({'message': f'Method should be POST'}, status=405)

    try:
        habit = Habit.objects.get(id=id)
        habit.delete()
        
        return JsonResponse({'message': f'Habit {habit.name} deleted'}, status=200)

    except Habit.DoesNotExist:
        return JsonResponse({'message': f'Habit not found'}, status=404)

@login_required(login_url=reverse_lazy('login'))
def store_theme(request):
    if request.method != 'POST':
        return JsonResponse({'message': 'Method should be POST'}, status=405)
    
    data = json.loads(request.body)['data']
    request.session['theme'] = data['theme']
    
    return JsonResponse({"message": f"Theme changed to {data['theme']}"}, status=200)

# --------------------------------------------------------- users app ------------------------------------------------------------------------------------------------------

def register(request):
    if request.method == "POST":
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "habit_tracker/login.html", {
                'message': 'Passwords must match',
                'user_theme': request.session.get('theme', 'default')
            })

        try:
            username = request.POST["username"]
            email = request.POST["email"]
            
            user = User.objects.create_user(username, email, password)
            user.first_name = request.POST['first_name']
            user.last_name = request.POST['last_name']
            user.save()
        except IntegrityError:
            return render(request, "habit_tracker/login.html", {
                'message': 'Username already taken',
                'user_theme': request.session.get('theme', 'default')
            })
        
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    
    return render(request, "habit_tracker/index.html")
    
def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        
        if is_username_an_email(username):
            user = User.objects.filter(email=username).first()
            username = user.username if user else None

        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return HttpResponseRedirect(reverse('index'))
        
        return render(request, 'habit_tracker/login.html', {
            'message': 'Invalid credentials. Username/E-mail or password incorrect',
            'user_theme': request.session.get('theme', 'default')
        }, status=401)
    
    if not request.user.is_authenticated:
        return render(request, 'habit_tracker/login.html', {
            'user_theme': request.session.get('theme', 'default')
        }, status=200)

    return HttpResponseRedirect(reverse('index'))

@login_required(login_url=reverse_lazy('login'))
def logout_view(request):
    logout(request)
    
    return HttpResponseRedirect(reverse('login'))
