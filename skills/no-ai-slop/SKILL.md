---
name: no-ai-slop
description: "Edita y audita PROSA DESTINADA A HUMANOS (documentación, README, artículos, mensajes, copy) para quitarle patrones que \"suenan a IA\" preservando la voz personal del autor. NO se aplica a respuestas de sesión de Claude Code — solo a texto que un humano leerá fuera de esta sesión. Trigger con \"escribir\", \"redactar\", \"write\", \"edit prose\", \"editar borrador\", \"edit draft\", \"README\", \"documentación\", \"documentation\", \"artículo\", \"article\", \"anti-slop\", \"ai slop\", \"suena a IA\", \"sounds like AI\", \"voz humana\", \"human voice\", \"detectar IA\", \"detect AI writing\", o al pulir cualquier texto que vaya a leer un humano fuera de esta sesión."
---

# No AI Slop (Anti-Slop de Prosa)

Fork propio, traducido y adaptado, de [`petergyang/no-ai-slop`](https://github.com/petergyang/no-ai-slop) (MIT). Actúa como un editor humano agudo: preserva el punto y la voz personal de quien escribe mientras vuelve el texto más claro y vivo. Elimina los patrones de escritura que "suenan a IA" sin convertir una prosa distintiva en prosa genérica y pulida.

## Alcance: prosa para humanos, no respuestas de sesión

Esta skill opera sobre texto que un humano va a leer **fuera** de esta sesión interactiva: documentación (`README.md`, `docs/*.md`, `CHANGELOG`), artículos técnicos o de blog, mensajes (email, Slack, PRs, issues), copy de producto/marketing, notas de release. **No se aplica a las respuestas que el modelo da dentro de la conversación de Claude Code** — esas no son prosa destinada a un lector humano fuera de sesión, así que quedan fuera de alcance. Si estás a punto de responder al usuario en el chat, esta skill no aplica. Si estás editando un archivo que un humano leerá después — sí aplica.

## Dos trabajos

### Editar (por defecto)

El usuario comparte un borrador para corregir. Haz el cambio mínimo efectivo siguiendo las reglas de abajo y entrega el borrador editado más una sección **Qué cambió**.

### Detectar

El usuario pregunta si un texto es slop de IA, o pide auditar/escanear/señalar un borrador sin reescribirlo. Nombra cada patrón de esta skill que aparezca, cita la línea exacta y da el arreglo en pocas palabras. No reescribas, no le pongas puntaje al borrador, ni adivines si lo escribió una IA — los detectores de IA adivinan; los patrones nombrados son evidencia que el usuario puede verificar por sí mismo. Ofrece editar el borrador después de reportar.

## Qué preguntar si falta contexto

- Si el usuario no compartió un borrador, pide que lo pegue.
- Si la audiencia o el formato no están claros, haz una sola pregunta: ¿para quién es esto y dónde se va a publicar?
- Si el objetivo no está claro, pregunta qué debería pensar, sentir o hacer el lector después de leerlo.

## Principios de edición

- **Preserva la voz real de quien escribe.** Primero identifica el vocabulario, la cadencia, la contundencia, el humor, la incertidumbre, las digresiones y el nivel de pulido del borrador. Conserva los rasgos que se sienten personales. No vuelvas cada párrafo igual de prolijo ni reescribas líneas distintivas solo por consistencia.
- **Haz el cambio mínimo efectivo.** Corrige patrones de IA, errores, repetición y pasajes confusos. Deja en paz las frases humanas que ya funcionan. Un borrador crudo con voz real debería seguir sonando a la misma persona después de editarlo.
- **Lleva el punto al frente cuando el arranque no aporta nada.** Corta el "carraspeo" genérico de apertura. Conserva una anécdota personal, historia o admisión cuando crea contexto, tensión o carácter.
- **Adelanta la conclusión solo cuando mejora la claridad.** No fuerces cada sección y párrafo al mismo molde de punto-detalle-contexto.
- **Conserva el significado del usuario.** No inventes afirmaciones, ejemplos, estadísticas ni opiniones. Si algo no está claro, pregunta.
- **Abre el texto, no lo simplifiques de más.** Conserva la sustancia, el matiz y la precisión. Recorta solo lo que dificulta la lectura: jerga, oraciones larguísimas, sustantivos abstractos y estructuras enredadas.
- **Usa voz activa.** "El equipo lo lanzó el martes" le gana a "la decisión surgió". Nunca dejes que cosas inanimadas hagan verbos humanos.
- **Que cada oración se gane su lugar.** Corta los calificadores vacíos y el relleno de apertura. Conserva frases como "creo que", "quizás" o "honestamente" cuando expresan incertidumbre real, autoconciencia, o el ritmo hablado de quien escribe.
- **Desenreda oraciones sin aplanar la cadencia.** Divide oraciones y párrafos cuando son genuinamente difíciles de seguir. Conserva oraciones largas de tono hablado, fragmentos y cambios de ritmo cuando son claros y característicos de la voz del autor.
- **Sé concreto y específico.** La abstracción es donde la escritura va a morir. "La integración mejoró la eficiencia" se convierte en "la integración bajó el tiempo de deploy de 40 minutos a 4". Nombres, números, fechas, mecanismos y ejemplos le ganan a las abstracciones.
- **Protege el dato específico.** No diluyas un detalle útil en importancia genérica. "La herramienta mejora significativamente la productividad de ingeniería" se convierte en "la herramienta bajó el tiempo de revisión de 30 minutos a 8".
- **Que los verbos hagan el trabajo.** Reemplaza frases verbales débiles con verbos directos. "Tomó una decisión" se convierte en "decidió". "Tiene la capacidad de" se convierte en "puede".
- **Conoce el trabajo antes que la estructura.** Antes de tocar estructura o elección de palabras, entiende qué está intentando lograr el texto y para quién es.
- **Preserva el filo y el carácter útiles.** Conserva opiniones fuertes, lenguaje directo, humor, groserías, autointerrupciones y admisiones honestas cuando pertenecen a la voz del autor. No las reemplaces por un tono más seguro o "profesional".
- **Conserva la estructura salvo que esté perjudicando al texto.** Preserva la progresión y los desvíos del autor cuando aportan personalidad. Si reorganizas, di por qué en la sección "Qué cambió".

## Palabras y frases prohibidas

### Prohibidas sin excepción (inglés / español)

delve → profundizar en / indagar en · foster → fomentar · leverage → aprovechar / apalancar · utilize → utilizar · facilitate → facilitar · empower → empoderar · streamline → optimizar / agilizar · robust → robusto · cutting-edge → de vanguardia · paradigm shift → cambio de paradigma · game changer → un antes y un después · this is huge / this changes everything → esto es enorme / esto lo cambia todo · tapestry → tapiz · realm → reino / ámbito · beacon → faro · multifaceted → multifacético · meticulous → meticuloso · intricate → intrincado · paramount → primordial · transformative → transformador · elevate → elevar · embark → embarcarse · supercharge → potenciar al máximo · harness → aprovechar / canalizar · ever-evolving → en constante evolución.

### Adverbios frecuentemente vacíos (inglés / español)

just → solo · literally → literalmente · honestly → honestamente · simply → simplemente · actually → en realidad · truly → verdaderamente · fundamentally → fundamentalmente · importantly → es importante que · crucially → de forma crucial · inherently → inherentemente · inevitably → inevitablemente.

Córtalos cuando no aportan nada. Consérvalos cuando cargan énfasis, incertidumbre, contraste, o el ritmo hablado natural de quien escribe.

### Frases frecuentemente vacías (inglés / español)

it's worth noting → vale la pena señalar · it's important to note → es importante notar · at the end of the day → al final del día · when it comes to → cuando se trata de · at its core → en su núcleo · in today's world → en el mundo de hoy · in the age of → en la era de · in the world of → en el mundo de · the reality is → la realidad es · the truth is → la verdad es · in terms of → en términos de · with regard to → con respecto a · in order to → con el fin de · going forward → de cara al futuro · in this article → en este artículo · let's dive in → entremos de lleno.

Córtalas cuando retrasan el punto. Conserva una frase ocasional cuando es parte de la voz reconocible del autor y la oración sigue ganándose su lugar.

## Los 14 patrones a eliminar

1. **Contrastes binarios.** "Esto no es X. Es Y." / "La pregunta no es X, es Y." / "No es solo X sino Y." Enuncia Y directamente. "La pregunta no es el modelo. Es el eval." se convierte en "el eval importa más que el modelo".
2. **Carraspeo de apertura (throat-clearing).** "Aquí está la cosa", "Lo que quiero decir es", "Seamos claros", "Voy a ser honesto", "La verdad incómoda es". Córtalo y enuncia el punto directamente.
3. **Planteamientos retóricos y falsas revelaciones de insight.** "¿Y si te dijera que...?", "Piénsalo:", "Giro de trama:", preguntas que el propio texto responde, y aperturas como "esto es lo que la mayoría se salta" o "lo que nadie te cuenta" que se autoerigen en experto solitario. Elimina el planteamiento y deja que la afirmación se sostenga sola. "Lo que todos se pierden: la distribución es el verdadero moat" se convierte en "la distribución es el moat".
4. **Revelaciones con dos puntos.** Frase nominal, dos puntos, y una revelación dramática en minúscula: "El detalle que lo hace funcionar: un agente separado lo califica." Reescríbelo como oración plana. Usa los dos puntos para listas, etiquetas y citas, no para drama fingido. Prefiere minúscula después de los dos puntos salvo que la gramática, un nombre propio, un título o código exijan lo contrario.
5. **Análisis superficial.** Corta cláusulas en gerundio que fingen explicar significado: "destacando", "subrayando", "reflejando", "evidenciando". "El lanzamiento agrega búsqueda de archivos, destacando el compromiso del equipo con mejores flujos de trabajo" se convierte en "el lanzamiento agrega búsqueda de archivos, así los usuarios encuentran borradores viejos sin salir del editor".
6. **Inflación de importancia.** "Representa un testimonio de", "marca un momento decisivo", "juega un papel vital", "consolida su posición", "subraya su relevancia". Enuncia el hecho y deja que el lector juzgue si importa. "El lanzamiento marca un momento decisivo para la empresa" se convierte en "el lanzamiento es el primer producto pago de la empresa".
7. **Atribución evasiva.** "Los expertos coinciden", "informes de la industria sugieren", "muchos argumentan", "ampliamente considerado como", "estudios muestran". Nombra la fuente o corta la afirmación. Si el usuario no tiene fuente, pregunta en vez de inventar una.
8. **Verbos falsamente contundentes.** Prefiere "es" y "tiene" cuando son más claros. "La app funciona como un hub centralizado para gestión de patrocinadores" se convierte en "la app rastrea patrocinadores, borradores, fechas límite y aprobaciones en un solo lugar".
9. **Ciclado de sinónimos.** Si la palabra clara es la correcta, repítela. No rotes términos por estilo. "El agente revisa el borrador. El asistente califica la pieza. La herramienta sugiere arreglos" se convierte en "el agente revisa el borrador, lo califica y sugiere arreglos".
10. **Listado negativo.** "No es un X. No es un Y. Es un Z." Di Z directamente.
11. **Ritmo robótico y fragmentación dramática.** "X. Y Y. Y Z." o "Eso es todo. Eso es todo el asunto." Evita formas de oración repetidas, estructuras de párrafo idénticas y fragmentos contundentes apilados. Usa oraciones completas; varía la forma solo cuando ayuda al punto.
12. **Kickers falsamente profundos y finales de resumen-recapitulación.** Corta la línea final "profunda" cuando convierte el punto en una metáfora cursi o una frase de mic-drop — no la reescribas como una metáfora mejor, no preserves su ritmo, bórrala y termina en la oración concreta más clara que ya está en el borrador. Corta también "en conclusión", "en última instancia", "en resumen" o un párrafo final que repite el texto: el lector ya estuvo ahí. Termina en el último punto concreto, la conclusión o la próxima acción.
13. **Slop de formato.** Emojis en encabezados, negrita salpicada a mitad de oración para dar énfasis, listas con viñetas donde dos oraciones de prosa se leerían mejor, y encabezados sobre secciones de dos oraciones. El formato debe seguir al contenido, no decorarlo.
14. **Abuso del em-dash.** No lo uses como muleta rítmica por defecto. En textos cortos, ninguno. En borradores largos, 1-2 están bien si claramente le ganan a comas, puntos o paréntesis. Elimina los cúmulos y los guiones decorativos.

## Flujo de 6 pasos con autoevaluación

1. Lee el borrador completo antes de editar.
2. Identifica el punto central y 3-5 señales de voz a preservar — vocabulario, cadencia, contundencia, humor, incertidumbre, digresiones. Guarda esta nota internamente. Si no puedes identificar el punto central, pregúntale al usuario.
3. Para una solicitud de **detección**, entrega el informe descrito en "Dos trabajos" (patrón nombrado + cita + arreglo breve, sin reescribir) y detente ahí.
4. Para una **edición**, haz los cambios mínimos efectivos y luego revisa el borrador editado contra la autoevaluación de abajo.
5. Si alguna verificación falla, corrige el borrador y vuelve a revisarlo.
6. Entrega el borrador completo editado y una sección breve **Qué cambió**.

### Autoevaluación (ejecútala tú mismo antes de entregar)

**Principios de edición**
- ¿La edición preserva el punto del usuario sin agregar afirmaciones, ejemplos, estadísticas, citas u opiniones?
- ¿Preserva el vocabulario, la cadencia, la contundencia, el humor, la incertidumbre, las digresiones y el nivel de pulido distintivos del autor?
- ¿Deja en paz las oraciones humanas fuertes en vez de reescribirlas por consistencia o para que cada párrafo quede igual de prolijo?
- ¿La cantidad de recorte es proporcional al slop real, sin compresión agresiva que le quite carácter al texto?
- ¿El borrador lleva al frente lo que el lector necesita mientras conserva el arranque personal que aporta contexto, tensión o carácter?
- ¿Los verbos hacen el trabajo, con datos concretos y detalles protegidos donde el borrador los sostiene?
- ¿Usa voz activa con sujetos humanos donde es posible?
- ¿Conserva filo útil y la estructura original salvo que esa estructura estuviera perjudicando el texto?

**Palabras y patrones a cortar**
- ¿Se eliminaron las palabras prohibidas, las frases de relleno, los adverbios frecuentemente vacíos y las afirmaciones infladas (salvo que se citen como ejemplo)?
- ¿Se eliminaron los contrastes binarios, el listado negativo, los planteamientos retóricos y el carraspeo de apertura?
- ¿Se corrigieron las falsas revelaciones de insight, las revelaciones con dos puntos, el análisis superficial, los verbos falsamente contundentes, el ciclado de sinónimos y la fragmentación dramática?
- ¿Se reemplazó la inflación de importancia y la atribución evasiva por hechos planos y fuentes nombradas, o se señaló al usuario cuando no hay fuente?
- ¿Se borraron los kickers falsamente profundos en vez de reescribirlos como una metáfora mejor?
- ¿Se cortaron los finales de resumen-recapitulación para que el texto termine en un punto concreto?
- ¿Se eliminó el slop de formato (emojis en encabezados, negrita decorativa, viñetas que deberían ser prosa, encabezados sobre secciones diminutas)?
- ¿Los dos puntos van seguidos de minúscula salvo que la gramática, un nombre propio, un título o código exijan lo contrario?
- ¿El em-dash se usa con moderación — casi ninguno en textos cortos, 1-2 como máximo en borradores largos y solo cuando claramente ayudan?

**Lectura final**
- ¿Reconocería el autor el borrador editado como su propia voz?
- ¿Sonaría natural si se lo leyeras en voz alta a un colega agudo?
- ¿El resultado final incluye el borrador completo editado y una sección breve **Qué cambió**?
- Para solicitudes de detección, ¿la respuesta nombra cada patrón con una línea citada y un arreglo breve, sin reescribir, puntuar ni afirmar autoría de IA?

## Dónde termina el alcance de esta skill

`no-ai-slop` edita prosa que un humano leerá fuera de la sesión y preserva activamente la voz natural del autor — nunca las respuestas que el modelo da dentro de la conversación de Claude Code. Si dudas si aplica: ¿quién lee esto, y cuándo? Respuesta de sesión en vivo → fuera de alcance. Archivo, mensaje o documento que alguien abrirá después → `no-ai-slop`.

---

Fork traducido y adaptado de [`petergyang/no-ai-slop`](https://github.com/petergyang/no-ai-slop), licencia MIT, © Peter Yang.

Config: skill.yaml · Schema: schema.json
