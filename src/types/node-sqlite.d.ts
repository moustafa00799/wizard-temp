declare module "node:sqlite" {
  export class StatementSync {
    run(...parameters: unknown[]): unknown;
    get<T = Record<string, unknown>>(...parameters: unknown[]): T | undefined;
    all<T = Record<string, unknown>>(...parameters: unknown[]): T[];
  }

  export class DatabaseSync {
    constructor(location: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
