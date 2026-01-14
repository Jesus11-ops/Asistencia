// 🔥 Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, getDoc, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ✅ TU CONFIG REAL (la que pegaste)
const firebaseConfig = {
  apiKey: "AIzaSyBkXf_3vpzgqMBnvq-WZ5LOUOsrwBuqYec",
  authDomain: "control-de-asistencia-569a8.firebaseapp.com",
  projectId: "control-de-asistencia-569a8",
  storageBucket: "control-de-asistencia-569a8.firebasestorage.app",
  messagingSenderId: "727235525470",
  appId: "1:727235525470:web:e37c4656a5c47fa601adcf"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("🔥 Firebase conectado correctamente");

// Membresía persistente en Firestore (colección `meta`, documento `membresia`)
const membRef = doc(db, 'meta', 'membresia');

// Sincronizar en tiempo real desde Firestore; usar localStorage como fallback
onSnapshot(membRef, snap => {
  const el = document.getElementById('membresiaValue');
  if(!el) return;
  if(snap.exists()){
    const v = snap.data().value ?? 0;
    el.innerText = String(v);
    try{ localStorage.setItem('totalMembresia', String(v)); }catch(e){}
  }else{
    // fallback local
    const v = localStorage.getItem('totalMembresia') || '0';
    el.innerText = v;
  }
});

window.agregarMembresia = async function(){
  const current = localStorage.getItem('totalMembresia') || '0';
  const val = prompt('Ingrese número total de membresía (ej. 25):', current);
  if(val === null) return;
  if(isNaN(Number(val))){ alert('Valor inválido'); return; }
  const num = Number(val);
  try{
    await setDoc(membRef, { value: num });
    localStorage.setItem('totalMembresia', String(num));
  }catch(err){
    console.error('Error guardando membresia en Firestore', err);
    alert('Error guardando en base de datos, se guardó localmente');
    try{ localStorage.setItem('totalMembresia', String(num)); }catch(e){}
    const el = document.getElementById('membresiaValue'); if(el) el.innerText = String(num);
  }
}

window.editarMembresia = function(){
  window.agregarMembresia();
}

// --------- GUARDAR ASISTENCIA ----------
window.guardar = async function () {
  const dama = Number(document.getElementById("dama").value);
  const caballeros = Number(document.getElementById("caballeros").value);
  const adolescentes = Number(document.getElementById("adolescentes").value);
  const ninos = Number(document.getElementById("ninos").value);
  const visitas = Number(document.getElementById("visitas").value);
  const fechaInput = document.getElementById("fecha").value;

const [anio, mes, dia] = fechaInput.split("-");
const fechaObj = new Date(anio, mes - 1, dia);

const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const diaSemana = dias[fechaObj.getDay()];


  

  const membresia = dama + caballeros + adolescentes + ninos + visitas;

  await addDoc(collection(db, "asistencia"), {
  fecha: fechaInput,
  diaSemana,
  dama,
  caballeros,
  adolescentes,
  ninos,
  visitas,
  membresia
});


  alert("✅ Asistencia guardada correctamente");
  // Limpiar campos del formulario después de guardar
  const campos = ["fecha", "dama", "caballeros", "adolescentes", "ninos", "visitas"];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // poner foco en la fecha
  const fechaEl = document.getElementById("fecha");
  if (fechaEl) fechaEl.focus();
};

// --------- MOSTRAR REGISTROS (separamos por semestres) ----------
const registrosPrimero = document.getElementById("totalesPrimero");
const registrosSegundo = document.getElementById("totalesSegundo");

// exigir autenticación: si no hay usuario, ir a login
onAuthStateChanged(auth, user => {
  if (!user) {
    // si no estamos en index.html, redirigimos a login
    if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) {
      window.location.href = 'index.html';
    }
  }
});

