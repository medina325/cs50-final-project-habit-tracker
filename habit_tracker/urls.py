from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('<int:year>/<int:month>', views.index, name='index'),
    path('create_habit', views.create_habit, name='create_habit'),
    path('update_habit', views.update_habit, name='update_habit'),
    path('delete_habit/<int:id>', views.delete_habit, name='delete_habit'),
    path('track_habit', views.track_habit, name='track_habit'),
    path('untrack_habit', views.untrack_habit, name='untrack_habit'),
    
    path('login', views.login_view, name='login'),
    path('register', views.register, name='register'),
    path('logout', views.logout_view, name='logout'),
]
