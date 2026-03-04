from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Game, AIGame
from users.models import User


def board_to_list(board_str):
    return [c if c != '-' else None for c in board_str]


def serialize_game(game, request_user=None):
    return {
        'id': game.id,
        'player_x': {
            'id': game.player_x.id,
            'username': game.player_x.username
        } if game.player_x else None,
        'player_o': {
            'id': game.player_o.id,
            'username': game.player_o.username
        } if game.player_o else None,
        'board': board_to_list(game.board),
        'current_turn': game.current_turn,
        'status': game.status,
        'result': game.result,
        'winner': {
            'id': game.winner.id,
            'username': game.winner.username
        } if game.winner else None,
        'created_at': game.created_at.isoformat(),
        'updated_at': game.updated_at.isoformat(),
    }


def serialize_ai_game(game):
    return {
        'id': game.id,
        'player_symbol': game.player_symbol,
        'difficulty': game.difficulty,
        'board': board_to_list(game.board),
        'current_turn': game.current_turn,
        'status': game.status,
        'result': game.result,
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_game(request):
    """Create a new multiplayer game waiting for opponent."""
    # Cancel existing waiting games by this user
    Game.objects.filter(player_x=request.user, status='waiting').update(status='finished', result='abandoned')

    game = Game.objects.create(player_x=request.user, status='waiting')
    return Response(serialize_game(game), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_game(request, game_id):
    """Join an existing game as player O."""
    game = get_object_or_404(Game, id=game_id)

    if game.status != 'waiting':
        return Response({'error': 'Игра уже началась или завершена.'}, status=status.HTTP_400_BAD_REQUEST)

    if game.player_x == request.user:
        return Response({'error': 'Вы не можете играть против себя.'}, status=status.HTTP_400_BAD_REQUEST)

    game.player_o = request.user
    game.status = 'active'
    game.save()

    return Response(serialize_game(game))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_move(request, game_id):
    """Make a move in a multiplayer game."""
    game = get_object_or_404(Game, id=game_id)

    if game.status != 'active':
        return Response({'error': 'Игра не активна.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check whose turn it is
    if game.current_turn == 'X' and game.player_x != request.user:
        return Response({'error': 'Сейчас ход X.'}, status=status.HTTP_403_FORBIDDEN)
    if game.current_turn == 'O' and game.player_o != request.user:
        return Response({'error': 'Сейчас ход O.'}, status=status.HTTP_403_FORBIDDEN)

    position = request.data.get('position')
    if position is None or not (0 <= int(position) <= 8):
        return Response({'error': 'Неверная позиция (0-8).'}, status=status.HTTP_400_BAD_REQUEST)

    if not game.make_move(int(position)):
        return Response({'error': 'Клетка уже занята.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for winner
    result = game.check_winner()
    if result:
        game.status = 'finished'
        game.finished_at = timezone.now()
        if result == 'X':
            game.result = 'x_wins'
            game.winner = game.player_x
            _update_stats(game.player_x, 'win')
            _update_stats(game.player_o, 'loss')
        elif result == 'O':
            game.result = 'o_wins'
            game.winner = game.player_o
            _update_stats(game.player_o, 'win')
            _update_stats(game.player_x, 'loss')
        else:  # draw
            game.result = 'draw'
            _update_stats(game.player_x, 'draw')
            _update_stats(game.player_o, 'draw')
    else:
        game.current_turn = 'O' if game.current_turn == 'X' else 'X'

    game.save()
    return Response(serialize_game(game))


def _update_stats(user, outcome):
    if not user:
        return
    user.games_played += 1
    if outcome == 'win':
        user.games_won += 1
    elif outcome == 'loss':
        user.games_lost += 1
    else:
        user.games_draw += 1
    user.save()


@api_view(['GET'])
@permission_classes([AllowAny])
def list_games(request):
    """List open games available to join."""
    games = Game.objects.filter(status='waiting').select_related('player_x')[:20]
    return Response([serialize_game(g) for g in games])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_games(request):
    """List current user's games."""
    games = Game.objects.filter(
        player_x=request.user
    ).union(
        Game.objects.filter(player_o=request.user)
    ).order_by('-created_at')[:20]
    # Re-query with proper ordering
    game_ids = [g.id for g in games]
    games = Game.objects.filter(id__in=game_ids).select_related('player_x', 'player_o', 'winner').order_by('-created_at')
    return Response([serialize_game(g) for g in games])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    return Response(serialize_game(game))


# AI Game endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_ai_game(request):
    """Start a new game against AI."""
    difficulty = request.data.get('difficulty', 'medium')
    player_symbol = request.data.get('player_symbol', 'X')

    if difficulty not in ['easy', 'medium', 'hard']:
        difficulty = 'medium'
    if player_symbol not in ['X', 'O']:
        player_symbol = 'X'

    game = AIGame.objects.create(
        player=request.user,
        difficulty=difficulty,
        player_symbol=player_symbol,
        current_turn='X',
        status='active'
    )

    # If player chose O, AI makes first move
    if player_symbol == 'O':
        ai_pos = game.get_ai_move()
        game.make_move(ai_pos, 'X')  # AI is X
        game.current_turn = 'O'
        game.save()

    return Response(serialize_ai_game(game), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_ai_move(request, game_id):
    """Make a move in AI game."""
    game = get_object_or_404(AIGame, id=game_id, player=request.user)

    if game.status != 'active':
        return Response({'error': 'Игра завершена.'}, status=status.HTTP_400_BAD_REQUEST)

    position = request.data.get('position')
    if position is None:
        return Response({'error': 'Укажите позицию.'}, status=status.HTTP_400_BAD_REQUEST)

    position = int(position)
    ai_symbol = 'O' if game.player_symbol == 'X' else 'X'

    # Player move
    if not game.make_move(position, game.player_symbol):
        return Response({'error': 'Клетка занята.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check after player move
    result = game.check_winner()
    if result:
        game.status = 'finished'
        if result == game.player_symbol:
            game.result = 'player_wins'
            _update_stats(request.user, 'win')
        elif result == 'draw':
            game.result = 'draw'
            _update_stats(request.user, 'draw')
        else:
            game.result = 'ai_wins'
            _update_stats(request.user, 'loss')
        game.save()
        return Response(serialize_ai_game(game))

    # AI move
    game.current_turn = ai_symbol
    ai_pos = game.get_ai_move()
    game.make_move(ai_pos, ai_symbol)

    # Check after AI move
    result = game.check_winner()
    if result:
        game.status = 'finished'
        if result == game.player_symbol:
            game.result = 'player_wins'
            _update_stats(request.user, 'win')
        elif result == 'draw':
            game.result = 'draw'
            _update_stats(request.user, 'draw')
        else:
            game.result = 'ai_wins'
            _update_stats(request.user, 'loss')
    else:
        game.current_turn = game.player_symbol

    game.save()
    return Response({**serialize_ai_game(game), 'ai_move': ai_pos})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_game(request, game_id):
    game = get_object_or_404(AIGame, id=game_id, player=request.user)
    return Response(serialize_ai_game(game))
