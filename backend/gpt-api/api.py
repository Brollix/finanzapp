import subprocess
import sys
import os

# --- Configuration ---
# Cambia el nombre del modelo aquí para usar otro archivo GGUF
# Ejemplo: "mistral-7b-instruct-v0.2.Q4_K_M.gguf" o "nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf"
# Permitimos pasar ruta completa con MODEL_PATH. Si no se define, construimos a partir de MODEL_DIR y MODEL_NAME
MODEL_FILE = os.environ.get("MODEL_PATH")
if not MODEL_FILE:
    MODEL_DIR = os.environ.get("MODEL_DIR", ".")
    MODEL_NAME = os.environ.get("MODEL_NAME", "nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf")
    MODEL_FILE = os.path.join(MODEL_DIR, MODEL_NAME)

PORT = 4891

if __name__ == "__main__":
    print(f"✅ Starting Llama-CPP OpenAI-compatible server on http://localhost:{PORT}")
    print(f"Using model: {MODEL_FILE}")
    try:
        subprocess.run([
            sys.executable, "-m", "llama_cpp.server",
            "--model", MODEL_FILE,
            "--host", "0.0.0.0",
            "--port", str(PORT),

        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to launch llama-cpp-python server: {e}")
        sys.exit(1)
