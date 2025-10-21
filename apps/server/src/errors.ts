export class OAuthInvalidProviderError extends Error {
  constructor(provider: unknown) {
    super(`OAuth Error invalid provider: ${provider}`);
    this.name = "InvalidProviderError";
  }
}
