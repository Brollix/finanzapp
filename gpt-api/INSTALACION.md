# Instalación de dependencias

## Recomendación
Para evitar errores en Windows, **recomiendo usar CMD o PowerShell** para activar el entorno virtual y luego instalar las dependencias.

---

## Opción 1: CMD o PowerShell (recomendado)

1. Crear el entorno virtual (solo la primera vez):
   ```cmd
   python -m venv venv
   ```
2. Activar el entorno virtual:
   ```cmd
   venv\Scripts\activate
   ```
3. Instalar dependencias:
   ```cmd
   pip install -r requirements.txt
   ```

---

## Opción 2: Bash (Git Bash, MINGW64)

1. Crear el entorno virtual:
   ```bash
   python -m venv venv
   ```
2. Activar el entorno virtual:
   ```bash
   source venv/Scripts/activate
   ```
   > Si falla, usa CMD o PowerShell para activar.
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

---

Si tienes problemas, elimina la carpeta `venv` y repite los pasos.
