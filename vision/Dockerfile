FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Python source
COPY *.py .

# Model weights (required at runtime)
COPY yolov8n.pt .
COPY hand_landmarker.task .

EXPOSE 8501
CMD ["python", "web.py"]
