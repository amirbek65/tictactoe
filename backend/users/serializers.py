from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'telegram_username',
            'is_verified', 'games_played', 'games_won',
            'games_lost', 'games_draw', 'win_rate', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'games_played', 'games_won',
                            'games_lost', 'games_draw', 'win_rate', 'created_at']


class RegisterStep1Serializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=50)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(min_length=6, write_only=True)
    telegram_id = serializers.CharField(help_text="Your Telegram numeric ID. Start chat with bot first.")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Это имя пользователя уже занято.")
        return value

    def validate_telegram_id(self, value):
        if not value.lstrip('-').isdigit():
            raise serializers.ValidationError("Telegram ID должен быть числом.")
        if User.objects.filter(telegram_id=value).exists():
            raise serializers.ValidationError("Этот Telegram аккаунт уже привязан.")
        return value


class RegisterStep2Serializer(serializers.Serializer):
    username = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class LoginVerifySerializer(serializers.Serializer):
    username = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)


class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'games_played', 'games_won', 'games_lost', 'games_draw', 'win_rate']
