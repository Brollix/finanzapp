# Prompt: Estrategia de Producto y Negocio para FinanzApp (Argentina)

## Contexto del Proyecto

Estoy desarrollando **FinanzApp**, una aplicación móvil (React Native + Expo) para Argentina que permite escanear tickets de supermercado usando OCR (AWS Textract) y procesamiento con IA (AWS Bedrock - Claude Haiku).

### Estado Actual

- ✅ **MVP funcional**: Escaneo de tickets, extracción de datos, almacenamiento en Supabase
- ✅ **Tecnología validada**: Costo por ticket procesado: USD 0.003 (muy bajo)
- ✅ **Precisión alta**: 100% de items extraídos correctamente en tests
- ✅ **Infraestructura**: Backend en AWS (EC2, RDS), frontend en Expo, base de datos Supabase

### Modelo de Negocio Actual

**Plan Básico - USD 3/mes** (ARS ~3,000/mes)

- 100 tickets/mes (~3 tickets/día)
- Costo operativo: USD 0.79/usuario
- Ganancia neta: USD 2.21/usuario (73.7% margen)

**Plan Premium - USD 5/mes** (ARS ~5,000/mes)

- 300 tickets/mes (~10 tickets/día)
- Costo operativo: USD 1.66/usuario
- Ganancia neta: USD 3.34/usuario (66.8% margen)

**Break-even**: 31 usuarios (mix 70% básico / 30% premium)

---

## El Problema

**Escanear tickets NO es suficiente como propuesta de valor.** Necesito definir:

1. **¿Qué problema real estoy resolviendo para argentinos?**
2. **¿Qué features adicionales necesito para que la gente pague USD 3-5/mes?**
3. **¿Cómo me diferencio de apps de finanzas personales existentes?**

---

## Contexto Argentino Específico

### Realidades del Mercado Argentino

1. **Inflación alta y volátil** en 2025 hubo 40% +- anual

   - Los precios cambian semanalmente
   - La gente necesita saber cuánto suben SUS productos específicos
   - El índice oficial (INDEC) no refleja la realidad de cada persona

2. **Economía informal y efectivo**

   - Mucha gente cobra en efectivo o tiene ingresos variables
   - Difícil hacer presupuestos tradicionales
   - Necesitan control simple y rápido

3. **Cultura de ahorro defensivo**

   - La gente busca "estirar" el sueldo
   - Comparar precios entre supermercados es común
   - Ofertas y promociones son críticas

4. **Poder adquisitivo limitado**

   - USD 3-5/mes debe justificarse con ahorro real
   - La app debe "pagarse sola" ahorrándole dinero al usuario

5. **Supermercados principales**
   - Disco, Carrefour, Coto, Día, Walmart, Jumbo
   - Cada uno con precios muy diferentes
   - Promociones con tarjetas específicas

### Competencia

- **Apps de finanzas**: Fintonic, Ualá, Mercado Pago (no escanean tickets)
- **Apps de tickets**: Pocas en Argentina, ninguna con análisis profundo
- **Excel/Google Sheets**: Muchos lo hacen manual (tedioso)

---

## Lo Que Necesito

Ayudame a diseñar una **estrategia de producto** que:

### 1. Defina Features Clave (Priorizado)

Necesito saber:

- ¿Qué 3-5 features son CRÍTICAS para el MVP mejorado?
- ¿Qué features justifican el Plan Básico (USD 3/mes)?
- ¿Qué features premium justifican USD 5/mes?
- ¿Qué features puedo dejar para después?

**Considerá**:

- Costo de desarrollo (tengo recursos limitados)
- Impacto en retención de usuarios
- Diferenciación vs competencia
- Facilidad de explicar el valor

### 2. Propuesta de Valor Clara

Necesito un **pitch de 1 línea** que explique por qué alguien pagaría USD 3-5/mes.

**Ejemplos de lo que NO quiero**:

- ❌ "Escaneá tus tickets fácilmente"
- ❌ "Organizá tus gastos"

**Lo que SÍ quiero**:

- ✅ Beneficio concreto y medible
- ✅ Específico para Argentina
- ✅ Que resuene emocionalmente

### 3. Roadmap de Implementación

Dividí las features en fases:

- **Fase 1 (1-2 meses)**: MVP mejorado - mínimo para cobrar
- **Fase 2 (2-3 meses)**: Diferenciación - features únicas
- **Fase 3 (3-4 meses)**: Optimización - features avanzadas
- **Fase 4 (4-6 meses)**: Expansión - features premium/social

### 4. Estrategia de Monetización

- ¿Los precios USD 3 y USD 5 son correctos para Argentina?
- ¿Debería ofrecer plan anual con descuento?
- ¿Freemium limitado o trial de 7 días?
- ¿Qué features van en cada plan?

---

## Ideas Iniciales (Validar/Mejorar)

### Features Potenciales

1. **Dashboard de Gastos**

   - Gastos por categoría automática (IA)
   - Gráficos mensuales
   - Comparación mes a mes

2. **Tracking de Inflación Personal** ⭐

   - "Mi canasta básica" personalizada
   - Gráfico de evolución de precios
   - Alertas de subas significativas
   - **ÚNICO EN ARGENTINA**

3. **Presupuestos y Alertas**

   - Presupuesto mensual por categoría
   - Alertas cuando te pasás
   - Proyección de gasto del mes

4. **Comparador de Precios**

   - Comparar precios entre supermercados
   - Sugerencias de dónde comprar qué
   - Detección de mejores ofertas

5. **Análisis de Ahorro**

   - Detección de gastos innecesarios
   - Sugerencias personalizadas
   - Proyección de ahorro potencial

6. **Compartir Gastos**
   - Grupos (pareja, roommates)
   - División automática
   - Quién le debe a quién

---

## Preguntas Específicas

1. **¿Cuál debería ser mi feature "killer" que justifique el pago?**

   - ¿Inflación personal? ¿Ahorro automático? ¿Comparador de precios?

2. **¿Cómo segmento los planes?**

   - ¿Por cantidad de tickets o por features?
   - ¿Qué va en básico y qué en premium?

3. **¿Cómo adquiero los primeros 100 usuarios?**

   - ¿Qué canales funcionan en Argentina?
   - ¿Qué mensaje resuena más?

4. **¿Debería enfocarme en un nicho específico primero?**

   - ¿Familias? ¿Jóvenes profesionales? ¿Amas de casa?

5. **¿Cómo mido el éxito?**
   - ¿Qué métricas son críticas?
   - ¿Cuánto ahorro debe generar para justificar el precio?

---

## Output Esperado

Por favor, dame:

1. **Propuesta de Valor** (1-2 líneas)
2. **Top 5 Features Priorizadas** (con justificación)
3. **Segmentación de Planes** (qué va en cada uno)
4. **Roadmap de 4 Fases** (con features específicas)
5. **Estrategia de Go-to-Market** (primeros 100 usuarios)
6. **Métricas Clave** (qué medir para validar product-market fit)

**Formato**: Concreto, accionable, específico para Argentina, considerando el modelo de negocio de USD 3-5/mes.
