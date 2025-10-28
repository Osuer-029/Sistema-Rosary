// ==============================
// Inicializar Flatpickr (global)
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  flatpickr("#fechaHistorial", {
    dateFormat: "Y-m-d",
    maxDate: "today",
    locale: "es",
    altInput: true,
    altFormat: "d/m/Y",
    allowInput: false
  });
});

// ==============================
// Firebase y carga de historial
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBuKs7Nr9oDi1BTkuLm2acYdJv3XWxCQN8",
  authDomain: "sistema-anthony-26b3a.firebaseapp.com",
  projectId: "sistema-anthony-26b3a",
  storageBucket: "sistema-anthony-26b3a.appspot.com",
  messagingSenderId: "529902521245",
  appId: "1:529902521245:web:e6326ce36eb31497fa3d74",
  measurementId: "G-QZS4JMEEC9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos
const listaFacturas = document.getElementById("lista-facturas");
const listaRecibos = document.getElementById("lista-recibos");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnVerTodo = document.getElementById("btnVerTodo");
const fechaInput = document.getElementById("fechaHistorial");

// ==============================
// Cargar facturas
// ==============================
async function cargarFacturas(fecha = null) {
  listaFacturas.innerHTML = "<p>Cargando facturas...</p>";
  let q = collection(db, "facturas");
  if (fecha) {
    q = query(collection(db, "facturas"), where("fecha", "==", fecha));
  }
  const snap = await getDocs(q);
  if (snap.empty) {
    listaFacturas.innerHTML = "<p>No hay facturas en esa fecha.</p>";
    return;
  }

  listaFacturas.innerHTML = "";
  snap.forEach((doc) => {
    const f = doc.data();

    // 🧠 Detectar campo de productos
    let productosTexto = "Sin productos";
    if (Array.isArray(f.productos)) {
      productosTexto = f.productos.map(p => `${p.nombre || p.producto || "Producto"} x${p.cantidad || 1}`).join(", ");
    } else if (f.producto) {
      productosTexto = f.producto;
    } else if (f.descripcion) {
      productosTexto = f.descripcion;
    }

    listaFacturas.innerHTML += `
      <div class="item">
        <strong>🧾 ${f.cliente || "Cliente general"}</strong> — ${f.fechaFactura || f.fecha || (f.timestamp?.toDate ? f.timestamp.toDate().toISOString().split("T")[0] : "Sin fecha")}
<br>
        <span class="productos">${productosTexto}</span>
        <p><strong>Total:</strong> $${f.total || f.monto || 0}</p>
      </div>
    `;
  });
}

// ==============================
// Cargar recibos
// ==============================
async function cargarRecibos(fecha = null) {
  listaRecibos.innerHTML = "<p>Cargando recibos...</p>";
  let q = collection(db, "recibos");
  if (fecha) {
    q = query(collection(db, "recibos"), where("fecha", "==", fecha));
  }
  const snap = await getDocs(q);
  if (snap.empty) {
    listaRecibos.innerHTML = "<p>No hay recibos en esa fecha.</p>";
    return;
  }

  listaRecibos.innerHTML = "";
  snap.forEach((doc) => {
    const r = doc.data();
    listaRecibos.innerHTML += `
      <div class="item">
        <strong>💵 ${r.cliente || "Cliente"}</strong> — ${r.fecha || "Sin fecha"}<br>
        <p>${r.descripcion || "Sin descripción"}</p>
        <p><strong>Monto:</strong> $${r.monto || 0} | <em>${r.metodo || "Efectivo"}</em></p>
      </div>
    `;
  });
}

// ==============================
// Botones de filtrado
// ==============================
btnFiltrar.addEventListener("click", () => {
  const fechaSeleccionada = fechaInput.value;
  if (!fechaSeleccionada) {
    alert("Selecciona una fecha");
    return;
  }
  cargarFacturas(fechaSeleccionada);
  cargarRecibos(fechaSeleccionada);
});

btnVerTodo.addEventListener("click", () => {
  cargarFacturas();
  cargarRecibos();
});

// ==============================
// Cargar al iniciar
// ==============================
cargarFacturas();
cargarRecibos();
