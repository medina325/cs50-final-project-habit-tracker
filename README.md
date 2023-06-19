# CS50's Web Programming with Python and Javascript - Final Project - Habit Tracker

## Summary
- [Introduction](#introduction)
- [Distinctiveness and Complexity](#distinctiveness-and-complexity)
- [Requirements](#requirements)
- [How to Run](#how-to-run)

## Introduction
I started my journey with the CS50's Web course as a undergraduate student. It was the first course I took outside the university and made me learn a lot within a very short time. I managed to deliver every previous project within 6 months, from June to December, however after I landed my first internship in January (in many ways thanks to the knowledge I achieved with this course) and with the final semesters of my undergraduate course upon me, I struggled to finish the final project. Now, more than a year later, here I am with an idea I believe can finally make me finish this course with pride!

The goal for this project, as the title says, is to create a Django website (oh really?) for tracking habits. The idea is to create an easy to use platform, high performant and mobile responsive, for people to be able to track their habits and ultimately be able to reach their goals.

TODO Mention inspirations, books, context


## Distinctiveness and Complexity
This final project's distinctiveness and complexity, in comparasion to the previous ones, is defined by the following features:

- Frontend organization (best practices for html, css and js folder structure)
- Mobile responsiveness
- UI/UX design - to be less amateur than the previous projects
- Backend organization - DRY, SOLID, etc
- Unit and integration tests - TDD
- DevOps (possible to run with docker to ease the installation process)
- Some files I created and their purpose:
    - **static/habit_tracker/css/partials**: every file in this folder is imported in specific templates, e.g. index.css is only used on the index.html template;
    - **static/habit_tracker/favicon**: folder that contains each icon for a specific theme;
    - **static/habit_tracker/js**: folder that contains specific js files for each template (same idea as for the CSS files);
    - **custom_validators.py**: file that contains custom validators used for certains model fields;
    - **utils.py**: utility functions that can be used pretty much anywhere in the habit_tracker app;

## Requirements

- Create a page with a habit tracker table for the current month. In this page the user must be able to:
    - add a new habit
    - remove a habit
    - be able to undo the habit removal after a few seconds
    - shade habit completion for a specific day
    - choose different types of "shading" (yes/no, list of options, numbers, etc.)
    - add a lock for editing the habits (useful after the month is over)
- Create a page that shows useful statistics, such as:
    - habits streak
    - highest habit streak
    - lowest habit streak
- The tracker table must have the same amount of days for the specific month
- The user must be able to filter out habit tracking from previous months, and statistics for previous months
- Docker must be used in order to standardize the way to develop and deploy the application
- Your web application must utilize Django (including at least one model) on the back-end and JavaScript on the front-end
- Your web application must be mobile-responsive

### Optional/Future features:
- setup a minimum streak for goal achievement

## How to Run
TODO
