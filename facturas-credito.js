// Guarda como: mis-facturas-credito.js
// Este archivo usa Firebase modular v9 (imports ajustados)
// Asegúrate de usarlo con <script type="module"> en tu HTML

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-storage.js";

// -------------------- CONFIG (usa la tuya) --------------------
const firebaseConfig = {
  apiKey: "AIzaSyBuKs7Nr9oDi1BTkuLm2acYdJv3XWxCQN8",
  authDomain: "sistema-anthony-26b3a.firebaseapp.com",
  projectId: "sistema-anthony-26b3a",
  storageBucket: "sistema-anthony-26b3a.firebasestorage.app",
  messagingSenderId: "529902521245",
  appId: "1:529902521245:web:e6326ce36eb31497fa3d74",
  measurementId: "G-QZS4JMEEC9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// -------------------- SELECTORES --------------------
const btnAbrirForm = document.getElementById('btnAbrirForm');
const modalForm = document.getElementById('modalForm');
const cerrarModal = document.getElementById('cerrarModal');
const formFactura = document.getElementById('formFactura');
const archivoInput = document.getElementById('archivo');
const preview = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const btnCancelar = document.getElementById('btnCancelar');

const listaPendientes = document.getElementById('listaPendientes');
const listaPagadas = document.getElementById('listaPagadas');
const totalPendienteEl = document.getElementById('totalPendiente');
const countPendientesEl = document.getElementById('countPendientes');
const countPagadasEl = document.getElementById('countPagadas');

const tabs = document.querySelectorAll('.tab');

// -------------------- UTILS --------------------
function showToast(msg, t = 3000){
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(()=> toast.classList.add('hidden'), t);
}

function formatCurrency(n){
  const num = Number(n || 0);
  return 'RD$ ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resetForm(){
  formFactura.reset();
  preview.classList.add('hidden');
  progressWrap.classList.add('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
}

// -------------------- UI: abrir / cerrar modal y preview --------------------
btnAbrirForm.addEventListener('click', ()=> modalForm.classList.remove('hidden'));
cerrarModal.addEventListener('click', ()=> { resetForm(); modalForm.classList.add('hidden'); });
btnCancelar.addEventListener('click', ()=> { resetForm(); modalForm.classList.add('hidden'); });

archivoInput.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  previewImg.src = URL.createObjectURL(f);
  preview.classList.remove('hidden');
});

// Tabs
tabs.forEach(t => {
  t.addEventListener('click', ()=> {
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.getAttribute('data-tab');
    document.getElementById('listaPendientes').classList.toggle('hidden', tab !== 'pendientes');
    document.getElementById('listaPagadas').classList.toggle('hidden', tab !== 'pagadas');
  });
});

// -------------------- SUBIR Y GUARDAR FACTURA --------------------
formFactura.addEventListener('submit', async (ev) => {
  ev.preventDefault();

  const proveedor = document.getElementById('proveedor').value.trim();
  const monto = parseFloat(document.getElementById('monto').value) || 0;
  const nota = document.getElementById('nota').value.trim();
  const file = archivoInput.files[0];

  if(!proveedor) return showToast('Ingresa el nombre del proveedor');
  if(!monto || monto <= 0) return showToast('Ingresa un monto válido');
  if(!file) return showToast('Selecciona la imagen de la factura');

  try {
    // Preparar referencia storage
    const ts = Date.now();
    const safeName = file.name.replace(/\s+/g,'_');
    const path = `facturasCredito/${ts}_${safeName}`;
    const sRef = storageRef(storage, path);

    // Mostrar progreso
    progressWrap.classList.remove('hidden');

    const uploadTask = uploadBytesResumable(sRef, file);

    // Observador de progreso
    uploadTask.on('state_changed', (snapshot) => {
      const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
    }, (err) => {
      console.error('Error subida:', err);
      showToast('Error subiendo imagen. Revisa consola.');
      progressWrap.classList.add('hidden');
    }, async () => {
      // subida completada
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      // Guardar documento en Firestore
      const docRef = await addDoc(collection(db, 'facturasCredito'), {
        proveedor,
        monto,
        nota,
        imageURL: downloadURL,
        storagePath: path,
        status: 'pendiente',   // <- estado inicial
        createdAt: serverTimestamp()
      });

      console.log('Factura guardada id:', docRef.id);
      showToast('Factura guardada correctamente');
      resetForm();
      modalForm.classList.add('hidden');
    });

  } catch (e) {
    console.error('Error guardando factura:', e);
    showToast('Error al guardar. Revisa la consola.');
  }
});

