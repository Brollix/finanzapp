import subprocess
import sys
import os

# --- Configuration ---
# Cambia el nombre del modelo aquí para usar otro archivo GGUF
# Ejemplo: "mistral-7b-instruct-v0.2.Q4_K_M.gguf" o "nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf"
MODEL_NAME = os.environ.get("MODEL_NAME", "nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf")

# `MODEL_PATH` puede ser una ruta completa al archivo o solo un directorio.
# Si se proporciona una ruta al archivo, se utiliza tal cual; de lo
# contrario, se une con `MODEL_NAME`.
env_model_path = os.environ.get("MODEL_PATH")

if env_model_path:
    if os.path.isdir(env_model_path):
        MODEL_FILE = os.path.join(env_model_path, MODEL_NAME)
    else:
        MODEL_FILE = env_model_path
else:
    MODEL_FILE = os.path.join(".", MODEL_NAME)

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
            "--n_threads", "-1",
            "--n_threads_batch", "-1",
            "--n_gpu_layers", "-1"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to launch llama-cpp-python server: {e}")
        sys.exit(1)
