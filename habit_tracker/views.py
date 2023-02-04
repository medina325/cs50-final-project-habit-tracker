import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


def index(request):
    """
    View that renders the main page
    """

    return render(request, 'habit_tracker/index.html')

# TODO Remover isso aqui com forms e tal
@csrf_exempt
def create_habit(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        return JsonResponse({
            "message": "New habit added",
        }, status=201)
    
    return JsonResponse({"error": "Method should be POST"}, status=400)