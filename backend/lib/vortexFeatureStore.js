// Vortex Point-in-Time Accurate Feature Store
class VortexFeatureStore {
  constructor() {
    this.registry = new Map();
  }

  setFeature(entityId, featureKey, value, timestamp = Date.now()) {
    if (!this.registry.has(entityId)) {
      this.registry.set(entityId, new Map());
    }
    const entityStore = this.registry.get(entityId);
    if (!entityStore.has(featureKey)) {
      entityStore.set(featureKey, []);
    }
    entityStore.get(featureKey).push({ value, timestamp });
  }

  asOfJoin(entityId, featureKey, targetTimestamp) {
    const entityStore = this.registry.get(entityId);
    if (!entityStore || !entityStore.has(featureKey)) return null;

    const history = entityStore.get(featureKey);
    const valid = history
      .filter(item => item.timestamp <= targetTimestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    return valid.length > 0 ? valid[0].value : null;
  }
}

module.exports = new VortexFeatureStore();
