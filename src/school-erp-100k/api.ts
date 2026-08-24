import { repository } from "./repository";
import { dashboardMetrics } from "./analytics";
export async function api<T>(work:()=>T):Promise<{success:true,data:T}|{success:false,error:string}> {
  try { return {success:true,data:work()}; } catch(e) { return {success:false,error:e instanceof Error?e.message:"Unknown error"}; }
}
export const endpoints = {
  dashboard: () => api(dashboardMetrics),
  students: (q="",p=1) => api(()=>repository.students.list(q,p)),
  student: (id:string) => api(()=>repository.students.get(id)),
  teachers: (q="",p=1) => api(()=>repository.teachers.list(q,p)),
  attendance: (studentId?:string,date?:string) => api(()=>repository.attendance.list(studentId,date)),
  results: (studentId?:string,exam?:string) => api(()=>repository.results.list(studentId,exam)),
  invoices: (studentId?:string) => api(()=>repository.invoices.list(studentId)),
  notifications: () => api(()=>repository.notifications.list()),
};
