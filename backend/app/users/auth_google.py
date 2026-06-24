from learning.settings import CLIENT_ID_OAUTH2
import urllib.parse
import httpx
import logging


def generate_google_oauth_url():
    query_params = {
        "client_id": CLIENT_ID_OAUTH2,
        "redirect_uri": "https://myporjecttaskflow.duckdns.org/auth/google",
        "response_type": "code",
        "scope": " ".join(
            [
                "openid",
                "profile",
                "email",
            ]
        ),
        "access_type": "offline",
    }

    query_string = urllib.parse.urlencode(query_params, quote_via=urllib.parse.quote)
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    return f"{base_url}?{query_string}"


logger = logging.getLogger(__name__)


def get_token_from_google(url: str, data: dict) -> dict | None:
    try:
        with httpx.Client() as client:
            response = client.post(url,data=data)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as error:
        logger.error(
            f"Ошибка HTTPX запроса к {error.request.url}"
            f"{error.response.status_code} - {error.response.text}"
        )
        return None
    except httpx.RequestError as error:
        logger.error(f"Ошибка сети при запросе к {error.request.url}: {error}")
        return None

def get_user_google_info(access_token: str) -> dict | None:
    try:
        with httpx.Client() as client:
            response = client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as error:
        logger.error(
            f"Ошибка HTTP при получении профиля: "
            f"{error.response.status_code} - {error.response.text}"
        )
        return None
    except httpx.RequestError as error:
        logger.error(f"Ошибка сети при получении профиля: {error}")
        return None