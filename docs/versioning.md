# Guía de Versionado

Usa **Semantic Versioning**: `MAJOR.MINOR.PATCH`

## Cuándo Incrementar

- **MAJOR** (1.0.0 → 2.0.0): Cambios incompatibles
- **MINOR** (0.1.0 → 0.2.0): Nuevas funcionalidades
- **PATCH** (0.1.3 → 0.1.4): Bug fixes

## Workflow

### 1. Actualizar Versión

Edita `package.json` en frontend y backend:

```json
{
	"version": "0.1.4"
}
```

### 2. Commit

```bash
git add .
git commit -m "feat: nueva funcionalidad (v0.2.0)"
git push
```

### 3. Tag (Opcional)

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

## Prefijos de Commit

- `feat:` → Nueva funcionalidad (MINOR)
- `fix:` → Corrección de bug (PATCH)
- `refactor:` → Refactorización (PATCH)
- `style:` → Cambios de UI (PATCH)
- `BREAKING:` → Cambio incompatible (MAJOR)

## Ejemplos

```bash
# Nueva feature
git commit -m "feat: agregar exportación de tickets (v0.2.0)"

# Bug fix
git commit -m "fix: corregir modal de confirmación (v0.1.4)"

# Breaking change
git commit -m "BREAKING: migrar a nueva API (v2.0.0)"
```

## Sincronización

Frontend y backend deben tener la misma versión cuando se liberan juntos.
