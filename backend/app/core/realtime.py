"""In-process pub/sub for pushing agent replies to live widget WebSockets.

MVP / single-process only. Each open widget socket registers an asyncio.Queue
keyed by conversation_id; the (sync) agent-reply HTTP handler calls `publish`,
which is thread-safe — it hands the event to the WebSocket's event loop via
`call_soon_threadsafe`. For multi-instance deploys, swap this for Redis pub/sub
(same publish/subscribe surface).
"""

from __future__ import annotations

import asyncio
from collections import defaultdict


class Hub:
    def __init__(self) -> None:
        self._subs: dict[str, set[asyncio.Queue]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def subscribe(self, conversation_id: str, queue: asyncio.Queue) -> None:
        # Captured here because subscribe runs inside the WebSocket's running loop.
        self._loop = asyncio.get_running_loop()
        self._subs[conversation_id].add(queue)

    def unsubscribe(self, conversation_id: str, queue: asyncio.Queue) -> None:
        subs = self._subs.get(conversation_id)
        if subs is None:
            return
        subs.discard(queue)
        if not subs:
            self._subs.pop(conversation_id, None)

    def publish(self, conversation_id: str, event: dict) -> bool:
        """Deliver `event` to every socket listening on this conversation.

        Returns True if at least one listener was connected. Safe to call from a
        synchronous request handler running in a worker thread.
        """
        subs = self._subs.get(conversation_id)
        if not subs or self._loop is None:
            return False
        for queue in list(subs):
            self._loop.call_soon_threadsafe(queue.put_nowait, event)
        return True


hub = Hub()
