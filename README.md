# Personal RAG Assistant — UI

Frontend de [`personal-rag-assistant`](https://github.com/Acedpol/personal-rag-assistant): sube documentos, pregunta en lenguaje natural, recibe respuestas ancladas en su contenido con las fuentes citadas.

Repo independiente que consume el backend RAG únicamente por HTTP — nunca comparte código ni carpeta con él.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- React Router
- TanStack Query — estado de servidor, cache e invalidación
- React Hook Form + Zod — validación de formularios
- `openapi-typescript` + `openapi-fetch` — cliente API tipado generado desde el OpenAPI real del backend

## Sin autenticación (deliberado)

El backend (`personal-rag-assistant`) no tiene auth — herramienta de un solo usuario, una colección compartida. Este frontend no incluye login ni gestión de sesión.

## Arrancar en local

Con el backend corriendo en `http://127.0.0.1:8010`:

```bash
npm install
cp .env.example .env
npm run dev
```

Para regenerar el cliente tipado tras un cambio de schema en el backend:

```bash
npm run gen:api
```

## Tests

```bash
npm test
```
