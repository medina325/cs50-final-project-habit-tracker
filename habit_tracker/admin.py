from django.contrib import admin

from .models import User, HabitTracker, Habit, TrackedDate

admin.site.register(User)
admin.site.register(HabitTracker)
admin.site.register(Habit)
admin.site.register(TrackedDate)