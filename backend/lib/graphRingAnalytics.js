// AegisGuard Topological Graph Ring & Privilege Anomaly Analytics
class GraphRingAnalytics {
  constructor() {
    this.graph = new Map();
  }

  addRelation(source, target) {
    if (!this.graph.has(source)) this.graph.set(source, new Set());
    this.graph.get(source).add(target);
  }

  findCircularRings() {
    const visited = new Set();
    const stack = new Set();
    const rings = [];

    const traverse = (node, path) => {
      visited.add(node);
      stack.add(node);
      const targets = this.graph.get(node) || new Set();

      for (const next of targets) {
        if (!visited.has(next)) {
          traverse(next, [...path, next]);
        } else if (stack.has(next)) {
          const startIndex = path.indexOf(next);
          rings.push(path.slice(startIndex));
        }
      }
      stack.delete(node);
    };

    for (const node of this.graph.keys()) {
      if (!visited.has(node)) traverse(node, [node]);
    }
    return rings;
  }
}

module.exports = GraphRingAnalytics;
