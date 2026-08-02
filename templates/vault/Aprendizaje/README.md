# Aprendizaje

Errores cometidos y su lección, para no repetirlos. Categoría `aprendizaje`.
Postmortems: qué falló, por qué, y cómo evitarlo la próxima vez.

**No es** un cuaderno de apuntes de tecnologías ni de tutoriales — esa era la
definición vieja de esta carpeta y ya no aplica.

Ejemplo de qué va aquí:

> El deploy falló porque el hook de pre-commit no corría en CI, solo en local. La
> próxima vez: verificar que el hook está registrado en el pipeline antes de
> confiar en él para bloquear un merge.

Qué NO va aquí: documentación de cómo funciona una tecnología sin que haya un error
de por medio — eso es `Investigacion/` si se investigó para decidir algo, o
`Codigo/` si es arquitectura de un repo propio.
