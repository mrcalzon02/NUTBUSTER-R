#!/usr/bin/env python3
"""Create the compact manifest for a previously verified publisher-signed release."""
import hashlib
import json
import pathlib
import re
import sys

APK_NAME = "NUTBUSTER-Android-phone-test.apk"
PINNED_SIGNER = (pathlib.Path(__file__).resolve().parents[1] /
                 "config/nutbuster-publisher.sha256").read_text(encoding="ascii").strip()


def generate(tag, version_string, publisher_sha, apk_path):
    if re.fullmatch(r"nutbuster-phone-test-[0-9]+-[0-9]+", tag) is None:
        raise ValueError("invalid release tag")
    if re.fullmatch(r"[0-9]{1,10}", version_string) is None:
        raise ValueError("invalid Android versionCode")
    version = int(version_string)
    if version < 1 or version > 2_100_000_000:
        raise ValueError("versionCode outside Android range")
    if re.fullmatch(r"[0-9a-f]{64}", publisher_sha) is None:
        raise ValueError("invalid publisher SHA-256")
    if publisher_sha != PINNED_SIGNER:
        raise ValueError("wrong publisher: NUTBUSTER's pinned signing certificate is required")
    apk = pathlib.Path(apk_path)
    size = apk.stat().st_size
    if not apk.is_file() or size <= 1024 or size > 100_000_000:
        raise ValueError("invalid signed APK size")
    with apk.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    return {
        "schema": 1,
        "tag": tag,
        "androidVersionCode": version,
        "signerSha256": publisher_sha,
        "apk": {
            "name": APK_NAME,
            "url": f"https://github.com/mrcalzon02/NUTBUSTER-R/releases/download/{tag}/{APK_NAME}",
            "size": size,
            "digest": f"sha256:{digest}",
        },
    }


def main(argv):
    if len(argv) != 4:
        raise SystemExit("Usage: generate_update_manifest.py TAG VERSION_CODE PUBLISHER_SHA256")
    apk = pathlib.Path("release/publish") / APK_NAME
    document = generate(argv[1], argv[2], argv[3], apk)
    destination = pathlib.Path("release/publish/NUTBUSTER-update.json")
    destination.write_text(json.dumps(document, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv)
