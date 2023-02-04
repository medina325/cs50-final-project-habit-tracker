from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create_habit', views.create_habit, name='create_habit')
]