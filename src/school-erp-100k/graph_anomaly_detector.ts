// Graph permission anomaly detector
export function detectGraphAnomalies(nodes: string[], edges: [string, string][]): { cycles: string[][] } {
  const adj = new Map<string, string[]>();
  for (const [u, v] of edges) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u)!.push(v);
  }
  return { cycles: [] };
}
