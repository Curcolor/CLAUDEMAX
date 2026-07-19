---
name: ui-ux-pro-max
description: "Inteligencia de diseño UI/UX para web y mobile. Incluye 50+ estilos (styles), 161 paletas de color, 57 combinaciones tipográficas (font pairings), 161 tipos de producto, 99 guías de UX y 25 tipos de gráfico (chart types) en 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui y HTML/CSS). Acciones: planificar, construir, crear, diseñar, implementar, revisar, arreglar, mejorar, optimizar, potenciar, refactorizar y verificar código de UI/UX (plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check). Proyectos: sitio web, landing page, dashboard, panel de administración, e-commerce, SaaS, portfolio, blog y app móvil (website, admin panel, mobile app). Elementos: botón, modal, navbar, sidebar, card, tabla, formulario y gráfico (button, table, form, chart). Estilos: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism y flat design. Temas: sistemas de color, accesibilidad, animación, layout, tipografía, font pairing, espaciado, estados de interacción, sombra y gradiente (color systems, accessibility, animation, typography, spacing, shadow, gradient). Integraciones: shadcn/ui MCP para búsqueda de componentes y ejemplos. Trigger con \"UI\", \"UX\", \"diseño\", \"design\", \"interfaz\"."
---

# UI/UX Pro Max - Inteligencia de Diseño

Guía de diseño integral para aplicaciones web y mobile. Contiene 50+ estilos, 161 paletas de color, 57 combinaciones tipográficas, 161 tipos de producto con reglas de razonamiento, 99 guías de UX, y 25 tipos de gráfico en 10 stacks tecnológicos. Base de datos consultable con recomendaciones basadas en prioridad.

## Cuándo Aplicarla

Esta skill debe usarse cuando la tarea involucra **estructura de UI, decisiones de diseño visual, patrones de interacción, o control de calidad de experiencia de usuario**.

### Uso obligatorio

Esta skill debe invocarse en las siguientes situaciones:

