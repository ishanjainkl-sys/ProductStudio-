import type { PageDocument } from "@productstudio/shared-types";
import { CURRENT_SCHEMA_VERSION } from "@productstudio/shared-types";

type Migrator = (doc: PageDocument) => PageDocument;

const MIGRATIONS: Record<number, Migrator> = {
  // Example: 1 -> 2 would live here as migrate_v1_to_v2
};

export function migratePageDocument(doc: PageDocument): PageDocument {
  let current = doc;
  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[current.schemaVersion];
    if (!migrate) {
      throw new Error(`No migration from schemaVersion ${current.schemaVersion}`);
    }
    current = migrate(current);
  }
  return current;
}
