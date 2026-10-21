#!/usr/bin/env python3
"""Update manifest generator tests; do not need network access or signing secrets."""
import hashlib
import importlib.util
import pathlib
import tempfile
import unittest

PATH = pathlib.Path(__file__).resolve().parents[1] / "scripts/generate_update_manifest.py"
spec = importlib.util.spec_from_file_location("update_manifest", PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ManifestTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.apk = pathlib.Path(self.temp.name) / "test.apk"
        self.apk.write_bytes(b"APK test fixture" * 100)

    def test_manifest_matches_verified_asset(self):
        tag = "nutbuster-phone-test-40-1"
        result = module.generate(tag, "214800000", "a" * 64, self.apk)
        self.assertEqual(result["androidVersionCode"], 214800000)
        self.assertEqual(result["signerSha256"], "a" * 64)
        self.assertEqual(result["apk"]["size"], self.apk.stat().st_size)
        self.assertEqual(result["apk"]["digest"],
                         "sha256:" + hashlib.sha256(self.apk.read_bytes()).hexdigest())
        self.assertEqual(result["apk"]["url"],
                         "https://github.com/mrcalzon02/NUTBUSTER-R/releases/download/" +
                         tag + "/NUTBUSTER-Android-phone-test.apk")

    def test_rejects_untrusted_metadata(self):
        cases = [
            ("invalid tag", "1", "a" * 64),
            ("nutbuster-phone-test-40-1", "214800000", "not-fingerprint"),
            ("nutbuster-phone-test-40-1", "2147483648", "a" * 64),
            ("nutbuster-phone-test-40-1", "0", "a" * 64),
        ]
        for tag, code, signer in cases:
            with self.subTest(tag=tag, code=code, signer=signer):
                with self.assertRaises(ValueError):
                    module.generate(tag, code, signer, self.apk)


if __name__ == "__main__":
    unittest.main()
