type Listener = () => void;
export class Store<S extends object> {
  private state: S; private listeners = new Set<Listener>();
  constructor(initial: S) { this.state = initial; }
  getState(): S { return this.state; }
  setState(patch: Partial<S>): void { this.state = { ...this.state, ...patch }; this.listeners.forEach(l => l()); }
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
export const uiStore = new Store({
  sidebarOpen: true, loading: false, toast: null as string | null,
  modal: null as string | null, selectedId: null as string | null,
});
