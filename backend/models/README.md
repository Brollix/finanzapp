# Modelos LLM – Finanzapp

Este directorio **no se versiona**; aquí debes colocar los pesos del modelo
LLM que utilizará el servicio **GPT API**.

## 📥 Descarga rápida

1. Crea la carpeta (ya debería existir):
   ```bash
   mkdir -p backend/models
   ```
2. Descarga el modelo recomendado (≈4 GB):
   [Nous-Hermes-2-Mistral-7B-DPO.Q4_K_M.gguf](https://huggingface.co/TheBloke/Nous-Hermes-2-Mistral-7B-DPO-GGUF)
3. Copia el archivo `.gguf` dentro de `backend/models/`.

```text
backend/models/
└── Nous-Hermes-2-Mistral-7B-DPO.Q4_K_M.gguf
```

Si eliges otro peso compatible, actualiza la variable de entorno `MODEL_PATH`
en `backend/docker-compose.yml`.

> Nota: La carpeta está ignorada en `.gitignore`; los modelos no se suben al repositorio.
