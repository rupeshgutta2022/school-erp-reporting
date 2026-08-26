import { endpoints } from "./api";
import { actions } from "./ui-actions";
export async function loadDashboard(onData:(data:any)=>void) {
  actions.startLoading(); const res=await endpoints.dashboard(); actions.stopLoading();
  if(res.success) onData(res.data); else actions.toast(res.error);
}
export async function savePayment(id:string,amount:number,onDone=()=>{}) {
  actions.startLoading(); const res=await (async()=>{try{return {success:true as const,data:(await import("./repository")).repository.invoices.pay(id,amount)} as const}catch(e){return {success:false as const,error:e instanceof Error?e.message:"Payment failed"}}})(); actions.stopLoading();
  if(res.success){actions.toast("Payment recorded successfully");onDone();}else actions.toast(res.error);
}
export async function searchStudents(query:string,onData:(data:any)=>void){const r=await endpoints.students(query);if(r.success)onData(r.data);else actions.toast(r.error);}
