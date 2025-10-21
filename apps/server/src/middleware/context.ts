export type ContextKey<T> = string & { readonly __type?: T };

export class RequestContext {
  private additionalData = new Map<string, unknown>();

  constructor(public request: Bun.BunRequest) {}

  addData<T>(key: ContextKey<T>, value: T): void {
    this.additionalData.set(key, value);
  }

  getData<T>(key: ContextKey<T>): T | undefined {
    return this.additionalData.get(key) as T | undefined;
  }

  requireData<T>(key: ContextKey<T>): T {
    if (!this.additionalData.has(key)) {
      throw new Error(`Missing required context data for key: ${key}`);
    }
    return this.additionalData.get(key) as T;
  }

  getRequest(): Bun.BunRequest {
    return this.request;
  }
}

export const USER_KEY: ContextKey<string> = "user";
