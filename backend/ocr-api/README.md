# OCR API – Finanzapp

Convierte imágenes de tickets en texto mediante **PaddleOCR** y expone un endpoint REST con **FastAPI**.

---

## ⚙️ Tecnologías

| Componente | Stack |
| ---------- | ----- |
| Framework  | FastAPI |
| OCR Engine | PaddleOCR |
| Idioma     | Python 3.10 |

---

## 🚀 Ejecución rápida (Docker)

```bash
# Desde backend/
docker compose up --build ocr-api
```
Endpoint disponible en `http://localhost:8000/ocr`.

---

## 🛠️ Desarrollo local (opcional)

```bash
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://0.0.0.0:8000
```

---

## 📑 Endpoint principal

| Método | Ruta  | Descripción                 |
| ------ | ----- | --------------------------- |
| POST   | `/ocr` | Recibe imagen y devuelve texto |

---

> Última actualización: 2025-07-29
