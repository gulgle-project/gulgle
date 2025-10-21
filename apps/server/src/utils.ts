import type { ZodObject } from "zod";
export class Lock {
	private mutex = new Int32Array(new SharedArrayBuffer(4));

	tryLock(timeoutMs?: number) {
		const begin = Date.now();
		while (true) {
			// Try to change 0 (unlocked) to 1 (locked)
			if (Atomics.compareExchange(this.mutex, 0, 0, 1) === 0) {
				return; // Lock acquired
			}

			if (timeoutMs && Date.now() - begin > timeoutMs) {
				throw new Error("Timeout waiting for lock");
			}

			// Optional: yield to avoid busy waiting burning CPU
			Atomics.wait(this.mutex, 0, 1, 10); // Wait up to 10ms if locked
		}
	}

	async tryLockAsync(timeoutMs?: number): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.tryLock(timeoutMs);
			} catch (e) {
				reject(e);
			}

			resolve();
		});
	}

	unlock() {
		Atomics.store(this.mutex, 0, 0);
		Atomics.notify(this.mutex, 0);
	}
}

export async function wrapOrNotFound<T>(
	schema: ZodObject,
	value: T | null,
): Promise<Response> {
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
