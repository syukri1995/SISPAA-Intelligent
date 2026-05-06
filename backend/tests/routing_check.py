import asyncio
import json
from pathlib import Path

import httpx


API_URL = "http://localhost:8000"


async def main():
  data = json.loads(Path(__file__).resolve().parents[2].joinpath("mock_complaints.json").read_text(encoding="utf-8"))
  total = len(data)
  ok = 0
  mismatches = []

  async with httpx.AsyncClient(timeout=60.0) as client:
    for i, item in enumerate(data):
      resp = await client.post(
        f"{API_URL}/complaint",
        json={
          "complaint_text": item["complaint_text"],
          "location_text": item.get("location_text"),
          "email": item.get("email"),
        },
      )
      out = resp.json()
      got = {
        "category": out.get("category"),
        "agency": out.get("agency"),
        "priority": out.get("priority"),
      }
      exp = {
        "category": item.get("expected_category"),
        "agency": item.get("expected_agency"),
        "priority": item.get("expected_priority"),
      }
      if got == exp:
        ok += 1
      else:
        mismatches.append({"i": i, "expected": exp, "got": got, "text": item["complaint_text"]})

  print(f"Routing check: {ok}/{total} matched")
  if mismatches:
    print("Mismatches:")
    for m in mismatches:
      print("-", m)


if __name__ == "__main__":
  asyncio.run(main())

