# Dashboard de Incidencias Patrimoniales — Deploy

## URL Pública (GitHub Pages)

🔗 **https://cristiancarreno-debug.github.io/dashboard-incidencias-patrimoniales/**

## Repositorio

📦 https://github.com/cristiancarreno-debug/dashboard-incidencias-patrimoniales

## Actualización de Datos

- Los datos se actualizan **automáticamente cada hora** vía GitHub Actions
- El workflow consulta Jira (proyecto MDSB, tipo Incident) y clasifica por producto/tribu/squad
- También se puede disparar manualmente desde GitHub Actions → "Run workflow"

## Configuración

Los secrets del repositorio contienen las credenciales de Jira:
- `JIRA_EMAIL`: Email de autenticación
- `JIRA_API_TOKEN`: Token de API de Atlassian

## Stack

- Frontend: React 18 + Vite 5 + TypeScript + Tailwind CSS + Recharts
- Datos: Script Node.js que consulta Jira API y genera JSON estático
- Deploy: GitHub Pages con GitHub Actions (cron cada hora)
- Clasificación: Basada en campo "Categoría / Ítem Configuración" (cf[10409])
