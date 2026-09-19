# Backend — IED La Victoria

API NestJS que expone el modelo relacional del sistema escolar. Supabase aporta PostgreSQL, Auth y Storage. Las reglas de negocio y el RBAC viven en Nest.

Las tablas de negocio viven en el schema PostgreSQL **`proyecto-universidad`** (adaptación de `proyecto-c/migrations/model/modelo.sql`). Auth (`auth.users`) y Storage (`storage.buckets`) siguen en los schemas nativos de Supabase.

## Arranque

1. Cree un proyecto en [Supabase](https://supabase.com).
2. En el SQL Editor ejecute, en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_catalogs.sql`
   - `supabase/migrations/003_storage_buckets.sql`
3. En **Project Settings → API → Exposed schemas** agregue `proyecto-universidad`. Sin ese paso PostgREST no ve las tablas (el schema `public` queda vacío a propósito).
4. Copie `.env.example` a `.env` y complete `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_KEY`. `SUPABASE_DB_SCHEMA=proyecto-universidad` ya es el valor por defecto.
5. Instale y levante:

```bash
npm install
npm run start:dev
```

La API queda en `http://localhost:3001/api`. Swagger: `http://localhost:3001/api/docs`.

## Primer administrador

Si la tabla `"proyecto-universidad".usuario` está vacía:

```http
POST /api/auth/bootstrap
{
  "identificacion": "72145678",
  "usuario": "cmendoza",
  "contrasena": "Admin123!",
  "nombre": "Carlos Alberto",
  "apellido": "Mendoza Ríos",
  "email": "cmendoza@iedlavictoria.edu.co"
}
```

Luego `POST /api/auth/login` con el mismo `usuario` o correo.

## Autenticación

Las rutas (salvo `/auth/login`, `/auth/refresh`, `/auth/bootstrap` y `/health`) requieren `Authorization: Bearer <access_token>`. Los permisos se evalúan contra `rol_permiso`.
