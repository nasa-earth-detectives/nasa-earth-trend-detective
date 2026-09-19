import { ParticipantProfile, ParticipantRole } from '../types/project.types.js';

/**
 * Catálogo estructurado de los 5 participantes asignados al proyecto NASA
 */
export const NASA_TEAM_PARTICIPANTS: ParticipantProfile[] = [
  {
    id: 'PARTICIPANT_1',
    role: ParticipantRole.BackendLead,
    title: 'Lead Backend & Arquitectura de Software (.NET 10)',
    name: 'July (Backend Lead)',
    primaryTech: ['C# .NET 10', 'Clean Architecture', 'Web API REST', 'FluentValidation'],
    responsibilities: [
      'Estructurar solución .NET 10 y capas Domain/Application/Infrastructure/Api',
      'Configurar inyección de dependencias, OpenAPI/Swagger y Middlewares',
      'Construir DTOs tipados, enums y endpoints de series temporales',
      'Blindaje de APIs con Rate Limiting y control de bots',
    ],
  },
  {
    id: 'PARTICIPANT_2',
    role: ParticipantRole.DataEngineer,
    title: 'Especialista en Datos, ETL & DWH (DuckDB)',
    name: 'Fabriany Medina / Reving (Data Engineer)',
    primaryTech: ['DuckDB OLAP', 'Parquet', 'C# Pipeline ETL', 'NASA EarthData API'],
    responsibilities: [
      'Construir extractores de datasets NASA (GISTEMP, MODIS, GRACE, OCO-2)',
      'Diseñar la tubería ETL de normalización de coordenadas a grillas',
      'Configurar el motor analítico DuckDB columnar embebido',
      'Optimizar consultas analíticas multianuales a tiempos < 50ms',
    ],
  },
  {
    id: 'PARTICIPANT_3',
    role: ParticipantRole.DataScientist,
    title: 'Científico de Datos & Computación Matemática',
    name: 'Johan Sebastian Olaya Reyes (Data Scientist)',
    primaryTech: ['Mann-Kendall Test', "Sen's Slope", 'Z-Score Normalization', 'Statistics'],
    responsibilities: [
      'Implementar el algoritmo matemático de Mann-Kendall (S, Var(S), Z, p-value)',
      'Implementar el Estimador de Pendiente de Sen para tasas de cambio por década',
      'Desarrollar el Motor de Tendencias Opuestas (Opposing Trends Engine)',
      'Crear suites de pruebas matemáticas contra datos de validación NASA',
    ],
  },
  {
    id: 'PARTICIPANT_4',
    role: ParticipantRole.FrontendSpecialist,
    title: 'Especialista de 3D WebGL (Globe.gl & Three.js)',
    name: 'Diego Arias (3D WebGL Specialist)',
    primaryTech: ['Globe.gl', 'Three.js', 'WebGL', 'NASA Textures', 'Shaders'],
    responsibilities: [
      'Configurar entorno y renderizar globo terrestre interactivo a 60 FPS',
      'Implementar capas de hexágonos 3D dinámicos y mapas de calor (heatmaps)',
      'Construir anillos de pulso (ripples) para hotspots y arcos de teleconexión',
      'Optimización de rendimiento de GPU y memoria de texturas',
    ],
  },
  {
    id: 'PARTICIPANT_5',
    role: ParticipantRole.UiUxQaPitch,
    title: 'Frontend Lead, Diseñador UI/UX & Pitch NASA',
    name: 'Brayan Stid Cortés Lombana (Frontend & Pitch)',
    primaryTech: ['React 19', 'TypeScript', 'Tailwind CSS', 'Glassmorphism', 'Storytelling'],
    responsibilities: [
      'Diseñar e implementar interfaz en Modo Oscuro Espacial con Glassmorphism',
      'Construir panel lateral "Inspector de Detective" y selector Time-Slider (2000-2026)',
      'Elaborar el Modal Guía del Detective con explicación científica simple',
      'Producir el Storytelling, diapositivas y video/demo del Pitch para el jurado',
    ],
  },
];
