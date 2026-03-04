import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"


def send_message(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
    """Send a message to a Telegram user."""
    try:
        url = f"{TELEGRAM_API_URL}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        if not result.get("ok"):
            logger.error(f"Telegram API error: {result}")
            return False
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")
        return False


def send_verification_code(telegram_id: str, code: str, username: str) -> bool:
    """Send a verification code to a Telegram user."""
    text = (
        f"🎮 <b>TicTacToe — Подтверждение регистрации</b>\n\n"
        f"Привет, <b>{username}</b>! 👋\n\n"
        f"Ваш код подтверждения:\n\n"
        f"<code>{code}</code>\n\n"
        f"⏰ Код действителен <b>10 минут</b>.\n\n"
        f"Если вы не регистрировались — просто проигнорируйте это сообщение."
    )
    return send_message(telegram_id, text)


def send_login_code(telegram_id: str, code: str, username: str) -> bool:
    """Send a login code to a Telegram user."""
    text = (
        f"🔐 <b>TicTacToe — Вход в аккаунт</b>\n\n"
        f"Привет, <b>{username}</b>!\n\n"
        f"Код для входа:\n\n"
        f"<code>{code}</code>\n\n"
        f"⏰ Код действителен <b>10 минут</b>.\n\n"
        f"Если вы не пытались войти — срочно смените пароль!"
    )
    return send_message(telegram_id, text)


def get_chat_id_from_username(username: str) -> str | None:
    """
    Note: Telegram doesn't allow looking up chat_id by username directly.
    The user must first start a conversation with the bot.
    This function is a placeholder.
    """
    return None


def verify_bot_token() -> bool:
    """Verify that the bot token is valid."""
    try:
        url = f"{TELEGRAM_API_URL}/getMe"
        response = requests.get(url, timeout=10)
        result = response.json()
        return result.get("ok", False)
    except Exception:
        return False
