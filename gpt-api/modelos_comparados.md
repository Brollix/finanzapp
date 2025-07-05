**Para extracción automática: Mistral 7B Instruct v0.2. Para chat en español: Nous Hermes 2.**


## 1. Nous Hermes 2 Mistral 7B
- **Base:** Mistral 7B
- **Fine-tuning:** Instrucciones, conversación, roleplay, datasets multilingües (foco en español)
- **Ventajas:**
  - Excelente comprensión de español y prompts complejos
  - Muy bueno para chat, roleplay y tareas generales
  - Creativo y flexible
- **Desventajas:**
  - A veces agrega explicaciones o texto extra aunque se pida solo JSON
  - Puede "decorar" la respuesta, dificultando el parsing automático

## 2. Mistral 7B Instruct v0.2
- **Base:** Mistral 7B
- **Fine-tuning:** Instrucciones precisas, respuestas concisas y estructuradas (JSON), minimiza texto adicional
- **Ventajas:**
  - Devuelve exactamente lo que se le pide (ej: solo JSON)
  - Menos tendencia a agregar texto extra
  - Muy robusto para extracción y formateo automático
  - Igual de rápido y eficiente
- **Desventajas:**
  - Español muy bueno, pero no tan "afinadamente argentino" como Nous Hermes
  - Menos creativo para roleplay

## Resumen visual

| Modelo                      | Precisión JSON | Español | Chat/Roleplay | Respuestas limpias | Velocidad |
|-----------------------------|:-------------:|:-------:|:-------------:|:------------------:|:---------:|
| Nous Hermes 2 Mistral 7B    |     Muy buena | Excelente|  Excelente    |    Buena           |   Alta    |
| Mistral 7B Instruct v0.2    |   Excelente   |   Muy buena |  Buena       |  Excelente         |   Alta    |

## Recomendación
- **Para extracción estructurada y automatización:** Mistral 7B Instruct v0.2
- **Para prompts complejos y español coloquial:** Nous Hermes 2 Mistral 7B

---

¿Dónde descargar?
- [TheBloke en HuggingFace](https://huggingface.co/TheBloke)
  - `nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf`
  - `mistral-7b-instruct-v0.2.Q4_K_M.gguf`
