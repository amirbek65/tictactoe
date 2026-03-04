from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone

from .models import User, VerificationCode, PendingRegistration
from .serializers import (
    UserSerializer, RegisterStep1Serializer, RegisterStep2Serializer,
    LoginSerializer, LoginVerifySerializer, LeaderboardSerializer
)
from .telegram_service import send_verification_code, send_login_code


@api_view(['POST'])
@permission_classes([AllowAny])
def register_step1(request):
    """Step 1: Collect user data and send Telegram verification code."""
    serializer = RegisterStep1Serializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    code = VerificationCode.generate_code()

    # Remove old pending registrations for this username/telegram
    PendingRegistration.objects.filter(username=data['username']).delete()
    PendingRegistration.objects.filter(telegram_id=data['telegram_id']).delete()

    # Create pending registration
    pending = PendingRegistration.objects.create(
        username=data['username'],
        email=data.get('email', ''),
        password_hash=make_password(data['password']),
        telegram_id=data['telegram_id'],
        code=code,
    )

    # Send code via Telegram
    sent = send_verification_code(data['telegram_id'], code, data['username'])
    if not sent:
        pending.delete()
        return Response(
            {"error": "Не удалось отправить код в Telegram. Убедитесь, что вы написали боту /start"},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({
        "message": "Код подтверждения отправлен в Telegram. Введите его для завершения регистрации.",
        "username": data['username']
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_step2(request):
    """Step 2: Verify Telegram code and create account."""
    serializer = RegisterStep2Serializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        pending = PendingRegistration.objects.get(
            username=data['username'],
            code=data['code'],
            is_used=False
        )
    except PendingRegistration.DoesNotExist:
        return Response({"error": "Неверный код или истёк срок действия."}, status=status.HTTP_400_BAD_REQUEST)

    if not pending.is_valid:
        return Response({"error": "Код истёк. Пожалуйста, зарегистрируйтесь заново."}, status=status.HTTP_400_BAD_REQUEST)

    # Create the user
    user = User.objects.create(
        username=pending.username,
        email=pending.email,
        password=pending.password_hash,
        telegram_id=pending.telegram_id,
        telegram_username=pending.telegram_username,
        is_verified=True,
    )

    pending.is_used = True
    pending.save()

    # Log in the user
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return Response({
        "message": "Регистрация успешна!",
        "user": UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_step1(request):
    """Step 1: Verify password and send Telegram code."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = authenticate(request, username=data['username'], password=data['password'])

    if not user:
        return Response({"error": "Неверное имя пользователя или пароль."}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.telegram_id:
        return Response({"error": "К аккаунту не привязан Telegram."}, status=status.HTTP_400_BAD_REQUEST)

    # Generate and send code
    code = VerificationCode.generate_code()
    VerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)
    VerificationCode.objects.create(user=user, code=code)

    sent = send_login_code(user.telegram_id, code, user.username)
    if not sent:
        return Response(
            {"error": "Не удалось отправить код в Telegram."},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({
        "message": "Код входа отправлен в Telegram.",
        "username": data['username']
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_step2(request):
    """Step 2: Verify Telegram code and log in."""
    serializer = LoginVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        user = User.objects.get(username=data['username'])
    except User.DoesNotExist:
        return Response({"error": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

    try:
        code_obj = VerificationCode.objects.filter(
            user=user,
            code=data['code'],
            is_used=False
        ).order_by('-created_at').first()

        if not code_obj or not code_obj.is_valid:
            return Response({"error": "Неверный или истёкший код."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Неверный код."}, status=status.HTTP_400_BAD_REQUEST)

    code_obj.is_used = True
    code_obj.save()

    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return Response({
        "message": "Вход выполнен успешно!",
        "user": UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Вы вышли из системы."})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard(request):
    users = User.objects.filter(is_verified=True, games_played__gt=0).order_by('-games_won', '-win_rate')[:20]
    return Response(LeaderboardSerializer(users, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    if request.user.is_authenticated:
        return Response({"authenticated": True, "user": UserSerializer(request.user).data})
    return Response({"authenticated": False})
