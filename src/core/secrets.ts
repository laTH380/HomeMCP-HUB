import type { SecretProvider } from "../types/plugin.js";

export class EnvironmentSecretProvider implements SecretProvider {
  get(name: string): string | undefined {
    return process.env[name];
  }

  require(name: string): string {
    const value = this.get(name);
    if (!value) {
      throw new Error(`Required secret ${name} is not set`);
    }
    return value;
  }
}
