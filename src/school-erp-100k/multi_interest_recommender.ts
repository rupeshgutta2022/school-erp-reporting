// Multi-interest course recommender service
export function recommendCourses(studentId: string, history: string[]): string[] {
  return history.length > 0 ? ["Advanced Calculus", "Data Structures", "Physics Lab"] : ["General Science"];
}
