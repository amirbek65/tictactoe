from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_game, name='create-game'),
    path('list/', views.list_games, name='list-games'),
    path('my/', views.my_games, name='my-games'),
    path('<int:game_id>/', views.get_game, name='get-game'),
    path('<int:game_id>/join/', views.join_game, name='join-game'),
    path('<int:game_id>/move/', views.make_move, name='make-move'),
    path('ai/create/', views.create_ai_game, name='create-ai-game'),
    path('ai/<int:game_id>/', views.get_ai_game, name='get-ai-game'),
    path('ai/<int:game_id>/move/', views.make_ai_move, name='make-ai-move'),
]
