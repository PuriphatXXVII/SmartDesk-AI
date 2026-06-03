FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the full source BEFORE installing: `pip install -e .` builds the package
# from this dir, so the `app/` package must already be present (else
# "package directory 'app' does not exist").
COPY . .
RUN pip install --upgrade pip && pip install -e ".[dev]"

EXPOSE 8000

# Railway (and most PaaS) inject $PORT at runtime; fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
