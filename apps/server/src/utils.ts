import type { ZodObject } from "zod";

export async function wrapOrNotFound<T>(schema: ZodObject, value: T | null): Promise<Response> {
  if (!value) {
    return new Response("Not Found", { status: 404 });
  }

  return Response.json(await schema.parseAsync(value));
}

export function redirect(location: string): Response {
  const headers: ResponseInit["headers"] = { Location: location };
  return new Response(null, { status: 302, headers });
}

export function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}

export function internalServerError(): Response {
  return new Response(null, { status: 500 });
}
export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function requireEnv(name: string): string {
  const env = process.env[name];
  if (!env) {
    throw Error(`Variable ${name} was not present!`);
  }
  return env;
}

export function getBaseUrl(): string {
  return requireEnv("BASE_URL");
}
