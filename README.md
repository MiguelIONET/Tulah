# Tulah · Neumorfismo

Proyecto independiente de la página web de Tulah. Esta es la carpeta de trabajo para los cambios de neumorfismo a partir de ahora.

## Abrir el sitio

Abre `index.html` en tu navegador. Entra directamente al inicio de Tulah, sin un selector de propuestas. No requiere instalación ni compilación.

## Estructura

- `index.html`: Inicio.
- `nosotros.html`, `productos.html`, `sinergia.html`, `identidad.html`, `contacto.html`: páginas del sitio.
- `css/`: estilos de neumorfismo e identidad de marca.
- `js/`: navegación, catálogo, formulario, video y animaciones.
- `assets/`: logos, fotografías, video, iconos y fuentes locales.
- `CREDITOS.md`: procedencia y licencias del material.
- `tests/catalog-browser.mjs`: comprobación del catálogo en escritorio, tablet y celular.

La página de Productos incluye tarjetas de igual altura y resaltado de las que están visibles al desplazarse. El catálogo conserva la búsqueda y los filtros.

Todos los recursos del sitio están dentro de esta carpeta. Los enlaces de WhatsApp, teléfono y correo abren servicios externos. El formulario prepara un mensaje para WhatsApp.

## Trabajar y entregar

Realiza los cambios dentro de esta carpeta. Las otras carpetas de propuestas y los paquetes antiguos son copias anteriores y no se actualizan automáticamente.

Para compartir o publicar el proyecto, entrega el contenido completo de esta carpeta manteniendo su estructura; `index.html` debe quedar en la raíz. El ZIP entregado es una copia de esta separación y tampoco se actualiza automáticamente.

## Verificar el catálogo

Con Node.js y Microsoft Edge instalados, ejecuta desde esta carpeta:

```powershell
node tests/catalog-browser.mjs .
```

La prueba abre Edge sin ventana y comprueba tamaños, contenido, resaltado, filtros y búsqueda. Guarda capturas en `docs/previews/`.
