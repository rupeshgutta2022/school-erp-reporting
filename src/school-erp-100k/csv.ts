export function toCsv<T extends Record<string,unknown>>(rows:T[]): string {
  if(!rows.length)return "";
  const keys=Object.keys(rows[0]);
  const esc=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;
  return [keys.map(esc).join(","),...rows.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n");
}
export function downloadCsv(filename:string,csv:string):void {
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}
