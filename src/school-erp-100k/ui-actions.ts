import { uiStore } from "./store";
export const actions = {
  openModal(name:string,id?:string){ uiStore.setState({modal:name,selectedId:id??null}); },
  closeModal(){ uiStore.setState({modal:null,selectedId:null}); },
  startLoading(){ uiStore.setState({loading:true}); },
  stopLoading(){ uiStore.setState({loading:false}); },
  toast(message:string){ uiStore.setState({toast:message}); setTimeout(()=>uiStore.setState({toast:null}),3000); },
  toggleSidebar(){ uiStore.setState({sidebarOpen:!uiStore.getState().sidebarOpen}); },
};
export function wireButton(button: HTMLElement, action:()=>void) {
  button.addEventListener("click", e=>{e.preventDefault(); action();});
  button.setAttribute("aria-busy","false");
}
