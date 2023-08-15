# Mi Curriculum Vitae App

Esta es una aplicación simple en Node.js que te permite acceder a mi curriculum vitae en línea. Puedes ejecutar la aplicación localmente utilizando Docker o directamente en tu entorno de desarrollo.

## Contenido

- [Requisitos Previos](#requisitos-previos)
- [Instrucciones de Uso](#instrucciones-de-uso)
- [Ejecución con Docker](#ejecución-con-docker)
- [Ejecución sin Docker](#ejecución-sin-docker)

## Requisitos Previos

- Node.js (versión 18+)
- Docker (opcional)

## Instrucciones de Uso

1. Clona este repositorio en tu máquina local.
2. Abre una terminal y navega hasta el directorio del proyecto.

## Ejecución con Docker

Si prefieres usar Docker para ejecutar la aplicación, sigue estos pasos:

1. Asegúrate de tener Docker instalado y en funcionamiento en tu sistema.
2. Ejecuta el siguiente comando para construir la imagen de Docker:

```bash
docker build -t mi-cv-app .
```

3. Una vez que la imagen esté construida, puedes ejecutar la aplicación con el siguiente comando:

```bash
docker run -p 3000:3000 mi-cv-app
```
4. Tambien puedes hacer lo anterior corriendo:

```bash
chmod +x scripts/run.sh && ./scripts/run.sh
```

5. Abre tu navegador web y visita http://localhost:3000 para ver mi curriculum vitae en línea.

## Ejecución sin Docker

Si prefieres ejecutar la aplicación directamente en tu entorno de desarrollo, sigue estos pasos:

1. Asegúrate de tener Node.js instalado en tu sistema.
2. Abre una terminal y navega hasta el directorio del proyecto.
3. Ejecuta los siguientes comandos para instalar las dependencias y ejecutar la aplicación:

```bash
npm install
npm start
```

4. Abre tu navegador web y visita http://localhost:3000 para ver mi curriculum vitae en línea.
