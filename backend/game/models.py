from django.db import models
from django.conf import settings
import json


class Game(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting for opponent'),
        ('active', 'Active'),
        ('finished', 'Finished'),
    ]

    RESULT_CHOICES = [
        ('x_wins', 'X Wins'),
        ('o_wins', 'O Wins'),
        ('draw', 'Draw'),
        ('abandoned', 'Abandoned'),
    ]

    player_x = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='games_as_x'
    )
    player_o = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games_as_o'
    )
    board = models.CharField(max_length=9, default='---------')  # 9 chars: X, O, or -
    current_turn = models.CharField(max_length=1, default='X')  # X or O
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, null=True, blank=True)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games_won_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'games'
        ordering = ['-created_at']

    def get_board_list(self):
        return list(self.board)

    def set_board_list(self, board_list):
        self.board = ''.join(board_list)

    def make_move(self, position: int) -> bool:
        """Make a move at position (0-8). Returns True if move is valid."""
        board = self.get_board_list()
        if board[position] != '-':
            return False
        board[position] = self.current_turn
        self.set_board_list(board)
        return True

    def check_winner(self) -> str | None:
        """Check if there's a winner. Returns 'X', 'O', 'draw', or None."""
        board = self.get_board_list()
        win_combos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
            [0, 4, 8], [2, 4, 6],              # diags
        ]
        for combo in win_combos:
            a, b, c = combo
            if board[a] != '-' and board[a] == board[b] == board[c]:
                return board[a]
        if '-' not in board:
            return 'draw'
        return None

    def __str__(self):
        return f'Game #{self.id}: {self.player_x} vs {self.player_o} ({self.status})'


class AIGame(models.Model):
    """Single player game vs AI"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    player = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_games'
    )
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    player_symbol = models.CharField(max_length=1, default='X')
    board = models.CharField(max_length=9, default='---------')
    current_turn = models.CharField(max_length=1, default='X')
    status = models.CharField(max_length=20, default='active')
    result = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_games'

    def get_board_list(self):
        return list(self.board)

    def set_board_list(self, board_list):
        self.board = ''.join(board_list)

    def make_move(self, position: int, symbol: str) -> bool:
        board = self.get_board_list()
        if board[position] != '-':
            return False
        board[position] = symbol
        self.set_board_list(board)
        return True

    def check_winner(self) -> str | None:
        board = self.get_board_list()
        win_combos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ]
        for combo in win_combos:
            a, b, c = combo
            if board[a] != '-' and board[a] == board[b] == board[c]:
                return board[a]
        if '-' not in board:
            return 'draw'
        return None

    def get_ai_move(self) -> int:
        """Get AI move based on difficulty."""
        import random
        board = self.get_board_list()
        ai_symbol = 'O' if self.player_symbol == 'X' else 'X'
        player_symbol = self.player_symbol

        available = [i for i, cell in enumerate(board) if cell == '-']

        if self.difficulty == 'easy':
            return random.choice(available)
        elif self.difficulty == 'medium':
            # 50% chance of optimal move
            if random.random() > 0.5:
                return self._minimax_move(board, ai_symbol, player_symbol)
            return random.choice(available)
        else:  # hard
            return self._minimax_move(board, ai_symbol, player_symbol)

    def _minimax_move(self, board, ai_symbol, player_symbol) -> int:
        """Minimax algorithm for best move."""
        best_score = float('-inf')
        best_move = None

        for i in range(9):
            if board[i] == '-':
                board[i] = ai_symbol
                score = self._minimax(board, 0, False, ai_symbol, player_symbol)
                board[i] = '-'
                if score > best_score:
                    best_score = score
                    best_move = i

        return best_move

    def _minimax(self, board, depth, is_maximizing, ai_symbol, player_symbol):
        winner = self._check_winner_board(board)
        if winner == ai_symbol:
            return 10 - depth
        if winner == player_symbol:
            return depth - 10
        if '-' not in board:
            return 0

        if is_maximizing:
            best = float('-inf')
            for i in range(9):
                if board[i] == '-':
                    board[i] = ai_symbol
                    best = max(best, self._minimax(board, depth + 1, False, ai_symbol, player_symbol))
                    board[i] = '-'
            return best
        else:
            best = float('inf')
            for i in range(9):
                if board[i] == '-':
                    board[i] = player_symbol
                    best = min(best, self._minimax(board, depth + 1, True, ai_symbol, player_symbol))
                    board[i] = '-'
            return best

    def _check_winner_board(self, board):
        win_combos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ]
        for combo in win_combos:
            a, b, c = combo
            if board[a] != '-' and board[a] == board[b] == board[c]:
                return board[a]
        return None
