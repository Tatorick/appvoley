# Guía de Despliegue - AppVoley

Esta aplicación está construida con **Vite + React** y utiliza **Supabase** como backend.

## Requisitos Previos

1.  **Node.js** (v18 o superior)
2.  **Cuenta en Supabase** (para la base de datos y autenticación)

## Configuración de Supabase

1.  Crea un nuevo proyecto en Supabase.
2.  Ejecuta el script SQL ubicado en `schema.sql` en el Editor SQL de Supabase para crear las tablas y políticas.
3.  Ejecuta también cualquier script en la carpeta `migrations/` para asegurar que tienes las últimas optimizaciones.
4.  En la configuración del proyecto (Project Settings > API), obtén tu `Project URL` y `anon public key`.

## Configuración Local

1.  Clona el repositorio.
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env.local` basado en `.env.example`:
    ```bash
    cp .env.example .env.local
    ```
4.  Edita `.env.local` y añade tus credenciales de Supabase.

## Despliegue en Vercel (Recomendado)

1.  Instala Vercel CLI o conecta tu repositorio de GitHub a Vercel.
2.  Importa el proyecto.
3.  En la configuración del proyecto en Vercel, ve a **Environment Variables**.
4.  Añade las siguientes variables (copiadas de tu `.env.local`):
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
5.  Despliega. Vercel detectará automáticamente que es un proyecto Vite.

## Despliegue en Netlify

1.  Conecta tu repositorio a Netlify.
2.  Configura el comando de build como `npm run build`.
3.  Configura el directorio de publicación como `dist`.
4.  En **Site settings > Build & deploy > Environment**, añade las variables de entorno de Supabase.

## Build Manual

Para generar los archivos estáticos para producción:

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`. Puedes servir esta carpeta con cualquier servidor web estático (Nginx, Apache, etc.).
