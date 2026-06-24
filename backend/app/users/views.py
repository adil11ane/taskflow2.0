from rest_framework.viewsets import GenericViewSet
from .models import User
from .serlializers import (
    EmailValidationSerializer,
    UserRegisterSerializer,
    EmailTokenObtainSerializer,
    RedisTokenSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from django.utils.translation import gettext_lazy as _
from django.core.cache import cache
from . import register_logic
from .auth_google import (
    generate_google_oauth_url,
    get_token_from_google,
    get_user_google_info,
)
from learning.settings import CLIENT_ID_OAUTH2, CLIENT_SECRET_OAUTH2


# --
class SwaggerLoginView(TokenObtainPairView):
    permission_classes = []

    def post(self, request, *args, **kwargs):

        serializer = EmailTokenObtainSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        return Response(
            {
                "access_token": data["access"],
                "refresh_token": data["refresh"],
                "token_type": "Bearer",
            }
        )


# ++ registration : view for registration, login with email and password, generating confirmation code and sending it to email, then validating the code and returning JWT tokens
class UserRegisterAPIView(GenericViewSet):
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    permission_classes = [AllowAny]

    @action(
        detail=False,
        methods=["post"],
        url_path="get-email-code",
        serializer_class=EmailValidationSerializer,
    )
    def get_email_confirmation_code(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        use_case = register_logic.RegistWithCodeFromEmailUseCase()
        try:
            use_case.execute(email=email)
            return Response({"message": "Confirmation code sent to email"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(
        detail=False,
        methods=["post"],
        url_path="register",
        serializer_class=UserRegisterSerializer,
    )
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]

        cached_code = cache.get(f"email_confirmation_code_{email}")
        if not cached_code or cached_code != code:
            return Response(
                {"error": "Invalid or expired confirmation code"}, status=400
            )

        user = serializer.save()
        cache.delete(f"email_confirmation_code_{email}")

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "token_type": "Bearer",
            }
        )


class UserRegistrationViaGoogle(GenericViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=["GET"], url_path="auth/google/url")
    def code_generator(self, request):
        uri = generate_google_oauth_url()
        return Response({"uri": uri})

    @action(methods=["POST"], detail=False, url_path="google/callback")
    def register_via_google(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"error": "Not provided"}, status=400)

        token_data =  get_token_from_google(
            url="https://oauth2.googleapis.com/token",
            data={
                "client_id": CLIENT_ID_OAUTH2,
                "client_secret": CLIENT_SECRET_OAUTH2,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": "https://myporjecttaskflow.duckdns.org/auth/google",
            },
        )

        if not token_data or "access_token" not in token_data:
            return Response({"error": "Failed to get token from Google"}, status=400)

        user_info =  get_user_google_info(access_token=token_data["access_token"])

        if not user_info or "email" not in user_info:
            return Response(
                {"error": "Failed to get user info from Google"}, status=400
            )

        user, created = User.objects.get_or_create(
            email=user_info["email"],
            defaults={
                "first_name": user_info.get("given_name", ""),
                "last_name": user_info.get("family_name", ""),
            },
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "token_type": "Bearer",
                "user": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "picture": user_info.get("picture", ""),
                    "auth_method": "Google",
                },
            }
        )


# -- login : logic for login with email and password, generating confirmation code and sending it to email, then validating the code and returning JWT tokens
class RedisTokenObtainView(TokenObtainPairView):
    serializer_class = RedisTokenSerializer