export type ID = string;
export type Role = "admin" | "principal" | "teacher" | "accountant" | "parent" | "student";

export interface Student {
  id: ID; admissionNo: string; name: string; classId: ID; section: string;
  gender: "Male" | "Female" | "Other"; dateOfBirth: string; phone: string;
  email: string; guardianName: string; guardianPhone: string; status: "active" | "inactive";
}

export interface Teacher {
  id: ID; employeeNo: string; name: string; subject: string; email: string;
  phone: string; department: string; status: "active" | "inactive";
}

export interface AttendanceRecord {
  id: ID; studentId: ID; date: string; status: "present" | "absent" | "late" | "leave";
  remarks?: string;
}

export interface ExamResult {
  id: ID; studentId: ID; subject: string; exam: string; maxMarks: number; marks: number;
  grade: string; remarks?: string;
}

export interface FeeInvoice {
  id: ID; studentId: ID; invoiceNo: string; dueDate: string; amount: number;
  paid: number; status: "unpaid" | "partial" | "paid" | "overdue";
}

export interface Notification {
  id: ID; title: string; message: string; audience: Role[]; read: boolean; createdAt: string;
}

export interface AuditLog {
  id: ID; actor: ID; action: string; entity: string; entityId: ID; createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Page<T> { items: T[]; total: number; page: number; pageSize: number; }
export interface ApiResponse<T> { success: boolean; data?: T; error?: string; }
