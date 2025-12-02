# Guía Detallada: Configuración AWS + Supabase para FinanzApp

## Requisitos

- Cuenta AWS (gratis en [aws.amazon.com](https://aws.amazon.com))
- Tarjeta de crédito/débito (para verificación AWS)
- Proyecto Supabase existente

---

## Paso 1: Crear Usuario IAM en AWS

### 1.1 Acceder a IAM

1. Ve a [AWS Console](https://console.aws.amazon.com)
2. En la barra de búsqueda negra superior, escribe: **IAM**
3. Haz clic en **IAM** (Identity and Access Management)
4. En el menú lateral izquierdo (naranja), haz clic en **Users**

### 1.2 Crear Usuario

1. Botón naranja **Create user**
2. **User name**: `finanzapp-backend`
3. **NO marques** "Provide user access to AWS Management Console"
   - Solo necesitamos acceso programático, no consola
4. Click **Next**

### 1.3 Configurar Permisos

**Opción Recomendada: Política Personalizada**

1. Selecciona **Attach policies directly**
2. Click **Create policy** (abre nueva pestaña)
3. En la nueva pestaña:
4. Click **Create policy**
5. **Cierra esta pestaña**, vuelve a la creación de usuario
6. Click el botón **refresh** (junto a "Create policy")
7. En el buscador, escribe: `FinanzAppBackendPolicy`
8. Marca la casilla junto a **FinanzAppBackendPolicy**
9. Click **Next** → **Create user**

---

## Paso 2: Generar Access Keys

### 2.1 Crear Access Key

1. Click en el usuario `finanzapp-backend` que acabas de crear
2. Pestaña **Security credentials**
3. Scroll down hasta **Access keys**
4. Click **Create access key**

### 2.2 Seleccionar Tipo de Access Key

**MUY IMPORTANTE - Selecciona la opción correcta:**

Verás varias opciones con círculos (radio buttons):

**SELECCIONA ESTA:**

```
( ) Application running outside AWS
   You want to use this access key to enable an application
   running outside of AWS to access your AWS account
```

**NO SELECCIONES:**

- Command Line Interface (CLI) - Para AWS CLI
- Local code - Para desarrollo local
- Third-party service - Para servicios externos
- Other - Otros casos

**Pasos:**

1. Click en el círculo junto a **"Application running outside AWS"**
2. Marca la casilla: **"I understand the above recommendation..."**
3. Click **Next**

### 2.3 Agregar Descripción

1. **Description tag value**: `FinanzApp Backend API`
2. Click **Create access key**

### 2.4 COPIAR CREDENCIALES (CRÍTICO)

**SOLO VERÁS EL SECRET KEY UNA VEZ**

Verás una pantalla así:

```
Access key created

Access key ID
AKIAIOSFODNN7EXAMPLE        [Copy]

Secret access key
[Show] ← CLICK AQUÍ PRIMERO
```

**PASOS EXACTOS:**

1. Click en **[Copy]** junto a **Access key ID**
2. Abre `backend/aws-api/.env` en tu editor
3. Pega en la línea: `AWS_ACCESS_KEY_ID=PEGA_AQUI`
4. Vuelve a AWS Console
5. Click en **[Show]** junto a **Secret access key**
6. Ahora verás el secret completo
7. Click en **[Copy]** junto al secret key
8. Pega en: `AWS_SECRET_ACCESS_KEY=PEGA_AQUI`
9. Click **Done**

**Alternativa: Descargar CSV**

- Click **Download .csv file**
- Guarda en lugar seguro
- Abre con editor de texto
- Copia valores al `.env`

---

## Paso 3: Habilitar Modelos Bedrock

### 3.1 Ir a Bedrock

1. Barra de búsqueda superior (negra): **Bedrock**
2. Click en **Amazon Bedrock**
3. **VERIFICAR REGIÓN:**
   - Esquina superior derecha, junto a tu nombre
   - Debe decir: **N. Virginia** o **us-east-1**
   - Si dice otra cosa (Ohio, Oregon, etc.):
     - Click en el nombre de la región
     - Busca y selecciona: **US East (N. Virginia)**

### 3.2 Solicitar Acceso a Modelos

1. Menú lateral izquierdo (naranja): **Model access**
2. Botón naranja **Manage model access**
3. Verás una lista larga de modelos

### 3.3 Seleccionar Modelos Claude

Busca la sección **Anthropic** (tiene logo de Anthropic):

**MODELO PRINCIPAL (OBLIGATORIO):**

**Claude 3 Haiku**

- Nombre exacto en la lista: `Claude 3 Haiku`
- Model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Velocidad: Muy rápido (< 1 segundo)
- Costo: Muy bajo ($0.00025 por request)
- **Este es el que usarás por defecto**

**MODELO OPCIONAL (SI NECESITAS MÁS PRECISIÓN):**

**Claude 3.5 Sonnet**

- Nombre exacto: `Claude 3.5 Sonnet`
- Model ID: `anthropic.claude-3-5-sonnet-20240620-v1:0`
- Velocidad: Rápido (1-2 segundos)
- Costo: Alto ($0.003 por request - 12x más caro)
- **Solo para casos que requieran máxima precisión**

**NO NECESITAS:**

- Claude 3 Opus (muy costoso)
- Claude 2.x (versiones antiguas)
- Claude Instant (deprecado)

### 3.4 Confirmar

1. Scroll hasta el final de la página
2. Click botón naranja **Request model access**
3. Verás: "Model access requested"

### 3.5 Verificar Aprobación

1. Espera **5-10 segundos**
2. Click botón **Refresh** (arriba a la derecha)
3. Busca la columna **Access status**
4. Deberías ver:
   - **Access granted** (verde) - Claude 3 Haiku
   - **Access granted** (verde) - Claude 3.5 Sonnet (si lo pediste)

**Si ves "Access requested" (amarillo):**

- Espera 1-2 minutos
- Refresca de nuevo
- Para Claude suele ser instantáneo

---

## Paso 4: Configurar .env

### 4.1 Crear Archivo

```bash
cd backend/aws-api
cp .env.example .env
```

### 4.2 Completar Variables AWS

Abre `.env` y completa:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...tu-key-del-paso-2
AWS_SECRET_ACCESS_KEY=tu-secret-del-paso-2

# Bedrock Model
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

**Valores:**

- `AWS_REGION`: Deja `us-east-1`
- `AWS_ACCESS_KEY_ID`: Tu Access Key del Paso 2
- `AWS_SECRET_ACCESS_KEY`: Tu Secret Key del Paso 2
- `BEDROCK_MODEL_ID`:
  - Para Haiku: `anthropic.claude-3-haiku-20240307-v1:0`
  - Para Sonnet: `anthropic.claude-3-5-sonnet-20240620-v1:0`

---

## Paso 5: Configurar Supabase

### 5.1 Obtener Credenciales

1. Ve a [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. Click **Project Settings** (abajo a la izquierda)
4. Click **API** en el menú lateral

### 5.2 Copiar Valores

**Project URL:**

```
https://abcdefgh.supabase.co
```

- Copia este valor
- Pega en `.env`: `SUPABASE_URL=https://...`

**Project API keys:**

Verás una tabla con varias keys. Busca:

```
anon    public    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Copia la key que dice **anon** y **public**
- Pega en `.env`: `SUPABASE_ANON_KEY=eyJ...`

### 5.3 Crear Tabla

1. Menú lateral: **SQL Editor**
2. Click **New query**
3. Copia y pega TODO este SQL:

```sql
-- Crear tabla de receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  supermarket TEXT,
  datetime TEXT,
  total NUMERIC(10,2),
  items JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

-- RLS (cada usuario solo ve sus tickets)
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts" ON receipts
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own receipts" ON receipts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

4. Click **Run** o presiona `Ctrl+Enter`
5. Deberías ver: "Success. No rows returned"

---

## Paso 6: Verificar

### 6.1 Archivo .env Completo

Tu `.env` debe verse así:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=8080
NODE_ENV=development
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

### 6.2 Probar Backend

```bash
cd backend/aws-api
npm run dev
```

Deberías ver:

```
FinanzApp AWS API running on port 8080
Health check: http://localhost:8080/health
```

**Test:**

```bash
curl http://localhost:8080/health
```

Respuesta esperada:

```json
{
	"status": "healthy",
	"timestamp": "2025-11-22T...",
	"service": "finanzapp-aws-api"
}
```

---

## Checklist Final

- [ ] Usuario IAM creado: `finanzapp-backend`
- [ ] Política adjuntada: `FinanzAppBackendPolicy`
- [ ] Access Keys copiadas al `.env`
- [ ] Región verificada: `us-east-1`
- [ ] Claude 3 Haiku habilitado (Access granted)
- [ ] Supabase URL y Anon Key en `.env`
- [ ] Tabla `receipts` creada en Supabase
- [ ] Backend inicia sin errores
- [ ] Health check responde OK

---

## Problemas Comunes

**Error: "The security token is invalid"**

- Verifica que copiaste bien las Access Keys
- No debe haber espacios extra en el `.env`

**Error: "AccessDeniedException" en Bedrock**

- Verifica que habilitaste Claude 3 Haiku
- Confirma que estás en región `us-east-1`
- Revisa que el Model ID es exacto

**Error: "Could not connect to Supabase"**

- Verifica URL y Anon Key
- Confirma que el proyecto está activo

---

## Costos

- **Textract**: $0.0015 por ticket
- **Bedrock Haiku**: $0.0005 por ticket
- **Supabase**: Gratis (hasta 500MB)

**Total**: ~$0.002 USD por ticket procesado

---

¡Listo! Tu backend está configurado y listo para procesar tickets.
