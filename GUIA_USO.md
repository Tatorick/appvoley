# Guía para llevar el Proyecto a Casa 🏠

Si deseas mover este proyecto a otra computadora (ej. mediante USB), sigue estos pasos:

## 1. Copiar la Carpeta

Copia toda la carpeta del proyecto `AppVoley`.
_Tip: Si quieres ahorrar espacio en el USB, puedes borrar la carpeta `node_modules` antes de copiar. Esta carpeta es muy pesada y se regenera fácilmente._

## 2. Requisitos en Casa

En tu computadora de casa, necesitas tener instalado:

- **Node.js**: Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/).

## 3. Instalación

1.  Copia la carpeta del USB a tu computadora.
2.  Abre la carpeta en tu editor de código (VS Code).
3.  Abre una terminal y escribe:
    ```bash
    npm install
    ```
    _(Esto volverá a descargar todas las librerías necesarias)._

## 4. Iniciar la App

Una vez instalado, ejecuta:

```bash
npm run dev
```

## 🟢 Base de Datos (Supabase)

¡Buenas noticias! **No necesitas copiar la base de datos.**
Como usamos **Supabase en la nube**, tu aplicación se conectará automáticamente a los mismos datos (usuarios, partidos, estadísticas) desde cualquier lugar, siempre que tengas internet y el archivo `.env` esté dentro de la carpeta del proyecto.
