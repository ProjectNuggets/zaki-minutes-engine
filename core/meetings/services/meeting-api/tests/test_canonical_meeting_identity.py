"""Regression: Teams `…/v2#/meet/<digits>` links must get distinct canonical identities.

The sealed predicate (`meeting_url_matches_platform`) admits the Teams web-client form
`https://<host>/v2#/meet/<digits>`, where the meeting id lives in the URL FRAGMENT. urlparse
drops the fragment from `.path`, so before the fix every such meeting canonicalized to
`https://<host>/v2` and distinct meetings collided on one identity — and on the derived
`native_meeting_id` — within a tenant.
"""
import hashlib

from meeting_api.bot_spawn.url_validation import canonical_meeting_identity


def _native_meeting_id(tenant_id: str, identity: str) -> str:
    # Mirrors zaki_control.router: native_meeting_id = "zaki-" + sha256(f"{tenant}\0{identity}").
    return "zaki-" + hashlib.sha256(f"{tenant_id}\0{identity}".encode()).hexdigest()


def test_distinct_v2_fragment_teams_meetings_do_not_collide():
    _, ident_a = canonical_meeting_identity(
        "https://teams.microsoft.com/v2#/meet/1234567890", platform="teams"
    )
    _, ident_b = canonical_meeting_identity(
        "https://teams.microsoft.com/v2#/meet/9999999999", platform="teams"
    )
    assert ident_a != ident_b
    assert _native_meeting_id("tenant-1", ident_a) != _native_meeting_id("tenant-1", ident_b)


def test_same_v2_fragment_teams_meeting_is_stable_under_decoration():
    _, ident = canonical_meeting_identity(
        "https://teams.microsoft.com/v2#/meet/1234567890", platform="teams"
    )
    # passcode + trailing slash on the fragment, and host casing + trailing slash on the path,
    # all describe the SAME meeting and must canonicalize identically.
    for variant in (
        "https://teams.microsoft.com/v2#/meet/1234567890/?p=passcode",
        "https://Teams.Microsoft.com/v2/#/meet/1234567890",
    ):
        _, ident_variant = canonical_meeting_identity(variant, platform="teams")
        assert ident_variant == ident


def test_other_providers_canonicalization_unchanged():
    assert canonical_meeting_identity(
        "https://meet.google.com/abc-defg-hij", platform="google_meet"
    )[1] == "https://meet.google.com/abc-defg-hij"
    assert canonical_meeting_identity(
        "https://acme.zoom.us/j/98765432101?pwd=x", platform="zoom"
    )[1] == "https://acme.zoom.us/j/98765432101"
    assert canonical_meeting_identity(
        "https://meet.jit.si/ZakiRoom42", platform="jitsi"
    )[1] == "https://meet.jit.si/ZakiRoom42"
    # Teams classic short link keeps its id in the PATH — must be untouched by the fragment fold.
    assert canonical_meeting_identity(
        "https://teams.microsoft.com/meet/123456789012?p=x", platform="teams"
    )[1] == "https://teams.microsoft.com/meet/123456789012"
