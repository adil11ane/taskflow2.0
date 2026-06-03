from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import User
from django.contrib.auth import get_user_model

user = get_user_model()


class UserAPITests(APITestCase):
    def setUp(self):
        self.user = user.objects.create_user(
            email="test@example.com",
            password="testpass",
            first_name="Adil",
            last_name="Nurov",
        )

    def test_login_user_via_api(self):
        url = reverse("token_obtain_pair")
        data = {"email": "test@example.com", "password": "testpass"}

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)

    def test_user_registration_via_api(self):
        url = reverse("register")
        data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "Adil",
            "last_name": "Nurov",
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "newuser@example.com")
        self.assertEqual(response.data["first_name"], "Adil")
        self.assertEqual(response.data["last_name"], "Nurov")

        self.assertNotIn("password", response.data)
