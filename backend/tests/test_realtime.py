"""Unit tests for the in-process realtime Hub (agent reply -> widget delivery)."""

import asyncio

from app.core.realtime import Hub


def test_hub_publish_subscribe_unsubscribe() -> None:
    async def scenario() -> None:
        hub = Hub()
        q: asyncio.Queue = asyncio.Queue()

        # No subscribers yet.
        assert hub.publish("c1", {"type": "agent", "content": "hi"}) is False

        hub.subscribe("c1", q)
        assert hub.publish("c1", {"type": "agent", "content": "hi"}) is True
        await asyncio.sleep(0)  # let call_soon_threadsafe deliver
        assert q.get_nowait()["content"] == "hi"

        # Publishing to a different conversation doesn't leak across.
        assert hub.publish("other", {"type": "agent", "content": "x"}) is False

        # After unsubscribe, delivery stops.
        hub.unsubscribe("c1", q)
        assert hub.publish("c1", {"type": "agent", "content": "again"}) is False

    asyncio.run(scenario())


def test_hub_fans_out_to_multiple_sockets() -> None:
    async def scenario() -> None:
        hub = Hub()
        a: asyncio.Queue = asyncio.Queue()
        b: asyncio.Queue = asyncio.Queue()
        hub.subscribe("c1", a)
        hub.subscribe("c1", b)
        assert hub.publish("c1", {"n": 1}) is True
        await asyncio.sleep(0)
        assert a.get_nowait()["n"] == 1
        assert b.get_nowait()["n"] == 1

    asyncio.run(scenario())
