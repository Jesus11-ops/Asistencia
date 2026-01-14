import { getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Usar la app ya inicializada en `app.js` para evitar inicializar dos veces
const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if(!email || !password){ alert('Ingrese correo y contraseña'); return; }

  console.log('Intentando login con', email);
  signInWithEmailAndPassword(auth, email.trim(), password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((err) => {
      console.error('Login error', err);
      const code = err.code || 'unknown';
      const msg = err.message || '';
      alert(`❌ Error al iniciar sesión: ${code}\n${msg}`);
    });
};

window.crearUsuario = async function(){
  const email = document.getElementById('newEmail').value;
  const password = document.getElementById('newPassword').value;
  if(!email || !password){ alert('Ingrese correo y contraseña'); return; }

  try{
    // comprobar cuántos usuarios existen en la colección `users` (meta control)
    const col = collection(db, 'users');
    const snaps = await getDocs(col);
    if(snaps.size >= 3){ alert('Ya existen 3 usuarios. No se pueden crear más.'); return; }

    // crear usuario en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // guardar metadata en Firestore
    await addDoc(col, { uid: cred.user.uid, email, createdAt: new Date().toISOString() });

    alert('Usuario creado correctamente');
    // limpiar campos
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';
  }catch(err){
    console.error(err);
    alert('Error creando usuario: ' + (err.message || err));
  }
}

window.toggleCrear = function(){
  const box = document.getElementById('createUserBox');
  if(!box) return;
  box.style.display = (box.style.display === 'none' || box.style.display === '') ? 'block' : 'none';
}