if (registrosPrimero && registrosSegundo) {
  // Ordenar la consulta por `fecha` para mantener la secuencia cronológica
  const q = query(collection(db, "asistencia"), orderBy('fecha', 'asc'));
  onSnapshot(q, (snapshot) => {
    registrosPrimero.innerHTML = "";
    registrosSegundo.innerHTML = "";

    const porMes = {};

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const fecha = new Date(d.fecha);
      const mesClave = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;

      if (!porMes[mesClave]) {
        porMes[mesClave] = {
          totalMembresia: 0,
          cultos: 0,
          registros: []
        };
      }

      porMes[mesClave].totalMembresia += d.membresia;
      porMes[mesClave].cultos++;
      // guardar también el id del documento para poder editar/eliminar
      porMes[mesClave].registros.push({ id: docSnap.id, ...d });
    });

    // ordenar claves por año-mes asc
    const claves = Object.keys(porMes).sort((a, b) => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      if (ay !== by) return ay - by;
      return am - bm;
    });

    // para cada mes, decidir primer o segundo semestre (1-6 primer, 7-12 segundo)
    claves.forEach(mes => {
      const datos = porMes[mes];
      const promedio = Math.round(datos.totalMembresia / datos.cultos);
      const monthNum = Number(mes.split('-')[1]);

      const html = `
        <details class="mes-detalle">
          <summary>
            <div class="summary-header">
              <div class="left">
                <div class="month-line">
                  <span class="cultos-badge">${datos.cultos}</span>
                  <div>
                    <div class="month-title">📆 ${nombreMes(mes)}</div>
                    <div class="subtitulo muted">Promedio por culto: ${promedio}</div>
                  </div>
                </div>
              </div>
              <div class="right">
                <div class="total-label"><strong>Total:</strong> ${datos.totalMembresia}</div>
              </div>
            </div>
          </summary>
          <div class="registros-grid">
            ${datos.registros.map(r => `
              <div class="registro">
                <div class="registro-header">📅 ${r.diaSemana ?? "Día no registrado"} • ${r.fecha}</div>
                <div class="registro-body">
                  <div>👩 Damas: ${r.dama}</div>
                  <div>👨 Caballeros: ${r.caballeros}</div>
                  <div>🧑‍🎓 Adolescentes: ${r.adolescentes}</div>
                  <div>👶 Niños: ${r.ninos}</div>
                  <div>🙋 Visitas: ${r.visitas}</div>
                  <div><strong>👥 Total: ${r.membresia}</strong></div>
                </div>
                <div class="registro-actions">
                  <button class="btn edit" type="button" onclick="editarRegistro('${r.id}')">Editar</button>
                  <button class="btn delete" type="button" onclick="eliminarRegistro('${r.id}')">Eliminar</button>
                </div>
              </div>
            `).join('')}
          </div>
        </details>
      `;

      if (monthNum >= 1 && monthNum <= 6) {
        registrosPrimero.innerHTML += html;
      } else {
        registrosSegundo.innerHTML += html;
      }
    });
  });
}

// cargar valor membresía al inicio
window.cargarMembresia = function(){
  const el = document.getElementById('membresiaValue');
  try{
    const v = localStorage.getItem('totalMembresia');
    if(el){
      el.innerText = v !== null ? String(v) : '0';
    }
  }catch(e){
    if(el) el.innerText = '0';
  }
}

// Ejecutar inicialización de membresía
cargarMembresia();

// cerrar sesión y volver a login
// cerrar sesión y volver a login
window.cerrarSesion = async function(){
  try{
    await signOut(auth);
  }catch(e){
    console.error('Error cerrando sesión', e);
  }
  // volver simple al login (comportamiento original)
  window.location.href = 'index.html';
}

function nombreMes(clave) {
  const [anio, mes] = clave.split("-");
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  return `${meses[mes - 1]} ${anio}`;
}

// ----- Controladores mínimos para los botones (placeholder) -----
// month-level edit/delete handlers removed (buttons moved to each registro)

// ----- Editar / Eliminar registro individual -----
window.editarRegistro = async function(id){
  try{
    const ref = doc(db, 'asistencia', id);
    const snap = await getDoc(ref);
    if(!snap.exists()) return alert('Registro no encontrado');
    const data = snap.data();
    // Pedir nuevos valores (prompts sencillos). Cancelar si el usuario pulsa Cancelar.
    const fecha = prompt('Fecha (YYYY-MM-DD):', data.fecha);
    if(fecha === null) return;
    const dama = prompt('Damas:', data.dama);
    if(dama === null) return;
    const caballeros = prompt('Caballeros:', data.caballeros);
    if(caballeros === null) return;
    const adolescentes = prompt('Adolescentes:', data.adolescentes);
    if(adolescentes === null) return;
    const ninos = prompt('Niños:', data.ninos);
    if(ninos === null) return;
    const visitas = prompt('Visitas:', data.visitas);
    if(visitas === null) return;

    // calcular dia de la semana y membresia
    const [anio, mes, dia] = String(fecha).split('-');
    const fechaObj = new Date(anio, (mes||1)-1, dia);
    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const diaSemana = dias[fechaObj.getDay()];
    const membre = Number(dama) + Number(caballeros) + Number(adolescentes) + Number(ninos) + Number(visitas);

    await updateDoc(ref, {
      fecha,
      diaSemana,
      dama: Number(dama),
      caballeros: Number(caballeros),
      adolescentes: Number(adolescentes),
      ninos: Number(ninos),
      visitas: Number(visitas),
      membresia: membre
    });

    alert('Registro actualizado');
  }catch(err){
    console.error(err);
    alert('Error al editar registro');
  }
}

window.eliminarRegistro = async function(id){
  try{
    const conf = confirm('¿Eliminar este registro?');
    if(!conf) return;
    const ref = doc(db, 'asistencia', id);
    await deleteDoc(ref);
    alert('Registro eliminado');
  }catch(err){
    console.error(err);
    alert('Error al eliminar registro');
  }
}
