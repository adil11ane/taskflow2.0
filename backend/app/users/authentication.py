from users.models import User
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.core.cache import cache
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class CachedJWTAuthorization(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result

        # Проверяем не занесён ли токен в чёрный список в Redis
        jti = token.get("jti")
        if cache.get(f"blacklisted_token_{jti}"):
            raise AuthenticationFailed("Token has been blacklisted")

        return user, token


# Этот класс говорит Swagger: "Эй, класс выше работает точно так же, как JWT!"
class CachedJWTScheme(OpenApiAuthenticationExtension):
    target_class = "users.authentication.CachedJWTAuthorization"  # Имя вашего класса
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
