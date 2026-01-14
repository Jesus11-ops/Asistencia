// Ahora exportar desde Firestore para incluir todos los registros guardados
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkXf_3vpzgqMBnvq-WZ5LOUOsrwBuqYec",
  authDomain: "control-de-asistencia-569a8.firebaseapp.com",
  projectId: "control-de-asistencia-569a8",
  storageBucket: "control-de-asistencia-569a8.firebasestorage.app",
  messagingSenderId: "727235525470",
  appId: "1:727235525470:web:e37c4656a5c47fa601adcf"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

window.exportarExcel = async function exportarExcel() {
  const rows = [];
  rows.push(["Fecha", "Damas", "Caballeros", "Adolescentes", "Niños", "Visitas", "Total Asistencia"]);

  try {
    const q = query(collection(db, 'asistencia'), orderBy('fecha', 'asc'));
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const d = docSnap.data();
      rows.push([
        d.fecha || '',
        Number(d.dama || 0),
        Number(d.caballeros || 0),
        Number(d.adolescentes || 0),
        Number(d.ninos || 0),
        Number(d.visitas || 0),
        Number(d.membresia || 0)
      ]);
    });
  } catch (err) {
    console.error('Error leyendo Firestore para exportar:', err);
    alert('No se pudieron leer los registros desde la base de datos. Intentando usar la vista actual.');
    // fallback: usar DOM como antes
    document.querySelectorAll('.registro').forEach(r => {
      const header = r.querySelector('.registro-header')?.innerText || '';
      const fechaPart = header.includes('•') ? header.split('•').pop().trim() : header.trim();
      const bodyDivs = Array.from(r.querySelectorAll('.registro-body > div'));
      const getValue = (idx) => {
        const txt = (bodyDivs[idx]?.innerText || '');
        const parts = txt.split(':');
        return parts.length > 1 ? parts.pop().trim() : txt.trim();
      }
      const dama = getValue(0) || '0';
      const caballeros = getValue(1) || '0';
      const adolescentes = getValue(2) || '0';
      const ninos = getValue(3) || '0';
      const visitas = getValue(4) || '0';
      const membresiaText = getValue(5) || '';
      const membresia = (membresiaText.match(/\d+/) || ['0'])[0];
      rows.push([fechaPart, Number(dama), Number(caballeros), Number(adolescentes), Number(ninos), Number(visitas), Number(membresia)]);
    });
  }

  async function createAndDownloadXLSX(dataRows) {
    const runWithExcelJS = async () => {
      // Crear workbook/worksheet con ExcelJS
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Asistencia');

      // Definir columnas con anchos
      ws.columns = [
        { header: dataRows[0][0], key: 'fecha', width: 18 },
        { header: dataRows[0][1], key: 'damas', width: 10 },
        { header: dataRows[0][2], key: 'caballeros', width: 12 },
        { header: dataRows[0][3], key: 'adolescentes', width: 14 },
        { header: dataRows[0][4], key: 'ninos', width: 10 },
        { header: dataRows[0][5], key: 'visitas', width: 10 },
        { header: dataRows[0][6], key: 'total', width: 14 }
      ];

      // Estilo de cabecera: fondo azul, texto blanco negrita, centrado
      const headerRow = ws.getRow(1);
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E86AB' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Añadir filas de datos (empezando en la segunda fila)
      for (let i = 1; i < dataRows.length; i++) {
        ws.addRow(dataRows[i]);
      }

      // Generar archivo y forzar descarga
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asistencia.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    };

    if (window.ExcelJS) {
      await runWithExcelJS();
      return;
    }

    // Cargar ExcelJS desde CDN
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js';
      script.onload = () => { resolve(); };
      script.onerror = () => { reject(new Error('No se pudo cargar ExcelJS')); };
      document.head.appendChild(script);
    });

    // ExcelJS expone ExcelJS global; adaptarnos si está en window.ExcelJS
    if (!window.ExcelJS && window.exceljs) {
      window.ExcelJS = window.exceljs;
    }

    if (!window.ExcelJS) {
      alert('No se pudo cargar la librería para estilizar el Excel.');
      return;
    }

    // ExcelJS está cargado en window.ExcelJS; crear instancia real
    // Nota: la CDN coloca ExcelJS en global 'ExcelJS'
    const ExcelJSLib = window.ExcelJS || window.exceljs || window.Excel;
    // ExcelJS constructor is global; but the workbook class is at ExcelJS.Workbook
    const ExcelJS = window.ExcelJS || window.exceljs || window.ExcelJS;
    // some CDN builds expose ExcelJS as global ExcelJS
    await runWithExcelJS();
  }

  await createAndDownloadXLSX(rows);
}
