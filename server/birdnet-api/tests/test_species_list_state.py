from pathlib import Path

CARDINAL_MP3 = Path(__file__).parent / "fixtures" / "bird_song.mp3"

# Northern Cardinal is a North American species -- not on the predicted regional
# species list for Frankfurt, Germany.
FRANKFURT_LAT = 50.1219
FRANKFURT_LON = 8.6919


def test_a_located_analysis_does_not_filter_a_later_unlocated_one(client):
    # Guards the reset in AnalyzerService.analyze -- birdnetlib sets a location
    # species filter on the shared Analyzer but never clears it on its own.
    with CARDINAL_MP3.open("rb") as audio:
        located = client.post(
            "/analyze",
            files={"file": ("bird_song.mp3", audio, "audio/mpeg")},
            params={"lat": FRANKFURT_LAT, "lon": FRANKFURT_LON, "min_conf": 0.01},
        )
    assert located.status_code == 200

    with CARDINAL_MP3.open("rb") as audio:
        unlocated = client.post(
            "/analyze",
            files={"file": ("bird_song.mp3", audio, "audio/mpeg")},
            params={"min_conf": 0.01},
        )
    assert unlocated.status_code == 200

    common_names = {d["common_name"] for d in unlocated.json()["detections"]}
    assert "Northern Cardinal" in common_names
