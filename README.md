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

## Selección de proveedor de respuestas

La pantalla de Preguntar incluye un toggle Google Gemini / Claude, con Gemini como opción por defecto. Las opciones disponibles se leen de `GET /providers` del backend en tiempo real — si una de las dos no tiene su API key configurada ahí, el botón correspondiente aparece deshabilitado en vez de dejar elegirla y caer en silencio a una respuesta simulada. No hay variables de entorno de proveedor en este frontend (nada como `VITE_DEFAULT_PROVIDER`) — la disponibilidad depende siempre del backend, nunca de configuración estática aquí.

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

## Bugs reales encontrados construyendo esto

1. **`openapi-fetch` no construye `multipart/form-data` automáticamente**: pasarle un body tipado a `apiClient.POST('/documents', { body: { file } })` no arma un `FormData` real — la subida de documentos fallaba con 422 hasta añadir un `bodySerializer` explícito. Encontrado reproduciendo el fallo contra el backend real, no asumido. Documentado también como gotcha reutilizable en la Skill `scaffold-react-frontend`.
2. **`File` de jsdom vs. `File` de undici rompe los tests de subida**: en el entorno de test (Vitest + jsdom + MSW), un `File` construido con el `File` global de jsdom no lo reconoce el parser de multipart de undici que usa MSW en Node — y a la inversa, un `File` de `node:buffer` sí lo reconoce el servidor pero pierde el nombre al pasar por `input.files` de jsdom. Sin solución limpia dentro de ese entorno; se verificó el flujo real en el navegador (sí funciona) y se mockeó solo esa interacción concreta en el test, con el resto de peticiones pasando por MSW real. También documentado en la Skill `scaffold-react-frontend`.
3. **Enviar `provider: "mock"` a `/ask` devuelve 422**: cuando el backend no tiene ninguna API key configurada, `GET /providers` informa `default: "mock"` — pero `AskRequest.provider` del backend solo acepta `"google" | "anthropic" | null`, nunca `"mock"` (no es una elección real de proveedor, es la ausencia de una). El frontend enviaba ese valor tal cual. Encontrado verificando en el navegador contra el backend real (no solo contra los mocks de MSW, que no habrían detectado el desajuste de contrato) — corregido filtrando `"mock"` antes de enviarlo, con test de regresión que inspecciona el body real de la petición.
