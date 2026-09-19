# 📏 Estándares de Ingeniería de Software y Clean Code

Volver al [[00-Map-Of-Content]]

---

## 🛡️ Reglas Obligatorias de Desarrollo

### 1. Modularidad Estricta (< 150-200 líneas por archivo)
- **Prohibición de Archivos Monolíticos:** Ningún archivo debe concentrar múltiples responsabilidades (Anti God-Class).
- Desacoplar en clases de acción (Action Classes), capas de servicio, DTOs inmutables y Custom Hooks.
- Si una clase supera las 150 líneas, refactorizarla inmediatamente en submódulos especializados.

### 2. Cero Código "Quemado" (Zero Hardcoding)
- Prohibido quemar IDs de usuarios, URLs absolutas o constantes numéricas sin significado.
- Todo servicio externo, puerto o configuración debe consumirse mediante variables de entorno (`.env`) y tiparse en archivos de configuración centralizados.
- Usar Enums fuertemente tipados (C# Backed Enums / TypeScript Enums) para estados y roles.

### 3. Blindaje Anti-Bots y Seguridad Perimetral (Regla 8)
- **Rate Limiting Nativo por IP (`Microsoft.AspNetCore.RateLimiting`):**
  - **Límite Global:** 300 peticiones por minuto por IP (holgura para navegación y carga de celdas 3D).
  - **Límite Estricto en Análisis Pesados (`HeavyAnalysis`):** 60 peticiones por minuto por IP para endpoints de cálculo de Mann-Kendall y Sen's Slope.
  - **Respuesta 429 Estandarizada:** Rechazo en microsegundos con código HTTP `429 Too Many Requests` y payload JSON estructurado.
- **Validación Perimetral de Cabeceras:** Exigencia de cabecera `User-Agent` obligatoria (> 3 caracteres). Bloqueo de scanners maliciosos conocidos (`sqlmap`, `nikto`, `masscan`, `wpscan`, `zgrab`, `nmap`) con `403 Forbidden`.
- **Trampas Honeypot Invisibles:** Campo invisible `X-Honeypot-Token` que aborta con `400 Bad Request` antes de procesar transacciones.
- **Defensa Anti-Slowloris:** Timeout de 15 segundos por petición para evitar que conexiones lentas congelen sockets del servidor.

### 4. Cobertura de Pruebas Unitarias
- Toda lógica matemática (Mann-Kendall, Sen's Slope, Z-Scores) debe contar con tests unitarios automatizados contra datos de control oficiales de la NASA.

### 5. Documentación Viva: Actualización Obligatoria en Cada Cambio o Fix
- **Regla Estricta:** Cualquier ajuste de arquitectura, corrección de bugs (fixes), nuevos endpoints o cambios de modelos debe actualizar de inmediato las notas técnicas correspondientes en `docs/obsidian/` y `README.md`.
- **Prohibido** finalizar tareas dejando código desfasado con respecto a la documentación. Mantener trazabilidad viva para todo el equipo.
