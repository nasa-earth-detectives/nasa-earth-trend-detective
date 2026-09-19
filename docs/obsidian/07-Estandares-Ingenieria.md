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

### 3. Blindaje Anti-Bots y Seguridad Perimetral
- Endpoints de API protegidos con Rate Limiting por IP.
- Validación perimetral de cabeceras `User-Agent`.
- Trampas Honeypot invisibles en formularios públicos.

### 4. Cobertura de Pruebas Unitarias
- Toda lógica matemática (Mann-Kendall, Sen's Slope, Z-Scores) debe contar con tests unitarios automatizados contra datos de control oficiales de la NASA.
