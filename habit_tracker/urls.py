from django.urls import path

from . import views

urlpatterns = [
    path('<int:year>/<int:month>', views.index, name='index'),
    path('', views.index, name='index'),
    path('create_habit', views.create_habit, name='create_habit'),
    
    path('login', views.login_view, name='login'),
    path('register', views.register, name='register'),
    path('logout', views.logout_view, name='logout'),
]
