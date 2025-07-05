#!/bin/bash
# Script to set up the environment and run the API on Linux with CUDA support.

# Exit immediately if a command exits with a non-zero status.
set -e

# 1. Create and activate a Python virtual environment
echo "--- Setting up Python virtual environment ---"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
echo "✅ Virtual environment activated."

# 2. Install llama-cpp-python with CUDA support
# This is the most critical step. It compiles the library for your specific GPU.
echo "--- Installing llama-cpp-python with CUDA support (this may take a few minutes) ---"
CMAKE_ARGS="-DLLAMA_CUBLAS=on" FORCE_CMAKE=1 pip install llama-cpp-python --force-reinstall --no-cache-dir
echo "✅ llama-cpp-python installed."

# 3. Install other dependencies
echo "--- Installing other dependencies from requirements.txt ---"
pip install -r requirements.txt
echo "✅ Dependencies installed."

# 4. Run the API server
echo "--- Starting the API server --- "
python api.py
