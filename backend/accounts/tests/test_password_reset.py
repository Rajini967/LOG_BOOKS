from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, PasswordResetToken, hash_reset_token


class PasswordResetFlowTests(APITestCase):
    def setUp(self):
        self.user = User.all_objects.create_user(
            email="test@example.com",
            password="InitialPass123!",
            is_active=True,
        )

    def test_forgot_password_creates_token_for_existing_email(self):
        url = reverse("auth_forgot_password")

        response = self.client.post(url, {"email": self.user.email}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Generic message, no enumeration.
        self.assertIn("message", response.data)
        self.assertTrue(
            PasswordResetToken.objects.filter(user=self.user, is_used=False).exists()
        )

    def test_forgot_password_does_not_error_for_unknown_email(self):
        url = reverse("auth_forgot_password")

        response = self.client.post(url, {"email": "unknown@example.com"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordResetToken.objects.count(), 0)

    def test_reset_password_with_valid_token(self):
        token_obj, raw_token = PasswordResetToken.create_for_user(self.user)
        validate_url = reverse("auth_validate_reset_token")
        reset_url = reverse("auth_reset_password")

        # Validate token
        validate_response = self.client.post(validate_url, {"token": raw_token}, format="json")
        self.assertEqual(validate_response.status_code, status.HTTP_200_OK)
        self.assertTrue(validate_response.data.get("valid"))

        # Reset password
        payload = {
            "token": raw_token,
            "new_password": "NewStrongPass123!",
            "confirm_password": "NewStrongPass123!",
        }
        reset_response = self.client.post(reset_url, payload, format="json")
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPass123!"))

        token_obj.refresh_from_db()
        self.assertTrue(token_obj.is_used)

    def test_reset_password_with_expired_token_fails(self):
        token_obj, raw_token = PasswordResetToken.create_for_user(self.user)
        # Force expiry
        token_obj.expires_at = timezone.now() - timezone.timedelta(minutes=1)
        token_obj.save(update_fields=["expires_at"])

        reset_url = reverse("auth_reset_password")
        payload = {
            "token": raw_token,
            "new_password": "AnotherPass123!",
            "confirm_password": "AnotherPass123!",
        }
        reset_response = self.client.post(reset_url, payload, format="json")
        self.assertEqual(reset_response.status_code, status.HTTP_400_BAD_REQUEST)

