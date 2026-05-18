# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Versionamiento Semántico](https://semver.org/lang/es/).

## [No publicado]

### Eliminado
- Se eliminó dependencia `@tanstack/react-query` (no se usaba — el código usa useEffect+setState)
- Se eliminó dependencia `axios` (no se usaba — el código usa fetch nativo)
- Se eliminó dependencia `react-router-dom` (no se usaba — SPA de una sola página)
- Se eliminó `QueryClientProvider` de `main.tsx` (wrapper sin uso real)
