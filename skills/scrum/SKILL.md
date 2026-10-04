---
name: scrum
description: "Guía Scrum oficial 2020 (Schwaber & Sutherland) — marco ligero para trabajo complejo: pilares, valores, responsabilidades (Product Owner, Scrum Master, Developers), los 5 eventos (Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective) y los 3 artefactos con su compromiso (Product Backlog/Objetivo del Producto, Sprint Backlog/Objetivo del Sprint, Incremento/Definición de Terminado). Trigger en español e inglés: scrum, sprint, retrospectiva, retrospective, daily, refinamiento, backlog, product owner, scrum master, incremento, definición de terminado, definition of done, planificación de sprint, sprint planning, ágil, agile."
---

# Scrum — Guía oficial 2020

## Qué es y qué NO es
Scrum es un **marco ligero, deliberadamente incompleto**: solo define las partes mínimas necesarias para implementar su teoría (empirismo + pensamiento Lean), y deja el resto — procesos, técnicas, estimaciones — a criterio de quien lo usa. Esto es lo que más se maltrata en la práctica: **story points, velocity, burndown charts, tableros Kanban, estimación en horas, roles de "líder técnico" o "PM"** no están en la guía. Son prácticas de industria que muchos equipos añaden y después confunden con Scrum mismo. Si algo de lo que tu equipo hace no aparece abajo, no es Scrum — puede ser una adaptación legítima o puede estar contradiciendo el marco; esta skill distingue ambos casos.

Scrum es simple, no fácil. La guía completa son 13 páginas. Todo lo demás que ves en cursos, certificaciones y herramientas es *tailoring* sensible al contexto, no el marco en sí.

## Teoría: los 3 pilares
Scrum se basa en el **empirismo** (el conocimiento viene de la experiencia; las decisiones se toman sobre lo observado) y el **pensamiento Lean** (reducir desperdicio, centrarse en lo esencial). Tres pilares sostienen esto:

- **Transparencia** — el proceso y el trabajo deben ser visibles para quien lo hace y quien lo recibe. Sin transparencia, la inspección genera engaño.
- **Inspección** — artefactos y progreso se inspeccionan con frecuencia para detectar desviaciones. Sin adaptación posterior, la inspección es inútil.
- **Adaptación** — si algo se desvía de límites aceptables, se ajusta cuanto antes. Requiere personas empoderadas y capaces de autogestionarse.

Los cinco eventos existen para dar cadencia a este ciclo inspeccionar→adaptar.

## Los 5 valores
**Compromiso, Enfoque, Apertura, Respeto y Coraje.** No son un poster de pared: son la condición para que transparencia, inspección y adaptación funcionen. Un equipo que oculta problemas (falta de apertura) o que no se atreve a señalar un riesgo (falta de coraje) rompe la transparencia sin romper ningún evento — por eso los antipatrones de abajo casi siempre son, en el fondo, fallos de valores.

## Responsabilidades (no "roles")
La guía 2020 habla de responsabilidades dentro de un único Scrum Team — sin sub-equipos, sin jerarquía, típicamente 10 personas o menos.

- **Developers** — quienes crean el Incremento. Rinden cuentas de: crear el Sprint Backlog, inculcar calidad ajustándose a la Definición de Terminado, adaptar su plan cada día hacia el Objetivo del Sprint, y responsabilizarse mutuamente como profesionales.
- **Product Owner** — rinde cuentas de maximizar el valor del producto. Concretamente: desarrollar y comunicar el Objetivo del Producto, crear y ordenar los elementos del Product Backlog, y asegurar que sea transparente y comprendido. Puede delegar el trabajo, nunca la responsabilidad. Es una persona, no un comité.
- **Scrum Master** — rinde cuentas de la eficacia del Scrum Team estableciendo Scrum tal como lo define la guía. Sirve al equipo (coaching en autogestión, elimina impedimentos, protege los timeboxes), al Product Owner (técnicas de gestión del backlog) y a la organización (lidera la adopción de Scrum). No es jefe de nadie: es un líder que sirve.

## Los 5 eventos
El **Sprint** es el contenedor de todo lo demás: de duración fija, un mes o menos, empieza inmediatamente al terminar el anterior. Dentro de él, la calidad no baja, el Objetivo del Sprint no se pone en riesgo, y el Product Backlog se refina según haga falta. Solo el Product Owner puede cancelarlo, y solo si el Objetivo del Sprint queda obsoleto.

