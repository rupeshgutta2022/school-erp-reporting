import { repository } from "./repository";
import { formatINR } from "./utils";
export function feeReport() {
  return repository.raw.invoices.map(x=>({invoice:x.invoiceNo,student:x.studentId,amount:formatINR(x.amount),paid:formatINR(x.paid),balance:formatINR(x.amount-x.paid),status:x.status}));
}
export function attendanceReport() {
  return repository.raw.students.map(s=>{const a=repository.attendance.list(s.id);const p=a.filter(x=>x.status==="present").length;return {student:s.name,total:a.length,present:p,rate:a.length?Math.round(p/a.length*100):0};});
}
export function marksReport() {
  return repository.raw.students.map(s=>{const r=repository.results.list(s.id);const pct=r.length?Math.round(r.reduce((a,x)=>a+x.marks,0)/r.reduce((a,x)=>a+x.maxMarks,0)*100):0;return {student:s.name,percentage:pct,result:pct>=40?"Pass":"Fail"};});
}
