import json

from django.shortcuts import render
from django.urls import reverse
from django.http import JsonResponse, HttpResponseRedirect
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from .models import User
from .utils import is_username_an_email

def index(request):
    """
    View that renders the main page
    """
    
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    # Load stuff from the user

    return render(request, 'habit_tracker/index.html')

@login_required
def create_habit(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        return JsonResponse({
            "message": "New habit added",
        }, status=201)
    
    return JsonResponse({"error": "Method should be POST"}, status=405)

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
