import json
from datetime import date

from django.shortcuts import render
from django.urls import reverse
from django.http import JsonResponse, HttpResponseRedirect
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from .models import User, HabitTracker, Habit
from .utils import is_username_an_email, get_week

def index(request, year=date.today().year, month=date.today().month):
    """
    View that renders main page containing a habit tracker.
    
    Its URL may contain a year and a month, specifying which habit tracker
    to query from the database. In case there's no year or month specified,
    a habit tracker for the current year and month will be returned.
    """
    
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))
    
    week_number = request.GET.get('week', 1)
    week = get_week(year, month, week_number)

    habit_tracker = (
        request.user.habit_trackers
        .filter(year=year, month=month)
        .first()
    )
    
    return render(request, 'habit_tracker/index.html', {
        'year': year,
        'month': month,
        'week': week,
        'active': habit_tracker.active if habit_tracker else True,
        'habits': [
            {'name': habit.name, 'tracked_dates': [date(2023, 2, 10)]}
            for habit in habit_tracker.habits.all()
        ] if habit_tracker else [],
    })

@login_required
def create_habit(request):
    if request.method == 'POST':
        data = json.loads(request.body)['data']

        # TODO Validate form
        
        habit_tracker_data = {
            'user': request.user,
            'month': data['month'],
            'year': data['year']
        }
        
        habit_tracker = HabitTracker.objects.filter(**habit_tracker_data).first()

        if not habit_tracker:
            new_habit = HabitTracker(**habit_tracker_data)
            new_habit.save()
            
        habit = Habit(user=request.user,
                      habit_tracker=habit_tracker,
                      name=data['name'])
        habit.save()

        return JsonResponse({
            "message": "New habit added",
        }, status=201)
    
    return JsonResponse({"error": "Method should be POST"}, status=405)

def get_habit(request):
    pass

def get_habits(request):
    pass

def update_habit(request):
    pass

def delete_habit(request):
    pass
# --------------------------------------------------------- users app ------------------------------------------------------------------------------------------------------

def register(request):
    if request.method == "POST":
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "habit_tracker/login.html", {
                "message": "Passwords must match"
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
                "message": "Username already taken"
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
            'message': 'Invalid credentials. Username/E-mail or password incorrect'
        }, status=401)
        
    return render(request, 'habit_tracker/login.html', status=200)

def logout_view(request):
    logout(request)
    
    return HttpResponseRedirect(reverse('login'))