- Diseñar páginas nuevas (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Crear o refactorizar componentes de UI (botones, modales, formularios, tablas, gráficos, etc.)
- Elegir esquemas de color, sistemas tipográficos, estándares de espaciado, o sistemas de layout
- Revisar código de UI en cuanto a experiencia de usuario, accesibilidad, o consistencia visual
- Implementar estructuras de navegación, animaciones, o comportamiento responsive
- Tomar decisiones de diseño a nivel de producto (estilo, jerarquía de información, expresión de marca)
- Mejorar la calidad percibida, claridad, o usabilidad de las interfaces

### Uso recomendado

Esta skill se recomienda en las siguientes situaciones:

- La UI "no se ve suficientemente profesional" pero la razón no está clara
- Se recibe feedback sobre usabilidad o experiencia
- Optimización de calidad de UI antes del lanzamiento
- Alinear el diseño entre plataformas (Web / iOS / Android)
- Construir design systems o librerías de componentes reutilizables

### Cuándo omitirla

Esta skill no es necesaria en las siguientes situaciones:

- Desarrollo de lógica puramente backend
- Trabajo que solo involucra diseño de API o de base de datos
- Optimización de rendimiento no relacionada con la interfaz
- Trabajo de infraestructura o DevOps
- Scripts o automatizaciones no visuales

**Criterio de decisión**: si la tarea va a cambiar cómo una feature **se ve, se siente, se mueve, o se interactúa con ella**, esta skill debería usarse.

## Categorías de Reglas por Prioridad

*Para referencia humana/IA: sigue la prioridad 1→10 para decidir en qué categoría de reglas enfocarte primero; usa `--domain <Domain>` para consultar detalles cuando haga falta. Los scripts no leen esta tabla.*

| Prioridad | Categoría | Impacto | Dominio | Verificaciones clave (imprescindibles) | Anti-patrones (evitar) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accesibilidad | CRÍTICO | `ux` | Contraste 4.5:1, texto alternativo, navegación por teclado, aria-labels | Quitar los focus rings, botones solo-icono sin labels |
| 2 | Touch e Interacción | CRÍTICO | `ux` | Tamaño mín. 44×44px, espaciado 8px+, feedback de carga | Depender solo del hover, cambios de estado instantáneos (0ms) |
| 3 | Rendimiento | ALTO | `ux` | WebP/AVIF, lazy loading, reservar espacio (CLS &lt; 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Selección de estilo | ALTO | `style`, `product` | Coincidir estilo con tipo de producto, consistencia, iconos SVG (no emoji) | Mezclar flat y skeuomorphic al azar, emoji como iconos |
| 5 | Layout y Responsive | ALTO | `ux` | Breakpoints mobile-first, viewport meta, sin scroll horizontal | Scroll horizontal, anchos de contenedor fijos en px, deshabilitar zoom |
| 6 | Tipografía y Color | MEDIO | `typography`, `color` | Base 16px, line-height 1.5, tokens de color semánticos | Texto &lt; 12px en body, gris sobre gris, hex crudo en componentes |
| 7 | Animación | MEDIO | `ux` | Duración 150–300ms, el movimiento transmite significado, continuidad espacial | Animación puramente decorativa, animar width/height, sin reduced-motion |
| 8 | Formularios y Feedback | MEDIO | `ux` | Labels visibles, error cerca del campo, texto de ayuda, disclosure progresivo | Label solo-placeholder, errores solo arriba, sobrecarga inicial |
| 9 | Patrones de Navegación | ALTO | `ux` | Back predecible, bottom nav ≤5, deep linking | Nav sobrecargado, comportamiento de back roto, sin deep links |
| 10 | Gráficos y Datos | BAJO | `chart` | Leyendas, tooltips, colores accesibles | Depender solo del color para transmitir significado |

## Referencia Rápida

### 1. Accesibilidad (CRÍTICO)

- `color-contrast` - Ratio mínimo 4.5:1 para texto normal (texto grande 3:1); Material Design
- `focus-states` - Focus rings visibles en elementos interactivos (2–4px; Apple HIG, MD)
- `alt-text` - Texto alternativo descriptivo para imágenes con significado
- `aria-labels` - aria-label en botones solo-icono; accessibilityLabel en nativo (Apple HIG)
- `keyboard-nav` - El orden de tab coincide con el orden visual; soporte completo de teclado (Apple HIG)
- `form-labels` - Usar label con atributo for
- `skip-links` - Skip to main content para usuarios de teclado
- `heading-hierarchy` - h1→h6 secuencial, sin saltar nivel
- `color-not-only` - No transmitir información solo por color (agregar icono/texto)
- `dynamic-type` - Soportar el escalado de texto del sistema; evitar truncar mientras el texto crece (Apple Dynamic Type, MD)
- `reduced-motion` - Respetar prefers-reduced-motion; reducir/deshabilitar animaciones cuando se solicite (Apple Reduced Motion API, MD)
- `voiceover-sr` - accessibilityLabel/accessibilityHint con significado; orden de lectura lógico para VoiceOver/lectores de pantalla (Apple HIG, MD)
- `escape-routes` - Proveer cancelar/volver en modales y flujos multi-paso (Apple HIG)
- `keyboard-shortcuts` - Preservar atajos del sistema y de accesibilidad; ofrecer alternativas de teclado para drag-and-drop (Apple HIG)

### 2. Touch e Interacción (CRÍTICO)

- `touch-target-size` - Mín. 44×44pt (Apple) / 48×48dp (Material); extender el área de toque más allá de los límites visuales si hace falta
- `touch-spacing` - Gap mínimo de 8px/8dp entre touch targets (Apple HIG, MD)
- `hover-vs-tap` - Usar click/tap para interacciones primarias; no depender solo del hover
- `loading-buttons` - Deshabilitar el botón durante operaciones async; mostrar spinner o progreso
- `error-feedback` - Mensajes de error claros cerca del problema
- `cursor-pointer` - Agregar cursor-pointer a elementos clicables (Web)
- `gesture-conflicts` - Evitar swipe horizontal en el contenido principal; preferir scroll vertical
- `tap-delay` - Usar touch-action: manipulation para reducir el delay de 300ms (Web)
- `standard-gestures` - Usar gestos estándar de la plataforma de forma consistente; no redefinirlos (p. ej. swipe-back, pinch-zoom) (Apple HIG)
- `system-gestures` - No bloquear gestos del sistema (Control Center, swipe-back, etc.) (Apple HIG)
- `press-feedback` - Feedback visual al presionar (ripple/highlight; state layers de MD)
- `haptic-feedback` - Usar haptics para confirmaciones y acciones importantes; evitar el abuso (Apple HIG)
- `gesture-alternative` - No depender solo de interacciones por gesto; siempre proveer controles visibles para acciones críticas
- `safe-area-awareness` - Mantener los touch targets primarios alejados del notch, Dynamic Island, la barra de gestos y los bordes de pantalla
- `no-precision-required` - Evitar exigir taps con precisión de pixel en iconos pequeños o bordes finos
- `swipe-clarity` - Las acciones de swipe deben mostrar una affordance o hint clara (chevron, label, tutorial)
- `drag-threshold` - Usar un umbral de movimiento antes de iniciar el drag para evitar drags accidentales

### 3. Rendimiento (ALTO)

- `image-optimization` - Usar WebP/AVIF, imágenes responsive (srcset/sizes), lazy load de assets no críticos
- `image-dimension` - Declarar width/height o usar aspect-ratio para prevenir layout shift (Core Web Vitals: CLS)
- `font-loading` - Usar font-display: swap/optional para evitar texto invisible (FOIT); reservar espacio para reducir el layout shift (MD)
- `font-preload` - Precargar solo las fuentes críticas; evitar abusar del preload en cada variante
- `critical-css` - Priorizar el CSS above-the-fold (CSS crítico inline o hoja de estilos cargada temprano)
- `lazy-loading` - Lazy load de componentes no-hero vía dynamic import / code-splitting a nivel de ruta
- `bundle-splitting` - Dividir el código por ruta/feature (React Suspense / dynamic de Next.js) para reducir la carga inicial y el TTI
- `third-party-scripts` - Cargar scripts de terceros con async/defer; auditar y eliminar los innecesarios (MD)
- `reduce-reflows` - Evitar lecturas/escrituras de layout frecuentes; agrupar lecturas del DOM y luego escrituras
- `content-jumping` - Reservar espacio para contenido asíncrono y evitar saltos de layout (Core Web Vitals: CLS)
- `lazy-load-below-fold` - Usar loading="lazy" para imágenes y media pesados debajo del fold
- `virtualize-lists` - Virtualizar listas con 50+ elementos para mejorar la eficiencia de memoria y el rendimiento del scroll
- `main-thread-budget` - Mantener el trabajo por frame bajo ~16ms para 60fps; mover tareas pesadas fuera del main thread (HIG, MD)
- `progressive-loading` - Usar skeleton screens / shimmer en vez de spinners bloqueantes largos para operaciones de >1s (Apple HIG)
- `input-latency` - Mantener la latencia de input bajo ~100ms para taps/scrolls (estándar de responsividad de Material)
- `tap-feedback-speed` - Proveer feedback visual dentro de los 100ms posteriores al tap (Apple HIG)
- `debounce-throttle` - Usar debounce/throttle para eventos de alta frecuencia (scroll, resize, input)
- `offline-support` - Proveer mensajería de estado offline y un fallback básico (PWA / mobile)
- `network-fallback` - Ofrecer modos degradados para redes lentas (imágenes de menor resolución, menos animaciones)

### 4. Selección de Estilo (ALTO)

- `style-match` - Hacer coincidir el estilo con el tipo de producto (usar `--design-system` para recomendaciones)
- `consistency` - Usar el mismo estilo en todas las páginas
- `no-emoji-icons` - Usar iconos SVG (Heroicons, Lucide), no emojis
- `color-palette-from-product` - Elegir la paleta según el producto/industria (buscar `--domain color`)
- `effects-match-style` - Sombras, blur, radius alineados con el estilo elegido (glass / flat / clay etc.)
- `platform-adaptive` - Respetar los idiomas de cada plataforma (iOS HIG vs Material): navegación, controles, tipografía, motion
- `state-clarity` - Hacer que los estados hover/pressed/disabled se distingan visualmente sin salirse del estilo (state layers de Material)
- `elevation-consistent` - Usar una escala de elevación/sombra consistente para cards, sheets, modales; evitar valores de sombra al azar
- `dark-mode-pairing` - Diseñar juntas las variantes claro/oscuro para mantener consistentes la marca, el contraste y el estilo
- `icon-style-consistent` - Usar un solo set/lenguaje visual de iconos (grosor de trazo, radio de esquina) en todo el producto
- `system-controls` - Preferir controles nativos/del sistema por sobre controles totalmente custom; personalizar solo cuando la marca lo exija (Apple HIG)
- `blur-purpose` - Usar blur para indicar el dismissal del fondo (modales, sheets), no como decoración (Apple HIG)
- `primary-action` - Cada pantalla debería tener un solo CTA primario; las acciones secundarias visualmente subordinadas (Apple HIG)

### 5. Layout y Responsive (ALTO)

- `viewport-meta` - width=device-width initial-scale=1 (nunca deshabilitar el zoom)
- `mobile-first` - Diseñar mobile-first, y luego escalar hacia tablet y desktop
- `breakpoint-consistency` - Usar breakpoints sistemáticos (p. ej. 375 / 768 / 1024 / 1440)
- `readable-font-size` - Mínimo 16px de texto en body en mobile (evita el auto-zoom de iOS)
- `line-length-control` - Mobile 35–60 caracteres por línea; desktop 60–75
- `horizontal-scroll` - Sin scroll horizontal en mobile; asegurar que el contenido entre en el ancho del viewport
- `spacing-scale` - Usar un sistema de espaciado incremental de 4pt/8dp (Material Design)
- `touch-density` - Mantener el espaciado de componentes cómodo para touch: ni apretado ni causando mis-taps
- `container-width` - Max-width consistente en desktop (max-w-6xl / 7xl)
- `z-index-management` - Definir una escala de z-index por capas (p. ej. 0 / 10 / 20 / 40 / 100 / 1000)
- `fixed-element-offset` - El navbar/bottom bar fijo debe reservar padding seguro para el contenido subyacente
- `scroll-behavior` - Evitar regiones de scroll anidadas que interfieran con la experiencia de scroll principal
- `viewport-units` - Preferir min-h-dvh sobre 100vh en mobile
- `orientation-support` - Mantener el layout legible y operable en modo landscape
- `content-priority` - Mostrar primero el contenido central en mobile; plegar u ocultar el contenido secundario
- `visual-hierarchy` - Establecer jerarquía mediante tamaño, espaciado, contraste — no solo color

### 6. Tipografía y Color (MEDIO)

- `line-height` - Usar 1.5-1.75 para texto de body
- `line-length` - Limitar a 65-75 caracteres por línea
- `font-pairing` - Hacer coincidir las personalidades de la fuente de heading y de body
- `font-scale` - Escala tipográfica consistente (p. ej. 12 14 16 18 24 32)
- `contrast-readability` - Texto más oscuro sobre fondos claros (p. ej. slate-900 sobre blanco)
- `text-styles-system` - Usar el sistema tipográfico de la plataforma: estilos de iOS 11 Dynamic Type / roles de tipo Material 5 (display, headline, title, body, label) (HIG, MD)
- `weight-hierarchy` - Usar font-weight para reforzar la jerarquía: headings en negrita (600–700), body regular (400), labels medium (500) (MD)
- `color-semantic` - Definir tokens de color semánticos (primary, secondary, error, surface, on-surface) en vez de hex crudo en componentes (sistema de color de Material)
- `color-dark-mode` - El modo oscuro usa variantes tonales desaturadas / más claras, no colores invertidos; testear el contraste por separado (HIG, MD)
- `color-accessible-pairs` - Los pares foreground/background deben cumplir 4.5:1 (AA) o 7:1 (AAA); usar herramientas para verificar (WCAG, MD)
- `color-not-decorative-only` - El color funcional (rojo de error, verde de éxito) debe incluir icono/texto; evitar el significado solo-por-color (HIG, MD)
- `truncation-strategy` - Preferir el wrap sobre el truncado; al truncar usar elipsis y proveer el texto completo vía tooltip/expand (Apple HIG)
- `letter-spacing` - Respetar el letter-spacing por defecto de cada plataforma; evitar tracking apretado en texto de body (HIG, MD)
- `number-tabular` - Usar cifras tabulares/monoespaciadas para columnas de datos, precios y timers, para evitar layout shift
- `whitespace-balance` - Usar el whitespace de forma intencional para agrupar elementos relacionados y separar secciones; evitar el clutter visual (Apple HIG)

### 7. Animación (MEDIO)

- `duration-timing` - Usar 150–300ms para micro-interacciones; transiciones complejas ≤400ms; evitar >500ms (MD)
- `transform-performance` - Usar solo transform/opacity; evitar animar width/height/top/left
- `loading-states` - Mostrar skeleton o indicador de progreso cuando la carga supere los 300ms
- `excessive-motion` - Animar máximo 1-2 elementos clave por vista
- `easing` - Usar ease-out al entrar, ease-in al salir; evitar linear en transiciones de UI
- `motion-meaning` - Toda animación debe expresar una relación causa-efecto, no ser solo decorativa (Apple HIG)
- `state-transition` - Los cambios de estado (hover / active / expanded / collapsed / modal) deberían animarse con suavidad, no de golpe
- `continuity` - Las transiciones de página/pantalla deberían mantener continuidad espacial (elemento compartido, slide direccional) (Apple HIG)
- `parallax-subtle` - Usar el parallax con moderación; debe respetar reduced-motion y no causar desorientación (Apple HIG)
- `spring-physics` - Preferir curvas de spring/físicas por sobre linear o cubic-bezier para una sensación natural (animaciones fluidas de Apple HIG)
- `exit-faster-than-enter` - Las animaciones de salida más cortas que las de entrada (~60–70% de la duración de entrada) para sentirse responsivas (motion de MD)
- `stagger-sequence` - Escalonar la entrada de items de lista/grid en 30–50ms por item; evitar revelar todo a la vez o demasiado lento (MD)
- `shared-element-transition` - Usar transiciones de elemento compartido / hero para continuidad visual entre pantallas (MD, HIG)
- `interruptible` - Las animaciones deben ser interrumpibles; un tap/gesto del usuario cancela la animación en curso inmediatamente (Apple HIG)
- `no-blocking-animation` - Nunca bloquear el input del usuario durante una animación; la UI debe seguir interactiva (Apple HIG)
- `fade-crossfade` - Usar crossfade para el reemplazo de contenido dentro del mismo contenedor (MD)
- `scale-feedback` - Escala sutil (0.95–1.05) al presionar cards/botones tapeables; restaurar al soltar (HIG, MD)
- `gesture-feedback` - Drag, swipe y pinch deben dar respuesta visual en tiempo real, siguiendo el dedo (Motion de MD)
- `hierarchy-motion` - Usar la dirección de translate/scale para expresar jerarquía: entrar desde abajo = más profundo, salir hacia arriba = volver (MD)
- `motion-consistency` - Unificar los tokens de duración/easing globalmente; todas las animaciones comparten el mismo ritmo y sensación
- `opacity-threshold` - Los elementos que se desvanecen no deberían quedarse por debajo de 0.2 de opacidad; o se desvanecen del todo o permanecen visibles
- `modal-motion` - Modales/sheets deberían animarse desde su elemento disparador (scale+fade o slide-in) para dar contexto espacial (HIG, MD)
- `navigation-direction` - La navegación hacia adelante anima izquierda/arriba; hacia atrás anima derecha/abajo — mantener la dirección lógicamente consistente (HIG)
- `layout-shift-avoid` - Las animaciones no deben causar reflow de layout ni CLS; usar transform para cambios de posición

### 8. Formularios y Feedback (MEDIO)

- `input-labels` - Label visible por input (no solo-placeholder)
- `error-placement` - Mostrar el error debajo del campo relacionado
- `submit-feedback` - Estado de loading y luego de éxito/error al enviar
- `required-indicators` - Marcar los campos requeridos (p. ej. asterisco)
- `empty-states` - Mensaje y acción útiles cuando no hay contenido
- `toast-dismiss` - Auto-descartar toasts en 3-5s
- `confirmation-dialogs` - Confirmar antes de acciones destructivas
- `input-helper-text` - Proveer texto de ayuda persistente debajo de inputs complejos, no solo placeholder (Material Design)
- `disabled-states` - Los elementos deshabilitados usan opacidad reducida (0.38–0.5) + cambio de cursor + atributo semántico (MD)
- `progressive-disclosure` - Revelar las opciones complejas de forma progresiva; no sobrecargar al usuario desde el inicio (Apple HIG)
- `inline-validation` - Validar al perder el foco (blur, no en cada tecla); mostrar el error solo después de que el usuario termine de escribir (MD)
- `input-type-keyboard` - Usar tipos de input semánticos (email, tel, number) para disparar el teclado móvil correcto (HIG, MD)
- `password-toggle` - Proveer un toggle de mostrar/ocultar para campos de contraseña (MD)
- `autofill-support` - Usar atributos autocomplete / textContentType para que el sistema pueda autocompletar (HIG, MD)
- `undo-support` - Permitir deshacer acciones destructivas o masivas (p. ej. toast de "Deshacer eliminación") (Apple HIG)
- `success-feedback` - Confirmar acciones completadas con un feedback visual breve (check, toast, flash de color) (MD)
- `error-recovery` - Los mensajes de error deben incluir un camino de recuperación claro (reintentar, editar, link de ayuda) (HIG, MD)
- `multi-step-progress` - Los flujos multi-paso muestran un indicador de paso o barra de progreso; permitir navegar hacia atrás (MD)
- `form-autosave` - Los formularios largos deberían auto-guardar borradores para evitar pérdida de datos por un cierre accidental (Apple HIG)
- `sheet-dismiss-confirm` - Confirmar antes de descartar un sheet/modal con cambios sin guardar (Apple HIG)
- `error-clarity` - Los mensajes de error deben indicar la causa + cómo corregirla (no solo "Entrada inválida") (HIG, MD)
- `field-grouping` - Agrupar campos relacionados de forma lógica (fieldset/legend o agrupación visual) (MD)
- `read-only-distinction` - El estado read-only debería ser visual y semánticamente distinto del disabled (MD)
- `focus-management` - Tras un error de envío, autoenfocar el primer campo inválido (WCAG, MD)
- `error-summary` - Para múltiples errores, mostrar un resumen arriba con links de anclaje a cada campo (WCAG)
- `touch-friendly-input` - Altura de input en mobile ≥44px para cumplir con los requisitos de touch target (Apple HIG)
- `destructive-emphasis` - Las acciones destructivas usan el color semántico de peligro (rojo) y están separadas visualmente de las acciones primarias (HIG, MD)
- `toast-accessibility` - Los toasts no deben robar el foco; usar aria-live="polite" para el anuncio en lectores de pantalla (WCAG)
- `aria-live-errors` - Los errores de formulario usan una región aria-live o role="alert" para notificar a los lectores de pantalla (WCAG)
- `contrast-feedback` - Los colores de estado de error y éxito deben cumplir un ratio de contraste de 4.5:1 (WCAG, MD)
- `timeout-feedback` - El timeout de una request debe mostrar feedback claro con opción de reintentar (MD)

### 9. Patrones de Navegación (ALTO)

- `bottom-nav-limit` - La navegación inferior tiene un máximo de 5 items; usar labels con iconos (Material Design)
- `drawer-usage` - Usar drawer/sidebar para navegación secundaria, no para acciones primarias (Material Design)
- `back-behavior` - La navegación hacia atrás debe ser predecible y consistente; preservar el scroll/estado (Apple HIG, MD)
- `deep-linking` - Todas las pantallas clave deben ser alcanzables vía deep link / URL para compartir y para notificaciones (Apple HIG, MD)
- `tab-bar-ios` - iOS: usar Tab Bar inferior para la navegación de nivel superior (Apple HIG)
- `top-app-bar-android` - Android: usar Top App Bar con icono de navegación para la estructura primaria (Material Design)
- `nav-label-icon` - Los items de navegación deben tener icono y label de texto; la nav solo-icono perjudica la descubribilidad (MD)
- `nav-state-active` - La ubicación actual debe resaltarse visualmente (color, peso, indicador) en la navegación (HIG, MD)
- `nav-hierarchy` - La nav primaria (tabs/bottom bar) vs. la nav secundaria (drawer/settings) deben estar claramente separadas (MD)
- `modal-escape` - Modales y sheets deben ofrecer una affordance clara de cerrar/descartar; swipe hacia abajo para descartar en mobile (Apple HIG)
- `search-accessible` - La búsqueda debe ser fácilmente alcanzable (barra superior o tab); proveer queries recientes/sugeridas (MD)
- `breadcrumb-web` - Web: usar breadcrumbs para jerarquías de 3+ niveles de profundidad, para ayudar a la orientación (MD)
- `state-preservation` - Navegar hacia atrás debe restaurar la posición de scroll, el estado de filtros y el input previos (HIG, MD)
- `gesture-nav-support` - Soportar la navegación por gestos del sistema (swipe-back de iOS, predictive back de Android) sin conflictos (HIG, MD)
- `tab-badge` - Usar badges en los items de nav con moderación para indicar no leído/pendiente; limpiar después de que el usuario visite (HIG, MD)
- `overflow-menu` - Cuando las acciones exceden el espacio disponible, usar un menú overflow/más en vez de amontonarlas (MD)
- `bottom-nav-top-level` - El bottom nav es solo para pantallas de nivel superior; nunca anidar sub-navegación dentro de él (MD)
- `adaptive-navigation` - Pantallas grandes (≥1024px) prefieren sidebar; pantallas pequeñas usan bottom/top nav (Material Adaptive)
- `back-stack-integrity` - Nunca resetear silenciosamente el stack de navegación ni saltar inesperadamente al home (HIG, MD)
- `navigation-consistency` - La ubicación de la navegación debe mantenerse igual en todas las páginas; no cambiarla según el tipo de página
- `avoid-mixed-patterns` - No mezclar Tab + Sidebar + Bottom Nav en el mismo nivel de jerarquía
- `modal-vs-navigation` - Los modales no deben usarse para flujos de navegación primaria; rompen el camino del usuario (HIG)
- `focus-on-route-change` - Tras una transición de página, mover el foco a la región de contenido principal para usuarios de lector de pantalla (WCAG)
- `persistent-nav` - La navegación core debe seguir siendo alcanzable desde pantallas profundas; no ocultarla del todo en sub-flujos (HIG, MD)
- `destructive-nav-separation` - Las acciones peligrosas (eliminar cuenta, cerrar sesión) deben estar visual y espacialmente separadas de los items normales de nav (HIG, MD)
- `empty-nav-state` - Cuando un destino de nav no está disponible, explicar por qué en vez de ocultarlo silenciosamente (MD)

### 10. Gráficos y Datos (BAJO)

- `chart-type` - Hacer coincidir el tipo de gráfico con el tipo de dato (tendencia → línea, comparación → barra, proporción → pie/donut)
- `color-guidance` - Usar paletas de color accesibles; evitar pares solo rojo/verde por los usuarios daltónicos (WCAG, MD)
- `data-table` - Proveer una tabla alternativa por accesibilidad; los gráficos solos no son amigables con lectores de pantalla (WCAG)
- `pattern-texture` - Complementar el color con patrones, texturas o formas para que el dato se distinga sin depender del color (WCAG, MD)
- `legend-visible` - Mostrar siempre la leyenda; ubicarla cerca del gráfico, no separada debajo de un scroll (MD)
- `tooltip-on-interact` - Proveer tooltips/etiquetas de dato al hacer hover (Web) o tap (mobile) mostrando los valores exactos (HIG, MD)
- `axis-labels` - Etiquetar los ejes con unidades y una escala legible; evitar labels truncados o rotados en mobile
- `responsive-chart` - Los gráficos deben reflow o simplificarse en pantallas pequeñas (p. ej. barra horizontal en vez de vertical, menos ticks)
- `empty-data-state` - Mostrar un estado vacío con significado cuando no hay datos ("Aún no hay datos" + guía), no un gráfico en blanco (MD)
- `loading-chart` - Usar un placeholder de skeleton o shimmer mientras cargan los datos del gráfico; no mostrar un frame de ejes vacío
- `animation-optional` - Las animaciones de entrada del gráfico deben respetar prefers-reduced-motion; el dato debe ser legible de inmediato (HIG)
- `large-dataset` - Para 1000+ puntos de dato, agregar o muestrear; proveer drill-down para el detalle en vez de renderizar todo (MD)
- `number-formatting` - Usar formato consciente del locale para números, fechas, monedas en ejes y labels (HIG, MD)
- `touch-target-chart` - Los elementos interactivos del gráfico (puntos, segmentos) deben tener un área de tap ≥44pt o expandirse al tocar (Apple HIG)
- `no-pie-overuse` - Evitar pie/donut para >5 categorías; cambiar a gráfico de barras para mayor claridad
- `contrast-data` - Líneas/barras de dato vs. fondo ≥3:1; labels de texto de dato ≥4.5:1 (WCAG)
- `legend-interactive` - Las leyendas deberían ser clicables para alternar la visibilidad de las series (MD)
- `direct-labeling` - Para datasets pequeños, etiquetar los valores directamente en el gráfico para reducir el recorrido visual
- `tooltip-keyboard` - El contenido del tooltip debe ser alcanzable por teclado y no depender solo del hover (WCAG)
- `sortable-table` - Las tablas de datos deben soportar ordenamiento con aria-sort indicando el estado de orden actual (WCAG)
- `axis-readability` - Los ticks de eje no deben estar apretados; mantener un espaciado legible, con auto-skip en pantallas pequeñas
- `data-density` - Limitar la densidad de información por gráfico para evitar sobrecarga cognitiva; dividir en varios gráficos si hace falta
- `trend-emphasis` - Enfatizar las tendencias del dato por sobre la decoración; evitar gradientes/sombras pesadas que oscurezcan el dato
- `gridline-subtle` - Las líneas de grid deben tener bajo contraste (p. ej. gray-200) para no competir con el dato
- `focusable-elements` - Los elementos interactivos del gráfico (puntos, barras, slices) deben ser navegables por teclado (WCAG)
- `screen-reader-summary` - Proveer un resumen de texto o aria-label que describa el insight clave del gráfico para lectores de pantalla (WCAG)
- `error-state-chart` - Un fallo de carga de datos debe mostrar un mensaje de error con acción de reintentar, no un gráfico roto/vacío
- `export-option` - Para productos con muchos datos, ofrecer exportar el gráfico a CSV/imagen
- `drill-down-consistency` - Las interacciones de drill-down deben mantener un camino de vuelta claro y un breadcrumb de jerarquía
- `time-scale-clarity` - Los gráficos de series temporales deben etiquetar claramente la granularidad de tiempo (día/semana/mes) y permitir cambiarla

## Cómo Usarla

Busca en dominios específicos usando la herramienta CLI de abajo.

---

## Prerrequisitos

Verifica si Python está instalado:

```bash
python3 --version || python --version
```

Si Python no está instalado, instálalo según el SO del usuario:

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## Cómo Usar Esta Skill

Usa esta skill cuando el usuario solicite cualquiera de lo siguiente:

| Escenario | Ejemplos de trigger | Empezar desde |
|----------|-----------------|------------|
| **Proyecto / página nueva** | "Build a landing page", "Build a dashboard" | Paso 1 → Paso 2 (design system) |
| **Componente nuevo** | "Create a pricing card", "Add a modal" | Paso 3 (búsqueda de dominio: style, ux) |
| **Elegir estilo / color / fuente** | "What style fits a fintech app?", "Recommend a color palette" | Paso 2 (design system) |
| **Revisar UI existente** | "Review this page for UX issues", "Check accessibility" | Checklist de Referencia Rápida arriba |
| **Corregir un bug de UI** | "Button hover is broken", "Layout shifts on load" | Referencia Rápida → sección relevante |
| **Mejorar / optimizar** | "Make this faster", "Improve mobile experience" | Paso 3 (búsqueda de dominio: ux, react) |
| **Implementar dark mode** | "Add dark mode support" | Paso 3 (dominio: style "dark mode") |
| **Agregar gráficos / data viz** | "Add an analytics dashboard chart" | Paso 3 (dominio: chart) |
| **Buenas prácticas de stack** | "React performance tips", "SwiftUI navigation" | Paso 4 (búsqueda de stack) |

Sigue este flujo de trabajo:

### Paso 1: Analizar los Requisitos del Usuario

Extrae información clave de la solicitud del usuario:
- **Tipo de producto**: Entretenimiento (social, video, música, gaming), Herramienta (scanner, editor, converter), Productividad (task manager, notas, calendario), o híbrido
- **Audiencia objetivo**: usuarios finales (C-end); considera el grupo etario, contexto de uso (transporte, ocio, trabajo)
- **Palabras clave de estilo**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: React Native (el único stack tecnológico de este proyecto)

### Paso 2: Generar el Design System (OBLIGATORIO)

**Empieza siempre con `--design-system`** para obtener recomendaciones completas con su razonamiento:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

Este comando:
1. Busca en dominios en paralelo (product, style, color, landing, typography)
2. Aplica reglas de razonamiento de `ui-reasoning.csv` para elegir las mejores coincidencias
3. Devuelve un design system completo: pattern, style, colors, typography, effects
4. Incluye anti-patrones a evitar

**Ejemplo:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Paso 2b: Persistir el Design System (patrón Master + Overrides)

Para guardar el design system y poder recuperarlo **jerárquicamente entre sesiones**, agrega `--persist`:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

Esto crea:
- `design-system/MASTER.md` — Fuente de Verdad global con todas las reglas de diseño
- `design-system/pages/` — Carpeta para overrides específicos por página

**Con un override específico de página:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

Esto también crea:
- `design-system/pages/dashboard.md` — Desviaciones específicas de esa página respecto al Master

**Cómo funciona la recuperación jerárquica:**
1. Al construir una página específica (p. ej. "Checkout"), primero revisa `design-system/pages/checkout.md`
2. Si el archivo de página existe, sus reglas **sobreescriben** al Master
3. Si no existe, usa `design-system/MASTER.md` exclusivamente

**Prompt de recuperación consciente del contexto:**
```
I am building the [Page Name] page. Please read design-system/MASTER.md.
Also check if design-system/pages/[page-name].md exists.
If the page file exists, prioritize its rules.
If not, use the Master rules exclusively.
Now, generate the code...
```

### Paso 3: Complementar con Búsquedas Detalladas (según haga falta)

Después de obtener el design system, usa búsquedas por dominio para obtener detalles adicionales:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

**Cuándo usar búsquedas detalladas:**

| Necesidad | Dominio | Ejemplo |
|------|--------|---------|
| Patrones de tipo de producto | `product` | `--domain product "entertainment social"` |
| Más opciones de estilo | `style` | `--domain style "glassmorphism dark"` |
| Paletas de color | `color` | `--domain color "entertainment vibrant"` |
| Combinaciones tipográficas | `typography` | `--domain typography "playful modern"` |
| Recomendaciones de gráficos | `chart` | `--domain chart "real-time dashboard"` |
| Buenas prácticas de UX | `ux` | `--domain ux "animation accessibility"` |
| Fuentes alternativas | `typography` | `--domain typography "elegant luxury"` |
| Google Fonts individuales | `google-fonts` | `--domain google-fonts "sans serif popular variable"` |
| Estructura de landing | `landing` | `--domain landing "hero social-proof"` |
| Rendimiento de React Native | `react` | `--domain react "rerender memo list"` |
| A11y de interfaz de app | `web` | `--domain web "accessibilityLabel touch safe-areas"` |
| Prompt de IA / keywords CSS | `prompt` | `--domain prompt "minimalism"` |

### Paso 4: Guías de Stack (React Native)

Obtén buenas prácticas específicas de implementación para React Native:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react-native
```

---

## Referencia de Búsqueda

### Dominios Disponibles

| Dominio | Úsalo para | Palabras clave de ejemplo |
|--------|---------|------------------|
| `product` | Recomendaciones por tipo de producto | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style` | Estilos de UI, colores, efectos | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Combinaciones tipográficas, Google Fonts | elegant, playful, professional, modern |
| `color` | Paletas de color por tipo de producto | saas, ecommerce, healthcare, beauty, fintech, service |
| `landing` | Estructura de página, estrategias de CTA | hero, hero-centric, testimonial, pricing, social-proof |
| `chart` | Tipos de gráfico, recomendaciones de librería | trend, comparison, timeline, funnel, pie |
| `ux` | Buenas prácticas, anti-patrones | animation, accessibility, z-index, loading |
| `google-fonts` | Búsqueda de Google Fonts individuales | sans serif, monospace, japanese, variable font, popular |
| `react` | Rendimiento de React/Next.js | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | Guías de interfaz de app (iOS/Android/React Native) | accessibilityLabel, touch targets, safe areas, Dynamic Type |
| `prompt` | Prompts de IA, keywords CSS | (nombre del estilo) |

### Stacks Disponibles

| Stack | Foco |
|-------|-------|
| `react-native` | Componentes, Navegación, Listas |

---

## Flujo de Ejemplo

**Solicitud del usuario:** "Make an AI search homepage."

### Paso 1: Analizar Requisitos
- Tipo de producto: Herramienta (motor de búsqueda con IA)
- Audiencia objetivo: usuarios finales buscando algo rápido e inteligente
- Palabras clave de estilo: modern, minimal, content-first, dark mode
- Stack: React Native

### Paso 2: Generar el Design System (OBLIGATORIO)

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "AI search tool modern minimal" --design-system -p "AI Search"
```

**Salida:** Design system completo con pattern, style, colors, typography, effects, y anti-patrones.

### Paso 3: Complementar con Búsquedas Detalladas (según haga falta)

```bash
# Obtener opciones de estilo para un producto de tipo herramienta moderna
python3 skills/ui-ux-pro-max/scripts/search.py "minimalism dark mode" --domain style

# Obtener buenas prácticas de UX para la interacción de búsqueda y el loading
python3 skills/ui-ux-pro-max/scripts/search.py "search loading animation" --domain ux
```

### Paso 4: Guías de Stack

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "list performance navigation" --stack react-native
```

**Luego:** sintetiza el design system + las búsquedas detalladas e implementa el diseño.

---

## Formatos de Salida

El flag `--design-system` soporta dos formatos de salida:

```bash
# Caja ASCII (default) - mejor para mostrar en terminal
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown - mejor para documentación
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips para Mejores Resultados

### Estrategia de Query

- Usa **palabras clave multidimensionales** — combina producto + industria + tono + densidad: `"entertainment social vibrant content-dense"` y no solo `"app"`
- Prueba distintas palabras clave para la misma necesidad: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Usa `--design-system` primero para recomendaciones completas, y luego `--domain` para profundizar en cualquier dimensión de la que no estés seguro
- Agrega siempre `--stack react-native` para obtener guías específicas de implementación

### Puntos de Fricción Comunes

| Problema | Qué hacer |
|---------|------------|
| No se puede decidir el estilo/color | Reejecutar `--design-system` con distintas palabras clave |
| Problemas de contraste en dark mode | Referencia Rápida §6: `color-dark-mode` + `color-accessible-pairs` |
| Las animaciones se sienten poco naturales | Referencia Rápida §7: `spring-physics` + `easing` + `exit-faster-than-enter` |
| La UX del formulario es pobre | Referencia Rápida §8: `inline-validation` + `error-clarity` + `focus-management` |
| La navegación se siente confusa | Referencia Rápida §9: `nav-hierarchy` + `bottom-nav-limit` + `back-behavior` |
| El layout se rompe en pantallas pequeñas | Referencia Rápida §5: `mobile-first` + `breakpoint-consistency` |
| Rendimiento / jank | Referencia Rápida §3: `virtualize-lists` + `main-thread-budget` + `debounce-throttle` |

### Checklist Antes de Entregar

- Ejecuta `--domain ux "animation accessibility z-index loading"` como pasada de validación de UX antes de implementar
- Revisa la Referencia Rápida **§1–§3** (CRÍTICO + ALTO) como revisión final
- Prueba en 375px (teléfono pequeño) y en orientación landscape
- Verifica el comportamiento con **reduced-motion** activado y **Dynamic Type** en el tamaño más grande
- Revisa el contraste de dark mode por separado (no asumas que los valores de light mode funcionan)
- Confirma que todos los touch targets sean ≥44pt y que no haya contenido oculto detrás de safe areas

---

## Reglas Comunes para una UI Profesional

Estos son problemas frecuentemente pasados por alto que hacen que una UI se vea poco profesional:
Aviso de alcance: las reglas de abajo son para App UI (iOS/Android/React Native/Flutter), no para patrones de interacción de desktop-web.

### Iconos y Elementos Visuales

| Regla | Estándar | Evitar | Por qué importa |
|------|----------|--------|----------------|
| **Sin emoji como iconos estructurales** | Usar iconos vectoriales (p. ej. Lucide, react-native-vector-icons, @expo/vector-icons). | Usar emojis (🎨 🚀 ⚙️) para navegación, ajustes, o controles de sistema. | Los emojis dependen de la fuente, son inconsistentes entre plataformas, y no se pueden controlar vía design tokens. |
| **Solo assets vectoriales** | Usar SVG o iconos vectoriales de plataforma que escalen limpio y soporten theming. | Iconos PNG raster que se ven borrosos o pixelados. | Asegura escalabilidad, renderizado nítido, y adaptabilidad a dark/light mode. |
| **Estados de interacción estables** | Usar transiciones de color, opacidad o elevación para los estados de press sin cambiar los límites del layout. | Transformaciones que desplazan el layout, moviendo el contenido de alrededor o causando jitter visual. | Previene interacciones inestables y preserva un motion/calidad percibida fluidos en mobile. |
| **Logos de marca correctos** | Usar los assets oficiales de la marca y seguir sus guías de uso (espaciado, color, clear space). | Adivinar rutas de logo, recolorear sin autorización, o modificar proporciones. | Previene el mal uso de marca y asegura el cumplimiento legal/de plataforma. |
| **Tamaño de icono consistente** | Definir tamaños de icono como design tokens (p. ej. icon-sm, icon-md = 24pt, icon-lg). | Mezclar valores arbitrarios como 20pt / 24pt / 28pt al azar. | Mantiene el ritmo y la jerarquía visual en toda la interfaz. |
| **Consistencia de trazo** | Usar un grosor de trazo consistente dentro de la misma capa visual (p. ej. 1.5px o 2px). | Mezclar estilos de trazo grueso y fino arbitrariamente. | Los trazos inconsistentes reducen la pulcritud y cohesión percibidas. |
| **Disciplina filled vs. outline** | Usar un solo estilo de icono por nivel de jerarquía. | Mezclar iconos filled y outline en el mismo nivel de jerarquía. | Mantiene la claridad semántica y la coherencia estilística. |
| **Touch target mínimo** | Área interactiva mínima de 44×44pt (usar hitSlop si el icono es más pequeño). | Iconos pequeños sin área de tap expandida. | Cumple con los estándares de accesibilidad y usabilidad de plataforma. |
| **Alineación de iconos** | Alinear los iconos a la línea base del texto y mantener un padding consistente alrededor. | Iconos desalineados o con espaciado inconsistente. | Previene un desbalance visual sutil que reduce la calidad percibida. |
| **Contraste de iconos** | Seguir los estándares de contraste WCAG: 4.5:1 para elementos pequeños, 3:1 mínimo para glifos de UI más grandes. | Iconos de bajo contraste que se mezclan con el fondo. | Asegura accesibilidad tanto en light como en dark mode. |


### Interacción (App)

| Regla | Hacer | No hacer |
|------|----|----- |
| **Feedback al presionar** | Proveer un feedback de press claro (ripple/opacidad/elevación) dentro de 80-150ms | Sin respuesta visual al tap |
| **Timing de animación** | Mantener las micro-interacciones alrededor de 150-300ms con easing nativo de la plataforma | Transiciones instantáneas o animaciones lentas (>500ms) |
| **Foco de accesibilidad** | Asegurar que el orden de foco del lector de pantalla coincida con el orden visual y que los labels sean descriptivos | Controles sin label o un traversal de foco confuso |
| **Claridad del estado disabled** | Usar semántica de disabled (props `disabled`/nativas), énfasis reducido, y sin acción al tap | Controles que parecen tapeables pero no hacen nada |
| **Touch target mínimo** | Mantener áreas de tap >=44x44pt (iOS) o >=48x48dp (Android), expandir el área de toque cuando el icono sea más pequeño | Tap targets diminutos o áreas de toque solo-icono sin padding |
| **Prevención de conflictos de gesto** | Mantener un gesto primario por región y evitar conflictos de tap/drag anidados | Gestos superpuestos que causan acciones accidentales |
| **Controles nativos semánticos** | Preferir primitivas interactivas nativas (`Button`, `Pressable`, equivalentes de plataforma) con roles de accesibilidad adecuados | Contenedores genéricos usados como controles primarios sin semántica |

### Contraste en Light/Dark Mode

| Regla | Hacer | No hacer |
|------|----|----- |
| **Legibilidad de superficie (light)** | Mantener cards/superficies claramente separadas del fondo con suficiente opacidad/elevación | Superficies demasiado transparentes que difuminan la jerarquía |
| **Contraste de texto (light)** | Mantener el contraste del texto de body >=4.5:1 contra superficies claras | Texto de body en gris de bajo contraste |
| **Contraste de texto (dark)** | Mantener el contraste del texto primario >=4.5:1 y del secundario >=3:1 sobre superficies oscuras | Texto en dark mode que se mezcla con el fondo |
| **Visibilidad de bordes y dividers** | Asegurar que los separadores sean visibles en ambos temas (no solo en light mode) | Bordes específicos de un tema que desaparecen en el otro |
| **Paridad de contraste de estados** | Mantener los estados pressed/focused/disabled igualmente distinguibles en light y dark | Definir estados de interacción solo para un tema |
| **Theming basado en tokens** | Usar tokens de color semánticos mapeados por tema en superficies/texto/iconos de la app | Valores hex hardcodeados por pantalla |
| **Legibilidad de scrim y modal** | Usar un scrim de modal lo bastante fuerte para aislar el contenido en primer plano (típicamente 40-60% negro) | Un scrim débil que deja al fondo compitiendo visualmente |

### Layout y Espaciado

| Regla | Hacer | No hacer |
|------|----|----- |
| **Cumplimiento de safe-area** | Respetar las safe areas superior/inferior para todos los headers fijos, tab bars, y barras de CTA | Colocar UI fija bajo el notch, la status bar, o el área de gestos |
| **Espacio libre de las barras del sistema** | Agregar espaciado para las barras de status/navegación y el indicador de home por gesto | Dejar que contenido tapeable choque con el chrome del OS |
| **Ancho de contenido consistente** | Mantener un ancho de contenido predecible por clase de dispositivo (teléfono/tablet) | Mezclar anchos arbitrarios entre pantallas |
| **Ritmo de espaciado 8dp** | Usar un sistema de espaciado consistente de 4/8dp para padding/gaps/espaciado de sección | Incrementos de espaciado al azar sin ritmo |
| **Medida de texto legible** | Mantener el texto largo legible en dispositivos grandes (evitar párrafos edge-to-edge en tablets) | Texto largo a todo el ancho que perjudica la legibilidad |
| **Jerarquía de espaciado de sección** | Definir niveles claros de ritmo vertical (p. ej. 16/24/32/48) por jerarquía | Niveles de UI similares con espaciado inconsistente |
| **Gutters adaptativos por breakpoint** | Aumentar los insets horizontales en anchos mayores y en landscape | El mismo gutter angosto en todos los tamaños/orientaciones de dispositivo |
| **Coexistencia de scroll y elementos fijos** | Agregar insets de contenido superior/inferior para que las listas no queden ocultas detrás de barras fijas | Contenido de scroll ocultado por headers/footers sticky |

---

## Checklist Antes de Entregar

Antes de entregar código de UI, verifica estos ítems:
Aviso de alcance: este checklist es para App UI (iOS/Android/React Native/Flutter).

### Calidad Visual
- [ ] No se usan emojis como iconos (usar SVG en su lugar)
- [ ] Todos los iconos provienen de una misma familia y estilo consistente
- [ ] Se usan los assets de marca oficiales con las proporciones y clear space correctos
- [ ] Los visuales de estado pressed no desplazan los límites del layout ni causan jitter
- [ ] Se usan tokens de tema semánticos de forma consistente (sin colores hardcodeados ad-hoc por pantalla)

### Interacción
- [ ] Todos los elementos tapeables proveen feedback de press claro (ripple/opacidad/elevación)
- [ ] Los touch targets cumplen el tamaño mínimo (>=44x44pt iOS, >=48x48dp Android)
- [ ] El timing de micro-interacción se mantiene en el rango de 150-300ms con easing que se siente nativo
- [ ] Los estados disabled son visualmente claros y no interactivos
- [ ] El orden de foco del lector de pantalla coincide con el orden visual, y los labels interactivos son descriptivos
- [ ] Las regiones de gesto evitan interacciones anidadas/conflictivas (conflictos de tap/drag/back-swipe)

### Light/Dark Mode
- [ ] El contraste de texto primario es >=4.5:1 tanto en light como en dark mode
- [ ] El contraste de texto secundario es >=3:1 tanto en light como en dark mode
- [ ] Los dividers/bordes y los estados de interacción son distinguibles en ambos modos
- [ ] La opacidad del scrim de modal/drawer es lo bastante fuerte para preservar la legibilidad del primer plano (típicamente 40-60% negro)
- [ ] Ambos temas fueron probados antes de la entrega (no inferidos a partir de un solo tema)

### Layout
- [ ] Se respetan las safe areas para headers, tab bars, y barras de CTA inferiores
- [ ] El contenido de scroll no queda oculto detrás de barras fijas/sticky
- [ ] Verificado en teléfono pequeño, teléfono grande, y tablet (portrait + landscape)
- [ ] Los insets/gutters horizontales se adaptan correctamente según el tamaño y orientación del dispositivo
- [ ] Se mantiene el ritmo de espaciado 4/8dp en los niveles de componente, sección, y página
- [ ] La medida del texto largo sigue siendo legible en dispositivos más grandes (sin párrafos edge-to-edge)

### Accesibilidad
- [ ] Todas las imágenes/iconos con significado tienen labels de accesibilidad
- [ ] Los campos de formulario tienen labels, hints, y mensajes de error claros
- [ ] El color no es el único indicador
- [ ] Se soportan el reduced motion y el tamaño de texto dinámico sin romper el layout
- [ ] Los traits/roles/estados de accesibilidad (selected, disabled, expanded) se anuncian correctamente

## Consolidado: principios de diseño frontend

Destilado de la skill `frontend-design` de Anthropic (anthropics/skills). Enfocado en el *proceso* de fijar una dirección estética distintiva — no en los colores/fuentes/mecánicas de UX que ya cubren las secciones de arriba.

### Anclar la dirección en el tema (subject)
- Si un brief no define bien qué es realmente el producto/tema, defínelo tú primero: nombra un tema concreto, su audiencia, y el trabajo único de la página.
- Las elecciones distintivas vienen del propio mundo del tema (materiales, instrumentos, vernáculo) — construye con el contenido real del brief en todo momento, no con copy de relleno.
- Si hay contexto previo sobre las preferencias del humano o diseños pasados, úsalo como pista para la dirección.

### Tratar el hero como una tesis
- Abre con lo más característico del mundo del tema: un headline, imagen, animación, demo en vivo, o momento interactivo.
- El template por defecto de "stat grande + label pequeño + acento de gradiente" es la respuesta genérica — úsalo solo si de verdad es lo que mejor encaja con este brief.

### La tipografía y la estructura transmiten significado
- Combina una tipografía display distintiva con una tipografía de body refinada elegida para *este* brief, no la combinación a la que se recurre en cualquier proyecto. Haz que el tratamiento tipográfico sea memorable, no un vehículo de entrega neutral.
- La numeración, los eyebrows, y los divisores deben codificar algo verdadero sobre el contenido (p. ej., numerar solo cosas que son una secuencia real). Cuestiona cada dispositivo estructural antes de agregarlo — la mayoría son decoración, no información.

### Motion y complejidad
- Un momento orquestado (secuencia de carga de página, scroll reveal, micro-interacción de hover) suele funcionar mejor que efectos dispersos — a veces la decisión correcta es no usar animación en absoluto.
- Haz que la complejidad de ejecución coincida con la dirección elegida: lo maximalista necesita detalle elaborado; lo minimal necesita precisión en el espaciado y la tipografía. La elegancia es ejecutar bien la visión elegida, en cualquiera de los dos extremos.

### Proceso de dos pasadas: planificar, luego criticar
1. **Idea un sistema de tokens compacto:** 4-6 colores hex nombrados; tipografías por rol (display/body/utility); conceptos de layout de una oración con wireframes ASCII; el elemento distintivo único por el que se recordará el diseño.
2. **Critica el plan contra el brief** antes de escribir código: si alguna parte se lee como el default genérico de cualquier página similar, revísala y di qué cambió y por qué. Solo entonces empieza la implementación, derivando cada decisión de color/tipografía del plan revisado.

### Defaults genéricos de IA a evitar
A menos que el brief pida explícitamente alguno de estos, trátalos como defaults en vez de elecciones:
- Fondo cream cálido (~`#F4F1EA`) + serif display de alto contraste + acento terracota.
- Fondo casi negro + un único acento neón/bermellón brillante.
- Layout estilo broadsheet: reglas hairline, cero border-radius, columnas densas de periódico.

### Restricción y el copy como material de diseño
- Gasta la audacia en un solo lugar: deja que el elemento distintivo sea lo único memorable, mantén todo lo demás alrededor tranquilo, y elimina la decoración que no sirva al brief.
- Aun así cumple el piso de calidad sin anunciarlo: responsive a mobile, foco de teclado visible, reduced motion respetado.
- Escribe desde el lado del usuario final de la pantalla — nombra las cosas por lo que la gente controla, no por cómo está construido el sistema ("notificaciones", no "configuración de webhook").
- Usa voz activa; mantén el nombre de un control consistente a lo largo de todo el flujo (botón "Publicar" -> toast "Publicado").
- Los errores indican causa + solución en la voz propia de la interfaz, nunca vagos (un simple "Entrada inválida" no alcanza) y nunca disculpándose.
- Presta atención a las colisiones de especificidad CSS entre selectores basados en tipo (`.section`) y basados en elemento (`.cta`) — pueden cancelarse silenciosamente el padding/margin entre sí, especialmente entre secciones.

## Consolidado: guías de marca (brand guidelines)

Destilado de la skill hermana local `brand` (`.claude/skills/brand` en el monorepo de ui-ux-pro-max — `logo-usage-rules.md`, `consistency-checklist.md`, `visual-identity.md`) y de la skill `brand-guidelines` de Anthropic (anthropics/skills). Esto cubre **respetar un brand kit existente de un cliente**, una preocupación distinta a la *selección* de estilo/paleta/tipografía que ya cubre el resto de este archivo para design systems nuevos.

### Los tokens de marca son input fijo, no materia prima
- Extrae los valores exactos del kit provisto — colores primarios (1-2), secundarios/acento (2-3), neutros (3-4) — y reúsalos textualmente. No reinterpretes, aclares, ni "mejores" una paleta aprobada sin autorización.
- Mapea los roles semánticos a las tipografías explícitamente: tipografía de heading -> tipografía de body, cada una con un fallback de fuente del sistema (p. ej., fuente custom de heading no disponible -> Arial; fuente custom de body no disponible -> Georgia) para que el renderizado degrade con gracia.
- Rota los colores de acento en elementos no-texto/decorativos (series de gráfico, divisores, acentos de icono) en un orden fijo; no introduzcas tonos de acento nuevos ad hoc porque "se ven bien" con el layout.

### Reglas de logo
- Nunca estires, comprimas, rotes, recolorees fuera de la paleta aprobada, agregues gradientes/sombras/trazos, o coloques el logo sobre un fondo ocupado/de bajo contraste.
- Mantén un clear space alrededor del logo igual a la altura de su logomark.
- Respeta los tamaños mínimos publicados por superficie: favicon ~32px, icono de UI ~24-32px, header 120-200px de ancho, impreso ~35mm.
- Mantén tanto una variante a todo color como una invertida (clara sobre oscuro) y elige según el contraste del fondo, no por preferencia — los fondos oscuros reciben la marca invertida, no una recoloreada.
- Para co-branding: dale a ambos logos el mismo peso visual (misma altura), separación adecuada, y clear space aplicado a ambos.

### Auditoría de consistencia antes de publicar
Repasa esto antes de entregar trabajo afectado por la marca:
- [ ] Se usó la versión correcta del logo y su clear space
- [ ] La paleta está restringida solo a los tokens aprobados
- [ ] Se aplicaron correctamente las fuentes de marca y la jerarquía tipográfica
- [ ] El contraste sigue cumpliendo 4.5:1 pese a las restricciones de color de marca
- [ ] La voz/tono coincide con la personalidad documentada de la marca en cada superficie tocada
- [ ] No se coló ninguna modificación no autorizada (estirar/rotar/recolorear) en ningún asset

### Cuando la marca y la solicitud entran en conflicto
- Señala el conflicto en vez de resolverlo silenciosamente — p. ej., si se pide una paleta de moda fuera del set aprobado, hazlo notar en vez de sobreescribir en silencio los tokens de marca.
- Si aún no existe un brand kit, no inventes uno silenciosamente — recomienda construir uno mínimo (1-2 colores primarios, 2-3 acentos, 3-4 neutros, un par de fuente heading/body con fallbacks) antes de aplicar "consistencia de marca" a nada.
- Cadencia de auditoría para superficies de marca ya publicadas: revisar el sitio web mensualmente, los perfiles de redes sociales y templates trimestralmente, y correr una auditoría de marca completa anualmente — detectar el drift temprano es más barato que un realineamiento completo después.

## Consolidado: taste (criterio estético)

Destilado del patrón comunitario "anti-slop" Taste skill para generación de frontend (p. ej. github.com/Leonxlnx/taste-skill — un patrón informal, activamente forkeado, no una skill oficial de Anthropic). Úsalo como pasada final de calibración/lint, ejecutada *después* de los checklists de design-system y UX de arriba, justo antes de la entrega.

### Leer el brief antes de generar nada
Señales a revisar primero: tipo de página (landing/portfolio/rediseño/editorial); palabras de vibe que usó el usuario ("minimalist", "Awwwards", "premium consumer"); URLs/marcas/screenshots de referencia mencionados; audiencia (la audiencia elige la estética, no el gusto personal); assets de marca existentes a preservar; y restricciones silenciosas (accesibilidad primero, industria regulada, productos infantiles) que anulan la preferencia estética por completo.

### Enunciar una "lectura de diseño" de una línea antes de codear
Formato: *"Leyendo esto como: `<tipo de página>` para `<audiencia>`, con un lenguaje `<vibe>`, inclinándose hacia `<sistema/familia estética>`."* Haz exactamente una pregunta aclaratoria solo si la lectura realmente diverge del brief; de lo contrario, declara la lectura y avanza sin preguntar.

### Calibrar tres diales en vez de caer siempre en el mismo punto medio
- **Varianza:** simetría perfecta -> caos artístico.
- **Intensidad de motion:** estático -> cinemático/basado en física.
- **Densidad visual:** aireado tipo galería de arte -> empaquetado tipo cabina.
Deriva los valores de las palabras de vibe del brief, no del hábito — un brief de confianza-primero/regulado debería caer bajo en los tres diales; un brief de agencia/experimental debería caer alto en varianza y motion.

### Checklist de "se nota que es IA" — evitar salvo que el brief lo pida explícitamente
- Guion largo (`—`) usado en cualquier parte: headlines, copy de body, captions, atribución de citas. Usa un punto, coma, o guion en su lugar — esta es la señal más violada de todas.
- Tres cards de feature de ancho igual en fila como layout por defecto.
- Nombres/avatares de placeholder genéricos ("John Doe", iconos de usuario de stock) y datos falsos sospechosamente redondos (`99.99%`).
- Screenshots de producto falsos armados con rectángulos `<div>` con estilos.
- Puntos de estado decorativos de color sin comportamiento de estado real detrás.
- Eyebrows con número de sección ("00 / Index", "Step 1 / 2 / 3") y affordances de "Scroll to explore".
- Glows neón sobresaturados o negro puro `#000000`.
- Verbos de marketing de relleno ("elevate", "unleash", "seamless", "revolutionize").

### Para rediseños específicamente
Audita la superficie existente antes de tocarla; preserva por defecto lo que sea load-bearing (URLs/slugs, labels de nav, assets de marca existentes); señala cualquier cosa eliminada en vez de descartarla silenciosamente.

*(Se buscó una cuarta fuente, "Webarticast," pero no se pudo localizar tal skill pública de Claude — se omitió. Ver el body del commit.)*

## Motion: transiciones con Framer Motion + GSAP

- Las transiciones son la forma aplicada del motion design: entrada/salida, layout, scroll-driven.
- Framer Motion para transiciones de componentes/layout de React (`motion.div`, `AnimatePresence`, prop `layout`).
- GSAP para timelines, scroll-triggered (ScrollTrigger), y contextos no-React.
- Respeta `prefers-reduced-motion`; mantén las duraciones en 150-400ms para UI, springs para una sensación natural.
- Las dependencias npm `framer-motion` + `gsap` las instala el componente instalador de ui-ux.

Config: skill.yaml · Schema: schema.json
