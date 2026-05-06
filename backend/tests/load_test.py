import asyncio
import time
import httpx

API_URL = "http://localhost:8000"

async def submit_single_complaint(client: httpx.AsyncClient, i: int):
    payload = {
        "complaint_text": f"Load test complaint {i} with broken road",
        "location_text": "Kuala Lumpur",
        "email": f"tester{i}@example.com"
    }
    start = time.time()
    try:
        resp = await client.post(f"{API_URL}/complaint", json=payload, timeout=30.0)
        return resp.status_code, time.time() - start
    except Exception as e:
        return str(e), time.time() - start

async def run_load_test(num_requests: int = 100):
    async with httpx.AsyncClient() as client:
        print(f"Starting load test with {num_requests} concurrent requests...")
        start_time = time.time()
        
        tasks = [submit_single_complaint(client, i) for i in range(num_requests)]
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        
        successes = [r for r in results if r[0] == 200]
        failures = [r for r in results if r[0] != 200]
        
        times = [r[1] for r in results]
        avg_time = sum(times) / len(times) if times else 0
        
        print("\n--- Load Test Results ---")
        print(f"Total Time: {end_time - start_time:.2f} seconds")
        print(f"Successful Requests: {len(successes)}")
        print(f"Failed Requests: {len(failures)}")
        print(f"Average Response Time: {avg_time:.2f} seconds")
        print(f"Max Response Time: {max(times):.2f} seconds")
        print(f"Min Response Time: {min(times):.2f} seconds")

if __name__ == "__main__":
    # To run: python load_test.py
    asyncio.run(run_load_test(100))
