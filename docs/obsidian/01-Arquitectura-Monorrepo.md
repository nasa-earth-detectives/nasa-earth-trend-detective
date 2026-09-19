# 🏛️ Arquitectura del Monorrepo

Volver al [[00-Map-Of-Content]]

---

## 📐 Visión de Arquitectura

El proyecto adopta un enfoque de **Monorrepo Unificado**, estructurado bajo el estándar de modularidad desacoplada comprobado en producción:

### 📦 Estructura de Directorios

#### 1. `frontend/` (Frontend React 19 + TypeScript + Vite)
Organización modular por capas de responsabilidad única (*Smart vs Dumb Components* < 150 líneas):
- **`components/`**: Componentes visuales reutilizables.
  - `Globe/GlobeViewer.tsx`: Contenedor 3D WebGL / Three.js para renderizado esférico a 60 FPS.
  - `Controls/TimeSlider.tsx`: Control de línea de tiempo satelital interactiva.
  - `Cards/MetricCard.tsx`: Tarjetas de variables biofísicas con tendencias estadísticas.
  - `Common/Header.tsx`: Encabezado con monitor de estado en tiempo real.
- **`pages/`**: Vistas completas de la aplicación (`DashboardPage.tsx`).
- **`hooks/`**: Custom Hooks desacoplados (`useGlobeData.ts`, `useTrendFilter.ts`).
- **`services/`**: Clientes de comunicación HTTP (`apiClient.ts`, `trendService.ts`).
- **`types/`**: Interfaces tipadas (`climate.types.ts`, `trend.types.ts`).
- **`utils/`**: Funciones puras de cálculo (`colorScales.ts`, `dateUtils.ts`).

#### 2. `backend/` (Backend .NET 10 & DuckDB OLAP)
Clean Architecture con convención explícita de `Interfaces/` e `Implements/`:
- **`NasaTrendDetective.Domain`**:
  - `Entities/`: Modelos de dominio (`TrendObservation.cs`).
  - `Enums/`: Enumeraciones tipadas de variables climáticas (`ClimateVariable.cs`).
- **`NasaTrendDetective.Application`**:
  - `Interfaces/`: Contratos de servicios (`ITrendAnalysisService.cs`).
  - `Implements/`: Lógica matemática y de negocio (`TrendAnalysisService.cs`).
  - `DTOs/`: Objetos de transferencia de datos (`TrendQueryDto.cs`, `TrendResultDto.cs`).
- **`NasaTrendDetective.Infrastructure`**:
  - `Interfaces/`: Contrato de persistencia (`IDuckDbRepository.cs`).
  - `Implements/`: Motor analítico columnar embebido (`DuckDbRepository.cs`).
- **`NasaTrendDetective.Api`**:
  - `Controllers/`: Controladores REST delgados (`TrendsController.cs`, `HealthController.cs`).
  - `Middlewares/`: Blindaje perimetral anti-bots y honeypot (`BotDetectionMiddleware.cs`).

#### 3. `packages/shared/` (Contratos Compartidos)
- Modelos biofísicos y DTOs comunes vinculados mediante workspaces de npm.

---

## 🔗 Enlaces Relacionados
- [[02-Estrategia-Git-3-Ramas]]
- [[07-Estandares-Ingenieria]]
- [[08-Contenedores-Docker]]
