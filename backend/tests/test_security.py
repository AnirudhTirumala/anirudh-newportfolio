"""Regression checks for the security boundaries that protect real data."""

import asyncio
from io import BytesIO
import unittest

from fastapi.testclient import TestClient
from fastapi import HTTPException, Request, UploadFile
from PIL import Image
from pydantic import ValidationError
from starlette.datastructures import Headers

from app import schemas, security
from app.image_uploads import read_verified_image
from app.main import app


class SchemaValidationTests(unittest.TestCase):
    def test_external_links_must_be_http_or_https(self) -> None:
        self.assertEqual(schemas.ProfileUpdate(github_url="https://example.com").github_url, "https://example.com")
        with self.assertRaises(ValidationError):
            schemas.ProjectUpdate(live_url="javascript:alert(1)")

    def test_certificate_images_must_be_server_managed(self) -> None:
        self.assertEqual(
            schemas.CertificateUpdate(image_url="/uploads/certificates/cert-1.jpg").image_url,
            "/uploads/certificates/cert-1.jpg",
        )
        with self.assertRaises(ValidationError):
            schemas.CertificateUpdate(image_url="https://tracker.invalid/pixel.png")

    def test_write_schemas_stay_within_the_column_widths(self) -> None:
        # Postgres rejects an over-long value with a 500 the admin cannot act
        # on, while SQLite accepts it - so this has to fail during validation.
        with self.assertRaises(ValidationError):
            schemas.EducationCreate(institution="KL University", degree="B.Tech", start_year="August 2021")

    def test_new_entries_must_be_named_but_stored_ones_still_load(self) -> None:
        with self.assertRaises(ValidationError):
            schemas.CertificateCreate(name="   ")
        self.assertEqual(schemas.CertificateOut(id=1, name="").name, "")

    def test_image_validator_accepts_a_real_matching_image(self) -> None:
        image_bytes = BytesIO()
        Image.new("RGB", (1, 1), "white").save(image_bytes, format="JPEG")
        upload = UploadFile(
            file=BytesIO(image_bytes.getvalue()),
            filename="image.jpg",
            headers=Headers({"content-type": "image/jpeg"}),
        )
        contents, extension = asyncio.run(read_verified_image(upload))
        self.assertTrue(contents)
        self.assertEqual(extension, ".jpg")


class LoginThrottleTests(unittest.TestCase):
    """Render terminates every connection at a shared proxy, so these all
    exercise one client address standing in for the whole internet."""

    def setUp(self) -> None:
        security._failed_attempts.clear()

    @staticmethod
    def _request() -> Request:
        return Request({"type": "http", "client": ("10.0.0.1", 1234), "headers": []})

    def test_a_stranger_cannot_lock_the_owner_out(self) -> None:
        request = self._request()
        for _ in range(20):
            security.record_failed_login(request, "admin")
        with self.assertRaises(HTTPException):
            security.check_login_throttle(request, "admin")
        # The owner's own username shares that address but not the bucket.
        security.check_login_throttle(request, "anirudh")

    def test_the_wait_is_capped_so_a_valid_password_always_gets_a_turn(self) -> None:
        self.assertEqual(security._login_backoff_seconds(security._FREE_ATTEMPTS - 1), 0.0)
        self.assertEqual(security._login_backoff_seconds(500), float(security._MAX_BACKOFF_SECONDS))

    def test_a_successful_login_clears_the_bucket(self) -> None:
        request = self._request()
        for _ in range(10):
            security.record_failed_login(request, "anirudh")
        security.clear_failed_logins(request, "anirudh")
        security.check_login_throttle(request, "anirudh")


class ApiSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_health_has_browser_hardening_headers(self) -> None:
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["x-content-type-options"], "nosniff")
        self.assertEqual(response.headers["x-frame-options"], "DENY")

    def test_sensitive_dashboard_records_require_login(self) -> None:
        self.assertEqual(self.client.get("/api/janseva/requests").status_code, 401)
        self.assertEqual(self.client.get("/api/lumpy/stats").status_code, 401)

    def test_experience_is_public_but_changes_require_login(self) -> None:
        response = self.client.get("/api/experiences")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertEqual(
            self.client.post("/api/experiences", json={"company": "Example", "role": "Intern"}).status_code,
            401,
        )

    def test_image_endpoint_rejects_spoofed_image_data(self) -> None:
        response = self.client.post(
            "/api/lumpy/detect",
            files={"file": ("not-an-image.jpg", BytesIO(b"not an image"), "image/jpeg")},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
