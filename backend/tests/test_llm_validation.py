import pytest
from unittest.mock import patch, MagicMock
from app.services.classifier import classify_complaint
from app.schemas.complaint import ComplaintCreate
from pydantic import ValidationError

@pytest.mark.asyncio
async def test_llm_fallback_on_invalid_json():
    # Test that the system falls back to heuristic if the LLM returns invalid JSON
    with patch("app.services.classifier.settings.groq_api_key", "fake_key"):
        # We also need to mock the AsyncGroq client
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        # Provide invalid JSON format
        mock_response.choices[0].message.content = "This is not JSON at all."
        
        mock_client.chat.completions.create.return_value = mock_response
        
        with patch("app.services.classifier.AsyncGroq", return_value=mock_client):
            result = await classify_complaint("pothole problem")
            
            # Since JSON was invalid, it should fall back to heuristic
            assert result.raw["mode"] == "heuristic-fallback"
            assert "error" in result.raw
            assert result.category == "Infrastructure Damage"

def test_complaint_schema_validation():
    # Validate schema enforces required fields
    with pytest.raises(ValidationError):
        ComplaintCreate(location_text="Kuala Lumpur") # Missing complaint_text
        
    valid = ComplaintCreate(
        complaint_text="Pothole",
        location_text="KL",
        email="test@example.com"
    )
    assert valid.complaint_text == "Pothole"
    assert valid.email == "test@example.com"

@pytest.mark.parametrize("text", [
    "", # Empty string
    "A" * 10000, # Very long string
    "Jalan ini ada pothole sangat teruk, please fix it ASAP" # Mixed BM/English
])
@pytest.mark.asyncio
async def test_edge_case_inputs(text):
    result = await classify_complaint(text)
    assert result.category is not None
    assert result.agency is not None
    assert isinstance(result.confidence, float)
