# Generated by Django 4.1.5 on 2023-05-06 14:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('habit_tracker', '0008_alter_habittracker_month_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='habit',
            name='month',
        ),
        migrations.RemoveField(
            model_name='habit',
            name='year',
        ),
    ]
