
FROM python:3.14-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY requirements-docker.txt ./

# Install CPU-only PyTorch from the official CPU index
RUN uv pip install \
    --system \
    --no-cache \
    --torch-backend cpu \
    "torch==2.14.1"

# Install the remaining project dependencies
RUN grep -v -E '^torch==' requirements-docker.txt > /tmp/requirements.txt \
    && uv pip install --system --no-cache -r /tmp/requirements.txt

COPY app ./app
COPY data ./data

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]