// -------------------- ESCUCHADORES EN TIEMPO REAL --------------------
// Pendientes
const qPend = query(collection(db, 'facturasCredito'), where('status', '==', 'pendiente'), orderBy('createdAt', 'desc'));
onSnapshot(qPend, (snap) => {
  listaPendientes.innerHTML = '';
  let total = 0; let count = 0;
  if(snap.empty){
    listaPendientes.innerHTML = `<div class="small">No hay facturas pendientes.</div>`;
  } else {
    snap.forEach(docSnap => {
      const id = docSnap.id;
      const d = docSnap.data();
      count++;
      total += Number(d.monto || 0);
      const card = crearCard(id, d, false);
      listaPendientes.appendChild(card);
    });
  }
  totalPendienteEl.textContent = formatCurrency(total);
  countPendientesEl.textContent = count;
}, (err) => {
  console.error('Error escuchando pendientes:', err);
  showToast('Error sincronizando pendientes.');
});

// Pagadas (historial)
const qPag = query(collection(db, 'facturasCredito'), where('status', '==', 'pagada'), orderBy('createdAt', 'desc'));
onSnapshot(qPag, (snap) => {
  listaPagadas.innerHTML = '';
  let count = 0;
  if(snap.empty){
    listaPagadas.innerHTML = `<div class="small">No hay facturas pagadas.</div>`;
  } else {
    snap.forEach(docSnap => {
      const id = docSnap.id;
      const d = docSnap.data();
      count++;
      const card = crearCard(id, d, true);
      listaPagadas.appendChild(card);
    });
  }
  countPagadasEl.textContent = count;
}, (err) => {
  console.error('Error escuchando pagadas:', err);
  showToast('Error sincronizando historial.');
});

// -------------------- CREAR CARD --------------------
function crearCard(id, data, esPagada){
  const wrapper = document.createElement('article');
  wrapper.className = 'card';

  const img = document.createElement('img');
  img.className = 'thumb';
  img.src = data.imageURL || '';
  img.alt = 'Factura';
  wrapper.appendChild(img);

  const info = document.createElement('div');
  info.className = 'info';

  const title = document.createElement('h3');
  title.textContent = data.proveedor || 'Proveedor';
  info.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<strong>${formatCurrency(data.monto)}</strong> • <span class="small">${data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleString() : ''}</span>`;
  info.appendChild(meta);

  if(data.nota){
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = data.nota;
    info.appendChild(note);
  }

  const actions = document.createElement('div');
  actions.className = 'actions';

  // Ver (abrir imagen)
  const btnVer = document.createElement('button');
  btnVer.className = 'btn';
  btnVer.textContent = 'Ver';
  btnVer.addEventListener('click', ()=> window.open(data.imageURL, '_blank'));
  actions.appendChild(btnVer);

  // Descargar
  const aDesc = document.createElement('a');
  aDesc.className = 'btn';
  aDesc.textContent = 'Descargar';
  aDesc.href = data.imageURL;
  aDesc.target = '_blank';
  aDesc.rel = 'noopener noreferrer';
  actions.appendChild(aDesc);

  if(!esPagada){
    // Marcar como pagada
    const btnPagar = document.createElement('button');
    btnPagar.className = 'btn primary';
    btnPagar.textContent = 'Marcar pagada';
    btnPagar.addEventListener('click', async ()=>{
      if(!confirm('¿Marcar esta factura como pagada?')) return;
      try {
        await updateDoc(doc(db, 'facturasCredito', id), { status: 'pagada', paidAt: serverTimestamp() });
        showToast('Factura marcada como pagada');
      } catch(e){
        console.error('Error marcando pagada:', e);
        showToast('Error al marcar como pagada');
      }
    });
    actions.appendChild(btnPagar);
  } else {
    // Mostrar "Pagada" con fecha (si existe)
    const span = document.createElement('div');
    span.className = 'small';
    span.textContent = 'Estado: Pagada';
    actions.appendChild(span);
  }

  // Eliminar (aplica en ambos)
  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn';
  btnEliminar.style.background = '#fff';
  btnEliminar.style.border = '1px solid rgba(0,0,0,0.06)';
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.addEventListener('click', async ()=>{
    if(!confirm('¿Eliminar esta factura? Se borrará la imagen y el registro.')) return;
    try {
      // borrar storage si existe storagePath
      if(data.storagePath){
        const sref = storageRef(storage, data.storagePath);
        await deleteObject(sref).catch(err => {
          console.warn('No se pudo borrar archivo en Storage (posible que no exista):', err);
        });
      }
      await deleteDoc(doc(db, 'facturasCredito', id));
      showToast('Factura eliminada');
    } catch(e){
      console.error('Error eliminando factura:', e);
      showToast('Error al eliminar');
    }
  });
  actions.appendChild(btnEliminar);

  info.appendChild(actions);
  wrapper.appendChild(info);

  return wrapper;
}
