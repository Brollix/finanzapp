# Servicio OCR de Tickets

Este proyecto expone un endpoint `/ocr` usando FastAPI para recibir imágenes de tickets y devolver el texto reconocido usando Tesseract OCR.

## Requisitos
- Python 3.8+
- Tesseract OCR instalado en el sistema (https://github.com/tesseract-ocr/tesseract)

## Instalación

```bash
pip install -r requirements.txt
```

## Levantar el servidor

```bash
uvicorn main:app --reload
```

## Probar el endpoint

Puedes usar curl o Postman:

```bash
curl -X POST "http://localhost:8000/ocr" -F "file=@examples/tu_ticket.jpg"
```

El resultado será un JSON con el texto reconocido.
