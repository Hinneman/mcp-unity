export interface HierarchySummary {
  totalObjects: number;
  activeObjects: number;
  rootObjects: number;
  maxDepth: number;
  samplePaths: string[];
}

const SAMPLE_LIMIT = 10;

function getNodeName(node: any): string {
  const name = node?.name ?? 'Unnamed';
  return String(name);
}

function isNodeActive(node: any): boolean {
  const active = node?.activeSelf ?? node?.active ?? node?.isActive;
  return Boolean(active);
}

function getChildren(node: any): any[] {
  return Array.isArray(node?.children) ? node.children : [];
}

export function countHierarchyObjects(hierarchy: any[]): number {
  let count = 0;

  function walk(node: any) {
    if (!node) return;
    count += 1;
    for (const child of getChildren(node)) {
      walk(child);
    }
  }

  if (Array.isArray(hierarchy)) {
    for (const root of hierarchy) {
      walk(root);
    }
  }

  return count;
}

export function summarizeHierarchy(hierarchy: any[]): HierarchySummary {
  let totalObjects = 0;
  let activeObjects = 0;
  let maxDepth = 0;
  const samplePaths: string[] = [];

  function walk(node: any, path: string, depth: number) {
    if (!node) return;
    totalObjects += 1;
    if (isNodeActive(node)) {
      activeObjects += 1;
    }
    if (depth > maxDepth) {
      maxDepth = depth;
    }

    if (samplePaths.length < SAMPLE_LIMIT) {
      samplePaths.push(path);
    }

    for (const child of getChildren(node)) {
      const childName = getNodeName(child);
      walk(child, `${path}/${childName}`, depth + 1);
    }
  }

  const roots = Array.isArray(hierarchy) ? hierarchy : [];
  for (const root of roots) {
    const rootName = getNodeName(root);
    walk(root, rootName, 1);
  }

  return {
    totalObjects,
    activeObjects,
    rootObjects: roots.length,
    maxDepth,
    samplePaths,
  };
}
