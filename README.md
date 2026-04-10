# Trend Dashboard (Panel de Predicción y Análisis de Tendencias)

## Propósito del Proyecto
**Trend Dashboard** es una aplicación web avanzada diseñada para predecir, monitorizar y analizar tendencias de búsqueda utilizando el flujo de datos de Google Trends. 

El propósito principal de este panel es proporcionar a los usuarios herramientas de visualización claras y métricas de análisis técnico (como cruces de Medias Móviles Exponenciales - **EMA**) para identificar de manera anticipada qué términos de búsqueda, productos o temas están ganando tracción. Es la herramienta ideal para analistas de marketing, especialistas en SEO, creadores de contenido e investigadores de mercado que necesitan tomar decisiones estratégicas basadas en el comportamiento de las búsquedas en internet.

## Características Principales
- **Integración con Google Trends**: Consume información actualizada sobre la popularidad de las búsquedas a lo largo del tiempo.
- **Indicadores de Análisis Técnico**: Utiliza algoritmos financieros (como EMA Crossovers) aplicados a los volúmenes de búsqueda para generar señales de compra/interés.
- **Visualización Interactiva de Datos**: Gráficos dinámicos, potentes y personalizables para una fácil interpretación del historial de las tendencias.
- **Arquitectura Robusta**: Llamadas a la API seguras a través del backend para evitar problemas de CORS y proteger la lógica de obtención de datos.

## Lenguajes y Tecnologías Utilizadas
Este proyecto está construido con un stack tecnológico moderno y altamente tipado para asegurar el mejor rendimiento y mantenibilidad:

- **TypeScript**: Funciona como el lenguaje principal, proporcionando tipado estático profundo para prevenir errores y mejorar la experiencia de desarrollo.
- **React (v19)**: Motor fundamental para construir la interfaz de usuario de forma declarativa y mediante componentes.
- **Next.js (v16)**: Framework utilizado tanto para el frontend como para las rutas de API (*App Router*), permitiendo un procesamiento y consumo rápido y seguro de los datos.
- **Recharts**: Biblioteca principal para la visualización de datos, creando gráficos interactivos fluidos.
- **TechnicalIndicators**: Paquete empleado para agregar la lógica matemática que calcula los promedios móviles, fundamental para las predicciones de tendencias.
- **Lucide-React**: Colección de iconos vectoriales SVG para una interfaz visual limpia y consistente.
- **Tailwind CSS**: Empleado para la construcción de una interfaz responsiva, densa y moderna sin abandonar el archivo de componentes.

## Instalación y Ejecución

### Requisitos Previos
- [Node.js](https://nodejs.org/es/) (Se recomienda v20+)
- npm, yarn, pnpm o bun.

### Pasos para el Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd trend-dashboard
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   # o utilizando tu gestor preferido: yarn install / pnpm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Ver la aplicación:**
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador preferido.

## Estructura del Código
- `src/app/api/...`: Contiene la lógica del lado del servidor para interactuar de forma segura con `google-trends-api` y servir los resultados al cliente.
- `src/components/...`: Componentes modulares de React y visualizaciones en Recharts.
- `src/types/...`: Definiciones y declaraciones de interfaces de TypeScript para mantener el tipado estricto en toda la aplicación.

## Contribuciones
Las contribuciones para mejorar la precisión de los cruces de promedios, añadir nuevas fuentes de tendencias o expandir el tablero son más que bienvenidas. Puedes abrir un issue para discutir las propuestas o realizar un *Pull Request* directamente.
