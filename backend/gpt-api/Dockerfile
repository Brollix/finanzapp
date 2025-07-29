# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory in the container
WORKDIR /code

# Install system dependencies required for llama-cpp-python (ajusta según necesidad)
RUN apt-get update && apt-get install -y \
    build-essential \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy the dependencies file to the working directory
COPY ./requirements.txt /code/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application code (incluyendo el modelo, si no lo ignoras)
COPY . /code

# Expose the port the app runs on
EXPOSE 4891

# Environment variable for model file (can be overridden at runtime)
ENV MODEL_NAME="nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf"

# Run the application (OpenAI-compatible server)
CMD ["python", "api.py"]