| Evento | Propósito | Timebox (Sprint de 1 mes) | Participan | Produce |
|---|---|---|---|---|
| Sprint Planning | Definir por qué, qué y cómo del Sprint | máx. 8 horas | Todo el Scrum Team | Sprint Backlog con Objetivo del Sprint |
| Daily Scrum | Inspeccionar el progreso hacia el Objetivo del Sprint y adaptar el plan del día siguiente | máx. 15 min, diario | Developers (PO/SM si trabajan como developers) | Plan accionable para las próximas 24h |
| Sprint Review | Inspeccionar el resultado del Sprint y decidir próximos pasos | máx. 4 horas | Scrum Team + interesados | Ajustes al Product Backlog |
| Sprint Retrospective | Planificar cómo aumentar calidad y eficacia | máx. 3 horas | Scrum Team | Mejoras, a veces incorporadas al próximo Sprint Backlog |

Sprint Planning aborda tres temas, en este orden: **por qué** (el PO propone valor, el equipo colabora en el Objetivo del Sprint), **qué** (Developers seleccionan elementos del Product Backlog) y **cómo** (Developers descomponen el trabajo en tareas de un día o menos). El tercer tema —el "por qué"— es lo que añadió la versión 2020 frente a 2017.

## Los 3 artefactos y sus compromisos
Lo nuevo de la guía 2020: cada artefacto tiene un compromiso asociado que le da foco y permite medir progreso real, no solo listar contenido.

| Artefacto | Qué es | Compromiso |
|---|---|---|
| Product Backlog | Lista emergente y ordenada de lo que falta para mejorar el producto; única fuente de trabajo del equipo | **Objetivo del Producto** — estado futuro del producto al que apunta el backlog completo |
| Sprint Backlog | Objetivo del Sprint + elementos seleccionados + plan para entregarlos; propiedad de los Developers, se actualiza a diario | **Objetivo del Sprint** — el único objetivo del Sprint; da coherencia y foco |
| Incremento | Paso concreto y usable hacia el Objetivo del Producto; suma de todos los incrementos anteriores | **Definición de Terminado** — cuándo un elemento del backlog se convierte realmente en Incremento |

Un elemento que no cumple la Definición de Terminado no es Incremento: no se libera ni se presenta en la Sprint Review, vuelve al Product Backlog.

## Antipatrones
Cada uno contradice algo explícito en la guía, no una preferencia de esta skill:

- **Scrum Master como jefe de proyecto** que asigna tareas o reporta estado hacia arriba — la guía lo define como líder que *sirve*, no que manda; el equipo es autogestionado.
- **Daily Scrum como reporte de estado al Product Owner** — su propósito es inspeccionar el progreso hacia el Objetivo del Sprint y producir un plan para el día siguiente, no informar a nadie.
- **Sprints que se alargan "un par de días" para terminar algo** — la guía exige duración fija; alargar rompe la cadencia de inspección mensual y es precisamente lo que la guía busca evitar.
- **Definición de Terminado que se relaja según el sprint o la presión de fecha** — es un compromiso, no una variable de ajuste; si no se cumple, el trabajo no es Incremento, punto.
- **Cancelar la retrospectiva "por falta de tiempo"** — es el evento que concluye el Sprint; saltarla no ahorra tiempo, elimina la única oportunidad formal de adaptar cómo trabaja el equipo.
- **Negociar el Objetivo del Sprint a mitad de camino** — el alcance se puede renegociar con el PO, el Objetivo del Sprint no: si cambia, ya no es el mismo Sprint.
- **Product Backlog gestionado por comité** — el PO es una persona responsable; otros pueden influir negociando con él, no decidiendo en su lugar.

## Adaptación en la práctica (no es Scrum, es práctica de industria)
La guía es explícita: no prescribe cómo pronosticar, medir capacidad o registrar ausencias — eso queda fuera de su alcance a propósito, porque es sensible al contexto. Prácticas comunes como **registrar días trabajados, capacidad del equipo por Sprint, ausencias planificadas o burndown/burnup charts** son técnicas complementarias válidas, siempre que no se confundan con reglas de Scrum ni sustituyan el empirismo: la guía lo dice explícitamente sobre los gráficos de pronóstico, "estos no sustituyen la importancia del empirismo". Úsalas como apoyo a la Planificación de Sprint y al Daily, nunca como criterio para saltarte un evento, extender un Sprint o relajar la Definición de Terminado.

## Procedencia
Síntesis de la *Guía Scrum* (noviembre 2020), Ken Schwaber & Jeff Sutherland, publicada bajo licencia Attribution-ShareAlike 4.0 International (Creative Commons). No es una reproducción literal: son notas de estudio reescritas. Para el texto normativo completo, consulta la guía original.

---

Config: skill.yaml · Schema: schema.json
