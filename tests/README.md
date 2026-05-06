# SISPAA Intelligent GovTech Router - Testing Strategy

This repository contains a comprehensive testing strategy for the SISPAA GovTech Router, spanning across Unit, Integration, API, LangGraph Workflow, LLM Validation, Load, and E2E Frontend tests.

## 🗂️ Directory Structure

- **Backend Tests:** `/backend/tests/`
  - `test_unit.py`: Tests priority heuristics, classification logic, and utility functions.
  - `test_integration.py`: End-to-end backend tests simulating a complaint through the entire pipeline (Sense → Reason → Act).
  - `test_langgraph.py`: Validates LangGraph state changes, transitions, and conditional retries (e.g., confidence < 0.7).
  - `test_api.py`: FastAPI endpoints tests (routes, payload validation, responses).
  - `test_llm_validation.py`: Tests Pydantic schemas and LLM fallback handling for invalid JSON structure/hallucinations.
  - `load_test.py`: Asynchronous script to simulate 100-1000 concurrent complaints.
  - `conftest.py`: Shared pytest fixtures, including the test in-memory SQLite database and `TestClient`.
- **Frontend Tests:** `/frontend/tests/e2e/`
  - `complaints.spec.ts`: Playwright scripts testing user flows, table filtering, and real-time animation.
- **Mock Data:** `/tests/mock_data_gen.py`
  - Python script to generate robust, realistic Malaysian scenario datasets (`mock_complaints.json`).

## 🚀 How to Run the Tests

### 1. Backend Tests (Pytest)
First, ensure you are in the `backend` directory and your virtual environment is active.
```bash
cd backend
python -m venv .venv
# source .venv/bin/activate (Linux/Mac) or .venv\Scripts\activate (Windows)
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx
```

Run all tests:
```bash
pytest
```

Run specific test files:
```bash
pytest tests/test_integration.py
pytest tests/test_langgraph.py
```

#### 📊 Bonus: Test Coverage Report
To view the code coverage, you need the `pytest-cov` package:
```bash
pip install pytest-cov
pytest --cov=app --cov-report=term-missing
```
This report will show which lines of code in the `app` directory are not covered by the tests.

### 2. Load Testing
To run the async load testing script (sends 100 requests concurrently):
```bash
cd backend/tests
python load_test.py
```
*(Make sure your FastAPI server is running on `http://localhost:8000` via `fastapi dev app/main.py` before executing the load test).*

### 3. Frontend Tests (Playwright)
Navigate to the frontend folder, install dependencies, and run Playwright:
```bash
cd frontend
npm install
npm install -D @playwright/test
npx playwright install
npx playwright test
```
To run tests with UI mode:
```bash
npx playwright test --ui
```

## 🚨 Security & Anomaly Testing
- **Prompt Injection:** Covered via strict heuristic fallback logic in `test_llm_validation.py`. If the LLM generates malicious or corrupted JSON, it triggers a `ValidationError` or falls back to rules.
- **Wrong Agency Routing:** Tests simulate anomalies (e.g., routing a pothole to KKM) to ensure the `_heuristic_classify` and `should_retry` catches bad data via `confidence` scores.

## 🇲🇾 Malaysian Mock Scenarios
Run `python tests/mock_data_gen.py` to generate `mock_complaints.json` which contains:
- "Jalan rosak teruk dekat Johor" -> DBKL (Infrastructure)
- "Taxi scam from Singapore border" -> APAD (Transport)
- "Hospital service very slow" -> KKM (Healthcare)
