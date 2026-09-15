"""Regression checks for the security boundaries that protect real data."""

import asyncio
from io import BytesIO
import unittest

from fastapi.testclient import TestClient
from fastapi import UploadFile
from PIL import Image
from pydantic import ValidationError
from starlette.datastructures import Headers

from app import schemas
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
