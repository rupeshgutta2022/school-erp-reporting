import { Student, Teacher, AttendanceRecord, ExamResult, FeeInvoice, Notification, AuditLog, Page, ID } from "./types";
import { uid, today } from "./utils";

const db = {
  students: [] as Student[], teachers: [] as Teacher[], attendance: [] as AttendanceRecord[],
  results: [] as ExamResult[], invoices: [] as FeeInvoice[], notifications: [] as Notification[],
  audit: [] as AuditLog[],
};

export function seed(): void {
  if (db.students.length) return;
  for (let i = 1; i <= 250; i++) db.students.push({
    id: uid("stu"), admissionNo: `ADM${String(i).padStart(4, "0")}`, name: `Student ${i}`,
    classId: `class-${(i % 10) + 1}`, section: ["A","B","C","D"][i % 4],
    gender: i % 2 ? "Male" : "Female", dateOfBirth: `2010-${String((i % 12)+1).padStart(2,"0")}-15`,
    phone: `9${String(100000000 + i).slice(0,9)}`, email: `student${i}@school.edu`,
    guardianName: `Guardian ${i}`, guardianPhone: `8${String(100000000 + i).slice(0,9)}`, status: "active"
  });
  for (let i = 1; i <= 35; i++) db.teachers.push({
    id: uid("tea"), employeeNo: `EMP${String(i).padStart(3,"0")}`, name: `Teacher ${i}`,
    subject: ["Mathematics","Science","English","Social Studies","Computer Science"][i % 5],
    email: `teacher${i}@school.edu`, phone: `9${String(200000000+i).slice(0,9)}`,
    department: ["Academic","Administration","IT"][i%3], status: "active"
  });
  db.students.forEach((s, i) => {
    for (let d = 0; d < 20; d++) db.attendance.push({
      id: uid("att"), studentId: s.id,
      date: new Date(Date.now() - d * 86400000).toISOString().slice(0,10),
      status: (i+d)%17 === 0 ? "absent" : (i+d)%23 === 0 ? "late" : "present"
    });
    ["Unit Test 1","Mid Term","Unit Test 2","Final"].forEach((exam, e) =>
      ["Mathematics","Science","English","Social Studies"].forEach((subject, j) => {
        const marks = 45 + ((i*7 + e*11 + j*13) % 51);
        db.results.push({ id: uid("res"), studentId: s.id, subject, exam, maxMarks: 100, marks,
          grade: marks >= 90 ? "A+" : marks >= 80 ? "A" : marks >= 70 ? "B" : marks >= 60 ? "C" : marks >= 50 ? "D" : "F" });
      })
    );
    const amount = 12000 + (i % 5) * 1500, paid = i % 4 === 0 ? amount : i % 3 === 0 ? amount/2 : 0;
    db.invoices.push({ id: uid("inv"), studentId: s.id, invoiceNo: `INV-${2026}-${String(i+1).padStart(4,"0")}`,
      dueDate: `2026-${String((i%9)+1).padStart(2,"0")}-20`, amount, paid,
      status: paid >= amount ? "paid" : paid > 0 ? "partial" : i % 7 === 0 ? "overdue" : "unpaid" });
  });
}
seed();

function page<T>(items: T[], pageNo = 1, pageSize = 25): Page<T> {
  const start = (pageNo - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page: pageNo, pageSize };
}
export const repository = {
  students: {
    list(q="", pageNo=1, pageSize=25) { const x=q.toLowerCase(); return page(db.students.filter(s => [s.name,s.admissionNo,s.email,s.section].some(v=>v.toLowerCase().includes(x))),pageNo,pageSize); },
    get(id:ID) { return db.students.find(x=>x.id===id); },
    create(input: Omit<Student,"id">) { const item={...input,id:uid("stu")}; db.students.push(item); return item; },
    update(id:ID, patch:Partial<Student>) { const x=this.get(id); if(!x) throw Error("Student not found"); Object.assign(x,patch); return x; },
    remove(id:ID) { const n=db.students.length; db.students=db.students.filter(x=>x.id!==id); return n!==db.students.length; },
  },
  teachers: {
    list(q="", pageNo=1, pageSize=25) { const x=q.toLowerCase(); return page(db.teachers.filter(t => [t.name,t.employeeNo,t.subject,t.department].some(v=>v.toLowerCase().includes(x))),pageNo,pageSize); },
    get(id:ID) { return db.teachers.find(x=>x.id===id); },
    create(input:Omit<Teacher,"id">) { const item={...input,id:uid("tea")}; db.teachers.push(item); return item; },
    update(id:ID, patch:Partial<Teacher>) { const x=this.get(id); if(!x) throw Error("Teacher not found"); Object.assign(x,patch); return x; },
    remove(id:ID) { const n=db.teachers.length; db.teachers=db.teachers.filter(x=>x.id!==id); return n!==db.teachers.length; },
  },
  attendance: {
    list(studentId?:ID, date?:string) { return db.attendance.filter(x=>(!studentId||x.studentId===studentId)&&(!date||x.date===date)); },
    mark(studentId:ID, date:string, status:AttendanceRecord["status"], remarks?:string) {
      const old=db.attendance.find(x=>x.studentId===studentId&&x.date===date);
      if(old) Object.assign(old,{status,remarks}); else db.attendance.push({id:uid("att"),studentId,date,status,remarks});
      return db.attendance.find(x=>x.studentId===studentId&&x.date===date)!;
    }
  },
  results: { list(studentId?:ID, exam?:string) { return db.results.filter(x=>(!studentId||x.studentId===studentId)&&(!exam||x.exam===exam)); } },
  invoices: { list(studentId?:ID) { return db.invoices.filter(x=>!studentId||x.studentId===studentId); },
    pay(id:ID, amount:number) { const x=db.invoices.find(v=>v.id===id); if(!x||amount<=0) throw Error("Invalid payment"); x.paid=Math.min(x.amount,x.paid+amount); x.status=x.paid>=x.amount?"paid":"partial"; return x; } },
  notifications: { list() { return [...db.notifications].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); },
    create(n:Omit<Notification,"id"|"createdAt"|"read">) { const x={...n,id:uid("not"),createdAt:new Date().toISOString(),read:false}; db.notifications.push(x); return x; },
    markRead(id:ID) { const x=db.notifications.find(n=>n.id===id); if(x)x.read=true; return x; } },
  audit: { log(actor:ID,action:string,entity:string,entityId:ID,metadata?:Record<string,unknown>) { db.audit.push({id:uid("log"),actor,action,entity,entityId,createdAt:new Date().toISOString(),metadata}); } },
  raw: db,
};
