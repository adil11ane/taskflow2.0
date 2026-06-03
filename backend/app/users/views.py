from rest_framework.generics import CreateAPIView
from .serlializers import (
    UserRegisterSerializer,
    EmailTokenObtainSerializer,
    RedisTokenSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


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


class UserRegisterAPIView(CreateAPIView):
    serializer_class = UserRegisterSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    permission_classes = [AllowAny]


class RedisTokenObtainView(TokenObtainPairView):
    serializer_class = RedisTokenSerializer
