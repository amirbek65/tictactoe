from django.urls import path
from . import views

urlpatterns = [
    path('register/step1/', views.register_step1, name='register-step1'),
    path('register/step2/', views.register_step2, name='register-step2'),
    path('login/step1/', views.login_step1, name='login-step1'),
    path('login/step2/', views.login_step2, name='login-step2'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('check/', views.check_auth, name='check-auth'),
]
