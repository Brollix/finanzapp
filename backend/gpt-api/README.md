# GPT API – Finanzapp

Servicio que recibe texto crudo de tickets y devuelve un JSON estructurado
utilizando un modelo de lenguaje local (LLM) ejecutado con `llama.cpp`.

---

## ⚙️ Tecnologías

| Componente | Stack              |
| ---------- | ------------------ |
| Framework  | FastAPI            |
| Motor LLM  | llama.cpp (`gguf`) |
| Idioma     | Python 3.10        |

---

## 🚀 Ejecución rápida (Docker)

```bash
# Desde backend/
docker compose up --build gpt-api
```

El contenedor se expondrá en `http://localhost:8080/parse`.

Requiere que el modelo `.gguf` esté en `backend/models/` (ver README del backend).

---

## 🛠️ Desarrollo local (opcional)

```bash
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py  # corre en http://0.0.0.0:8080
```

---

## 📑 Endpoints principales

| Método | Ruta     | Descripción                  |
| ------ | -------- | ---------------------------- |
| POST   | `/parse` | Recibe texto y devuelve JSON |

---

## 📊 Modelos comparados

Para elegir el modelo se evaluaron varios pesos GGUF. Los resultados
con métricas de velocidad y precisión se encuentran en
[docs/modelos_comparados.md](docs/modelos_comparados.md). El modelo por defecto (`Nous-Hermes-2-Mistral-7B-DPO.Q4_K_M.gguf`)
mostró la mejor relación calidad/recursos en nuestras pruebas.

---

> Última actualización: 2025-07-29
