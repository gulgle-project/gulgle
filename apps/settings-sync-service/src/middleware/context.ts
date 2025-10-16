export interface ContextKey<_T> extends string {}

export class RequestContext {
  constructor(
    public request: Bun.BunRequest,
    public additionalData: Record<string, unknown> = {},
  ) {}

  addData<T>(key: ContextKey<T>, value: T) {
    this.additionalData[key as string] = value;
  }

  getData<T>(key: ContextKey<T>): T | undefined {
    return this.additionalData[key as string] as T | undefined;
  }

  requireData<T>(key: ContextKey<T>): T {
    const value = this.getData(key);
    if (!value) {
      throw new Error(`Missing required context data for key: ${key}`);
    }
    return value;
  }

  getRequest(): Bun.BunRequest {
    return this.request;
  }
}

export const USER_KEY: ContextKey<string> = "user";
