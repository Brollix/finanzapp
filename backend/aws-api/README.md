# FinanzApp - AWS API Backend

Backend en Node.js/Express que integra **AWS Textract** (OCR), **AWS Bedrock** (LLM) y **Supabase**.

## Quick Start

1.  **Instalar dependencias:**

    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Crea un archivo `.env` en `backend/aws-api/` con lo siguiente:

    ```ini
    # Servidor
    PORT=8080
    NODE_ENV=development

    # AWS Credenciales (IAM User con permisos Textract y Bedrock)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=tu-access-key
    AWS_SECRET_ACCESS_KEY=tu-secret-key

    # AWS Bedrock
    BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

    # Supabase
    SUPABASE_URL=https://tu-proyecto.supabase.co
    SUPABASE_ANON_KEY=tu-anon-key
    SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
    ```

3.  **Correr en desarrollo:**
    ```bash
    npm run dev
    ```

## Scripts

- `npm run dev`: Inicia servidor con hot-reload.
- `npm run build`: Compila TypeScript.
- `npm start`: Inicia versión compilada.

## Arquitectura

- **Textract**: Extrae texto crudo de imágenes.
- **Bedrock (Claude)**: Procesa el texto y lo estructura en JSON.
- **Supabase**: Base de datos y Auth.
