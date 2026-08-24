import { repository } from "./repository";
import { dashboardMetrics } from "./analytics";
import { actions } from "./ui-actions";
import { formatINR } from "./utils";
import { toCsv, downloadCsv } from "./csv";

export function mountSchoolErpDemo(root: HTMLElement): void {
  root.innerHTML = `
    <div class="erp-shell">
      <header class="erp-header">
        <button data-action="menu">☰</button>
        <strong>School ERP</strong>
        <input id="erp-search" placeholder="Search students..." />
        <button data-action="refresh">Refresh</button>
      </header>
      <nav class="erp-nav">
        ${["dashboard","students","teachers","attendance","exams","fees","reports"].map(x=>`<button data-page="${x}">${x}</button>`).join("")}
      </nav>
      <main id="erp-content"></main>
      <div id="erp-toast" role="status"></div>
    </div>`;
  const content = root.querySelector("#erp-content") as HTMLElement;
  const toast = root.querySelector("#erp-toast") as HTMLElement;
  const render = (page="dashboard") => {
    if(page==="dashboard"){
      const m=dashboardMetrics();
      content.innerHTML=`<section><h1>Dashboard</h1><div class="cards">
        <article>Students <b>${m.activeStudents}</b></article><article>Teachers <b>${m.teachers}</b></article>
        <article>Attendance <b>${m.attendanceRate}%</b></article><article>Outstanding <b>${formatINR(m.outstanding)}</b></article>
      </div></section>`;
    } else if(page==="students"){
      const p=repository.students.list((root.querySelector("#erp-search") as HTMLInputElement).value);
      content.innerHTML=`<h1>Students</h1><button id="export">Export CSV</button><table><thead><tr><th>Admission</th><th>Name</th><th>Class</th><th>Section</th></tr></thead><tbody>
      ${p.items.map(s=>`<tr><td>${s.admissionNo}</td><td>${s.name}</td><td>${s.classId}</td><td>${s.section}</td></tr>`).join("")}</tbody></table>`;
      content.querySelector("#export")?.addEventListener("click",()=>downloadCsv("students.csv",toCsv(p.items as any)));
    } else {
      content.innerHTML=`<section><h1>${page[0].toUpperCase()+page.slice(1)}</h1><p>This module is connected to the ERP data services.</p><button id="action">Run ${page} action</button></section>`;
      content.querySelector("#action")?.addEventListener("click",()=>actions.toast(`${page} action completed`));
    }
  };
  root.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>render((b as HTMLElement).dataset.page)));
  root.querySelector('[data-action="refresh"]')?.addEventListener("click",()=>render());
  root.querySelector("#erp-search")?.addEventListener("input",()=>render("students"));
  root.addEventListener("click",()=>{const s=uiToast();if(s)toast.textContent=s;});
  function uiToast(){return null;}
  render();
}
