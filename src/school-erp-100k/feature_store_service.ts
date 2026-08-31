// TypeScript feature store service interface
import { uid } from "./utils";

export interface FeatureRecord {
  id: string;
  entityId: string;
  featureName: string;
  val: number | string;
  ts: number;
}

export const FeatureStoreService = {
  store: [] as FeatureRecord[],
  record(entityId: string, featureName: string, val: number | string): FeatureRecord {
    const item: FeatureRecord = { id: uid("ft"), entityId, featureName, val, ts: Date.now() };
    this.store.push(item);
    return item;
  },
  queryAsOf(entityId: string, featureName: string, asOfTs: number): FeatureRecord | undefined {
    return this.store
      .filter(r => r.entityId === entityId && r.featureName === featureName && r.ts <= asOfTs)
      .sort((a, b) => b.ts - a.ts)[0];
  }
};
