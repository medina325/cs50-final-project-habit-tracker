# CS50's Web Programming with Python and Javascript - Final Project - Habit Tracker

## Summary
- [Introduction](#introduction)
- [Distinctiveness and Complexity](#distinctiveness-and-complexity)
- [Requirements](#requirements)
- [How to Run](#how-to-run)

## Introduction
I started my journey with the CS50's Web course as a undergraduate student. It was the first course I took outside the university and made me learn a lot within a very short time. I managed to deliver every previous project within 6 months, from June to December, however after I landed my first internship in January (in many ways thanks to the knowledge I achieved with this course) and with the final semesters of my undergraduate course upon me, I struggled to finish the final project. Now, more than a year later, here I am with an idea I believe can finally make me finish this course with pride!

The goal for this project, as the title says, is to create a Django website (oh really?) for tracking habits. The idea is to create an easy to use platform, high performant and mobile responsive, for people to be able to track their habits and ultimately be able to reach their goals.

## Distinctiveness and Complexity
This final project's distinctiveness and complexity, in comparasion to the previous ones, is defined by the following features:

### Frontend organization
The frontend organization of the previous projects were not exactly
ideal. There were many unnacessary files, with hard to cryptic usage
of Jinja templating, CSS and JS. Not to mention no atention to
any standards or best practices, resulting in very hard projects
to revisit or contribute.

So, in this regard, the idea for this final project is to be concise and
organized with all frontend code.

### Better layout decisions
The layout for my implementation of the previous projects were
non-existent. There were no ideas of responsive design, animations,
box-model, whatsoever. The results are plain to see in each of the
5 minutes videos I submited previously.

For this project, anything that looks ugly will be taken care of,
that's a promise!

### Backend organization
The backend code, similar to the frontend code, was very mess for
all previous projects. The purpose of the views was not so intuitive,
no idea of CRUDs as well, or form validation of any kind.

Now, the views in this project aims to be as clear as possible. With
docstrings explaining some of its logic in case it's not 100%
intuitive, and every use case properly covered.

### Unit tests - TDD
Speaking of use cases, TDD was used throughly in this project (actually not quite, 
since many of the tests came after the development of the code). For every
model constraint and use cases for the views, there are unit tests
to make sure the views are behaving the way the should.

### Docker to ease installation process
At the beginning of the project, a local sqlite database, as well
as a venv Python virtual environment were being used for the development.

Curiously though, I got a new computer, and setting up the environment
to get back to the project was a little more painful than I'd like
to admit. That's when I decided to use Docker, so that next time,
I or anyone else, want to contribute to this project, the development
environment can be easily set up by simply having Docker (and 
Docker Compose) installed.

---

At the end of the day, the main idea for this project
was to take a little something from every class of the course 
(sunglasses here), since every class offers so much knowledge.

## Requirements

- Create a page with a habit tracker table for a specific month and year. In this page the user must be able to:
    - add habits
    - edit habits
    - delete habits
    - track habits
- Create a page for the user to register or login
- The use should not be able to track habits from the future
- The habit tracker table must have the same amount of days for the specific month and year
- Docker must be used in order to standardize the way to develop and deploy the application
- Allow the user to choose from multiple theme colors
- Your web application must utilize Django (including at least one model) on the back-end and JavaScript on the front-end
- Your web application must be mobile-responsive

## How to Run

The best way to install and run the application is by using Docker (with Docker Compose). Otherwise, a PostgreSQL database needs to be configured from scratch, as well as a Python virtual environment to install the dependencies of the project.

Therefore, the steps to install the application using Docker are as follows:

- Create a .env file from the .env.example file.

```bash
cp .env.example .env
```

You can choose to use the default values for the postgres configuration.

- Build the application with Docker Compose.

```bash
docker compose up -d --build
```

> The docker-compose.yaml file describes 2 services, one for the postgres database, and another for the Django application.

> The Dockerfile created for the Django application, is not at all fit for a production environment, but it should suffice for testing and developing purposes.

After the build process is over, head to http://localhost:8000 and see the application working >).

![google search](/examples/app.jpg)