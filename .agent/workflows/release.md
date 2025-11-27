---
description: Workflow para realizar un release: analizar cambios, versionar, taggear y pushear
---

# Workflow: Release

1. Analizar los cambios pendientes (`git status`) y agruparlos en commits lógicos.
2. Revisar la versión actual en `package.json`.
3. Determinar si es necesario un cambio de versión (major, minor, o patch) basado en los cambios realizados.
4. Si se requiere cambio de versión:
   - Actualizar el campo `version` en `package.json`.
   - Crear un commit específico: `git commit -am "chore(release): bump version to X.Y.Z"`.
   - Crear un tag de git: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
5. Si no se requiere cambio de versión, continuar.
6. Pushear los cambios a la rama remota: `git push origin main`.
7. Pushear los tags: `git push --tags`.