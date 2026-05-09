export interface HubPolicyConfig {
  tools?: Record<string, boolean>;
  resources?: Record<string, boolean>;
  prompts?: Record<string, boolean>;
}

export class HubPolicy {
  constructor(private readonly config: HubPolicyConfig = {}) {}

  allowTool(namespacedName: string): boolean {
    return this.config.tools?.[namespacedName] ?? true;
  }

  allowResource(uri: string): boolean {
    return this.config.resources?.[uri] ?? true;
  }

  allowPrompt(namespacedName: string): boolean {
    return this.config.prompts?.[namespacedName] ?? true;
  }
}
