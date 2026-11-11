# Colección
Web estática para organizar barajas y mantener una Wishlist. Las dos páginas comparten los estilos y el código de la galería.

## Publicar
1. Sube la carpeta `public` y el archivo `vercel.json` a la raíz de tu repositorio de GitHub.
2. Importa el repositorio en Vercel. Usa el preset **Other**, deja el comando de compilación vacío y mantén la raíz del repositorio como directorio del proyecto. El archivo de configuración indica que se sirve `public`.
3. Pulsa **Deploy** y abre la dirección de producción. Para solicitar que Google rastree la web, verifica esa dirección en Google Search Console y usa **Inspección de URLs**.

## Datos
La colección y sus fotos se guardan con IndexedDB en el navegador y el dominio que utilizas. Cada visitante empieza con las barajas de muestra. Las fichas creadas en la vista previa local permanecen en esa dirección. Para eliminar una ficha, ábrela, pulsa **Editar baraja**, **Eliminar baraja** y confirma su nombre.

El movimiento de la estantería está adaptado de Product Shelf, de Aakash Mehra.
