import json
from datetime import date

from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.http import JsonResponse, HttpResponseRedirect
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from .models import User, HabitTracker, Habit, TrackedDate
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
    
    habits = [
        {
            'id': habit.id,
            'name': habit.name,
            'tracked_dates': [tracked_date.date for tracked_date in habit.tracked_dates.all()]
        }
        for habit in habit_tracker.habits.all()
    ] if habit_tracker else []
    
    return render(request, 'habit_tracker/index.html', {
        'year': year,
        'month': month,
        'week': week,
        'active': habit_tracker.active if habit_tracker else True,
        'habits': habits
    })

@login_required
@csrf_exempt
def track_habit(request):
    """
    Consiste em filtrar um hábito e relacioná-lo a um TrackedDate
    """
    
    if request.method == 'POST':
        # TODO Validate form
        data = json.loads(request.body)['data']

        tracked_date = date.fromisoformat(data['date'])
        if tracked_date.month != data['month']:
            return JsonResponse({'message': 'date field\'s month should match month field'}, status=400)

        habit = (
            request.user.habits
            .filter(name=data['name'],
                    year=data['year'],
                    month=data['month'])
            .first()
        )
        
        # TODO Check if there's already a tracked date for this date
        # TODO Also add validation on the dataase
        tracked_date = TrackedDate(habit=habit,
                                   date=date.fromisoformat(data['date']),
                                   value='yes')
        tracked_date.save()

        return JsonResponse({"message": f"Date {data['date']} tracked"}, status=201)
    
    return JsonResponse({'message': 'Method should be POST'}, status=405)

@login_required
@csrf_exempt
def untrack_habit(request):
    if request.method == 'POST':
        # TODO Validate form
        data = json.loads(request.body)['data']

        tracked_date = date.fromisoformat(data['date'])
        if tracked_date.month != data['month']:
            return JsonResponse({'message': 'date field\'s month should match month field'}, status=400)

        # TODO Find best way to validate if only one result is returned
        habit = (
            request.user.habits
            .filter(name=data['name'],
                    year=data['year'],
                    month=data['month'])
            .first()
        )

        # TODO Find best way to validate if only one result is returned
        tracked_date = TrackedDate.objects.filter(
            habit=habit,
            date=tracked_date
        ).first()
        tracked_date.delete()

        return JsonResponse({"message": f"Habit {habit.name} untracked for date {data['date']}"}, status=200)
    
    return JsonResponse({'message': 'Method should be POST'}, status=405)

@login_required
def create_habit(request):
    if request.method == 'POST':
        data = json.loads(request.body)['data']

        # TODO Validate form
        
        # TODO use get_or_create
        habit_tracker_data = {
            'user': request.user,
            'month': data['month'],
            'year': data['year']
        }
        
        habit_tracker = HabitTracker.objects.filter(**habit_tracker_data).first()

        if not habit_tracker:
            habit_tracker = HabitTracker(**habit_tracker_data)
            habit_tracker.save()
            
        habit = Habit(user=request.user,
                      habit_tracker=habit_tracker,
                    #   **data)
                      name=data['name'],
                      month=data['month'],
                      year=data['year'])
        try:
            habit.save()
        except IntegrityError:
            return JsonResponse({'message': f"Habit {data['name']} already exists"}, status=400)

        return JsonResponse({'message': 'New habit added', 'data': {'id': habit.id}}, status=201)
    
    return JsonResponse({"message": "Method should be POST"}, status=405)

@login_required
def update_habit(request):
    if not request.method == 'POST':
        return JsonResponse({"message": "Method should be POST"}, status=405)
    
    data = json.loads(request.body)['data']
    # TODO Validate form

    habit_data = {
        'user': request.user,
        'name': data['old_name'],
        'month': data['month'],
        'year': data['year']
    }
    
    # Get record and update it
    habit = Habit.objects.filter(**habit_data).first()

    if not habit:
        return JsonResponse({"message": "Habit not found"}, status=400)

    # TODO Update tracking days
    try:
        habit.name = data['new_name']
        habit.save()
    except IntegrityError:
        return JsonResponse({'message': f"Habit {data['new_name']} already exists"}, status=400)

    return JsonResponse({'message': 'Habit updated'}, status=200)

    
@login_required
def delete_habit(request, id):
    if request.method == 'POST':
        habit = get_object_or_404(Habit, id=id)
        habit.delete()

    return HttpResponseRedirect(request.POST.get('redirect'))

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
