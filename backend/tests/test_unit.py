import pytest
from app.services.priority import detect_priority
from app.services.classifier import _heuristic_classify

@pytest.mark.parametrize("text, expected_priority", [
    ("Accident near highway", "HIGH"),
    ("Urgent issue with bleeding passenger", "HIGH"),
    ("Fire in the building", "HIGH"),
    ("The train is broken", "MEDIUM"),
    ("Water leak and banjir at the station", "MEDIUM"),
    ("Toilet is dirty", "LOW"),
    ("Road is fine but noisy", "LOW"),
])
def test_detect_priority(text, expected_priority):
    assert detect_priority(text) == expected_priority

@pytest.mark.parametrize("text, expected_category, expected_agency", [
    ("Pothole on Jalan Ampang", "Infrastructure Damage", "DBKL"),
    ("LRT train is broken", "Public Transport Issue", "APAD"),
    ("Hospital service very slow", "Healthcare Service", "KKM"),
    ("Trash bin is overflowing at the park", "Public Facilities", "DBKL"),
    ("Some random complaint here", "Other", "OTHER"),
])
def test_heuristic_classifier(text, expected_category, expected_agency):
    result = _heuristic_classify(text)
    assert result.category == expected_category
    assert result.agency == expected_agency
    assert 0.0 <= result.confidence <= 1.0

def test_classifier_output_format():
    result = _heuristic_classify("Pothole")
    assert hasattr(result, "category")
    assert hasattr(result, "agency")
    assert hasattr(result, "confidence")
    assert isinstance(result.raw, dict)
