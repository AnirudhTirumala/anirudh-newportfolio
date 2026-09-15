FROM python:3.12-slim

WORKDIR /app

# System deps for Pillow's image codecs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads

# Run as an unprivileged user rather than root. If a future dependency
# vulnerability ever allowed code execution inside the container, this
# limits what that code could touch (no write access outside /app, can't
# install packages, can't bind low ports, etc.) - standard defense in depth
# for a container that's reachable from the public internet.
RUN groupadd --system app && useradd --system --gid app --home-dir /app --no-create-home app \
    && chown -R app:app /app
USER app

EXPOSE 8000

# Render injects PORT for web services. Keep 8000 as a convenient local
# default, while honoring the platform-assigned port in production.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
