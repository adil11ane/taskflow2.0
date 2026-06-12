from django.urls import include, path
from users.views import (
    UserRegisterAPIView,
    SwaggerLoginView,
    RedisTokenObtainView,
    UserRegistrationViaGoogle,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"", UserRegisterAPIView, basename="register")
router.register(r"google", UserRegistrationViaGoogle, basename="google")


urlpatterns = [
    path("login/", RedisTokenObtainView.as_view(), name="token_obtain_pair"),
    path("swagger-login/", SwaggerLoginView.as_view(), name="swagger_token_obtian"),
    path("logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
