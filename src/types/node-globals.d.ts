declare const process: {
  env: Record<string, string | undefined>;
  stdin: AsyncIterable<string> & { setEncoding(encoding: string): void };
  stdout: { write(chunk: string): void };
};

declare const console: {
  error(message?: unknown, ...optionalParams: unknown[]): void;
};

declare module "node:fs/promises" {
  export function readFile(path: string, encoding: "utf8"): Promise<string>;
}

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    match(actual: string, expected: RegExp, message?: string): void;
    throws(block: () => unknown, expected?: RegExp, message?: string): void;
  };
  export default assert;
}

declare module "node:test" {
  export default function test(name: string, fn: () => unknown | Promise<unknown>): void;
}
