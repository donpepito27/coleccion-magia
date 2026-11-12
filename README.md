# Colección

Catálogo público de barajas y Wishlist, con precios y fotografías incorporados a la web. Mantiene la galería, los giros y los filtros del prototipo.

## Despliegue
Los HTML, CSS, JavaScript y la carpeta fotos están en la raíz del repositorio. Vercel sirve esa raíz mediante vercel.json. El proyecto utiliza el preset Other y funciona sin compilación.

## Datos
catalogo.js contiene las compras y la Wishlist transcritas de las capturas facilitadas. Los precios conservan EUR o USD según la captura. Las fechas desconocidas quedan vacías. La numeración es consecutiva según el orden de importación. Las fichas repetidas entre tiendas conservan los dos enlaces.

Los enlaces que llevan a una búsqueda están identificados con Buscar en. Algunas fotos proceden de las miniaturas de las capturas o de imágenes generales del producto. La marca pendiente de identificar figura como Por confirmar.

La primera visita carga el catálogo publicado. La migración sustituye las fichas de muestra y conserva las fichas personales añadidas. Después, las modificaciones realizadas en la interfaz se guardan en IndexedDB por navegador y dominio. Para actualizar el catálogo público compartido, se modifica catalogo.js y se publica el repositorio.

El movimiento de la estantería está adaptado de Product Shelf, de Aakash Mehra.
El importe se muestra en EUR y USD con el cambio de referencia del BCE del 12/11/2026 (1 EUR = 1,1081 USD). La ordenación usa los céntimos en euros. Los totales de la colección y la Wishlist suman el importe unitario mostrado por las unidades de cada ficha. El buscador se combina con el filtro de marca mientras se escribe.
