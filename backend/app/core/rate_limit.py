from __future__ import annotations

import time
from collections import defaultdict, deque


class SimpleRateLimiter:
    """
    Lightweight in-memory rate limiter (per-process).
    Good enough for hackathon/demo; for production replace with Redis.
    """

    def __init__(self, *, max_requests: int, window_seconds: int) -> None:
        self.max_requests = int(max_requests)
        self.window_seconds = int(window_seconds)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.time()
        q = self._hits[key]
        cutoff = now - self.window_seconds
        while q and q[0] < cutoff:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(now)
        return True

