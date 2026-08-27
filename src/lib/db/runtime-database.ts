import fs from "node:fs";
import path from "node:path";
import { createRepositories, openDatabase, type DatabaseRepositories } from "./database";

const DATABASE_PATH = process.env.CDKS_APP_DB_PATH ?? path.join(process.cwd(), ".local", "cdks-app.sqlite");

type RuntimeDatabaseState = {
  database: ReturnType<typeof openDatabase>;
  repositories: DatabaseRepositories;
};

declare global {
  // eslint-disable-next-line no-var
  var __cdksAppDatabaseState: RuntimeDatabaseState | undefined;
}

export function getRuntimeDatabaseState(): RuntimeDatabaseState {
  if (globalThis.__cdksAppDatabaseState) return globalThis.__cdksAppDatabaseState;
  if (DATABASE_PATH !== ":memory:") fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
  const database = openDatabase(DATABASE_PATH);
  const repositories = createRepositories(database);
  const state = { database, repositories };
  globalThis.__cdksAppDatabaseState = state;
  return state;
}
