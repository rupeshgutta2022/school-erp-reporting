export type Route = {path:string, render:()=>void};
export class Router {
  constructor(private routes:Route[], private outlet:HTMLElement) {}
  start(){ window.addEventListener("popstate",()=>this.go(location.pathname,false)); this.go(location.pathname,false); }
  go(path:string,push=true){ const r=this.routes.find(x=>x.path===path)||this.routes.find(x=>x.path==="*"); if(push)history.pushState({}, "", path); r?.render(); }
}
