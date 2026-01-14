function exportarExcel() {
  let csv = "Fecha,Damas,Caballeros,Adolescentes,Niños,Visitas,Membresía\n";

  document.querySelectorAll(".registro").forEach(r => {
    csv += r.innerText.replace(/ /g, ",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "asistencia.csv";
  a.click();
}
