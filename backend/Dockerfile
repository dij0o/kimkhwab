# Use the official lightweight Python 3.12 image
FROM python:3.12-slim

# Set environment variables
# 1. Prevents Python from writing .pyc files to disk
# 2. Ensures stdout/stderr are sent straight to the terminal without buffering
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies
# (libpq-dev is often required for PostgreSQL connections in Debian-based containers)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Create the uploads directory for the gallery (if you ever add it)
RUN mkdir -p uploads/gallery

# Expose the port that FastAPI runs on
EXPOSE 8000

# Command to run the application using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]