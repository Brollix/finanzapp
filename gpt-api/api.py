from llama_cpp import Llama
from llama_cpp.server import create_app
import uvicorn

# --- Configuration ---
MODEL_NAME = "nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf"
MODEL_PATH = "."  # Assumes model is in the same directory as api.py

# --- Load the Llama model with GPU offloading ---
# n_gpu_layers=-1 attempts to offload all possible layers to the GPU.
# This is the key to using your RTX 3060.
try:
    llm = Llama(
        model_path=f"{MODEL_PATH}/{MODEL_NAME}",
        n_gpu_layers=-1,  # Offload all layers to GPU
        n_ctx=2048,       # Context window size
        verbose=True      # Enable verbose logging to see details
    )
    print("✅ Model loaded successfully on GPU.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("Please ensure the model file is present and CUDA is correctly configured.")
    exit()

# --- Create and run the OpenAI-compatible server ---
# This creates a server that works with our existing main.py script.
app = create_app(llm=llm)

if __name__ == "__main__":
    print(f"✅ Starting Llama-CPP server on http://localhost:4891")
    # Use uvicorn to run the app, which is standard for modern Python web apps
    uvicorn.run(app, host="0.0.0.0", port=4891)
