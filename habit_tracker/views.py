from django.shortcuts import render

def index(request):
    """
    View that renders the main page
    """

    return render(request, 'habit_tracker/index.html')
