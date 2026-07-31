import type { ComponentCategory, ComponentDefinition } from "@productstudio/component-sdk";

export class ComponentNotFoundError extends Error {
  constructor(type: string) {
    super(`Component not found: ${type}`);
    this.name = "ComponentNotFoundError";
  }
}

export class ComponentRegistry {
  private definitions = new Map<string, ComponentDefinition>();

  register(def: ComponentDefinition): void {
    if (this.definitions.has(def.type)) {
      throw new Error(`Duplicate component type: ${def.type}`);
    }
    if (!def.propsSchema) {
      throw new Error(`Missing propsSchema for ${def.type}`);
    }
    this.definitions.set(def.type, def);
  }

  get(type: string): ComponentDefinition {
    const def = this.definitions.get(type);
    if (!def) throw new ComponentNotFoundError(type);
    return def;
  }

  has(type: string): boolean {
    return this.definitions.has(type);
  }

  list(): ComponentDefinition[] {
    return [...this.definitions.values()];
  }

  listByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.list().filter((d) => d.category === category);
  }

  search(query: string): ComponentDefinition[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.list();
    return this.list().filter(
      (d) =>
        d.displayName.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.category.includes(q),
    );
  }

  canDrop(parentType: string, childType: string): boolean {
    const parentDef = this.get(parentType);
    if (!parentDef.acceptsChildren) return false;
    if (!parentDef.allowedChildren) return true;
    return parentDef.allowedChildren.includes(childType);
  }
}

export const componentRegistry = new ComponentRegistry();
