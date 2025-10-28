import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// 🔧 Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBuKs7Nr9oDi1BTkuLm2acYdJv3XWxCQN8",
  authDomain: "sistema-anthony-26b3a.firebaseapp.com",
  projectId: "sistema-anthony-26b3a",
  storageBucket: "sistema-anthony-26b3a.appspot.com",
  messagingSenderId: "529902521245",
  appId: "1:529902521245:web:e6326ce36eb31497fa3d74",
  measurementId: "G-QZS4JMEEC9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🎯 Elementos
const clienteInput = document.getElementById("recibo-cliente");
const montoInput = document.getElementById("recibo-monto");
const conceptoInput = document.getElementById("recibo-concepto");
const btnGuardar = document.getElementById("btn-guardar-recibo");
const btnLimpiar = document.getElementById("btn-limpiar-cliente");
const listaCuentas = document.getElementById("lista-cuentas");

// 🧾 Guardar recibo
btnGuardar.addEventListener("click", async () => {
  const cliente = clienteInput.value.trim() || "General";
  const monto = parseFloat(montoInput.value);
  const concepto = conceptoInput.value.trim() || "Sin descripción";
  const metodo = document.querySelector('input[name="pago"]:checked').value;

  if (!monto || monto <= 0) {
    alert("Ingrese un monto válido.");
    return;
  }

  try {
    // Guardar recibo general
    await addDoc(collection(db, "recibos"), {
      cliente,
      monto,
      descripcion: concepto,
      metodo,
      fecha: new Date().toISOString().split("T")[0],
      timestamp: serverTimestamp()
    });

    // Si es crédito, guardar también en cuentas por cobrar
    if (metodo === "Crédito") {
      await addDoc(collection(db, "cuentasPorCobrar"), {
        cliente,
        monto,
        descripcion: concepto,
        fecha: new Date().toISOString().split("T")[0],
        estado: "Pendiente",
        timestamp: serverTimestamp()
      });
    }

    alert("Recibo guardado correctamente.");
    clienteInput.value = "";
    montoInput.value = "";
    conceptoInput.value = "";
    mostrarCuentas();

  } catch (error) {
    console.error("Error guardando el recibo:", error);
    alert("Error al guardar el recibo.");
  }
});

// ❌ Limpiar cliente
btnLimpiar.addEventListener("click", () => {
  clienteInput.value = "";
});

// 📋 Mostrar cuentas por cobrar
async function mostrarCuentas() {
  listaCuentas.innerHTML = "<p>Cargando...</p>";
  const querySnapshot = await getDocs(collection(db, "cuentasPorCobrar"));
  listaCuentas.innerHTML = "";

  querySnapshot.forEach((docu) => {
    const data = docu.data();
    const div = document.createElement("div");
    div.className = "cuenta-item";
    div.innerHTML = `
      <p><strong>${data.cliente}</strong> — ${data.descripcion}</p>
      <p>💰 ${data.monto.toFixed(2)} | 📅 ${data.fecha}</p>
      <div class="acciones">
        <button class="btn-pagar">Pagar</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    // 🟩 Pagar
    div.querySelector(".btn-pagar").addEventListener("click", async () => {
      await addDoc(collection(db, "facturas"), {
        cliente: data.cliente,
        total: data.monto,
        descripcion: data.descripcion,
        fecha: new Date().toISOString().split("T")[0],
        timestamp: serverTimestamp(),
        estado: "Pagado"
      });
      await deleteDoc(doc(db, "cuentasPorCobrar", docu.id));
      alert("Factura pagada y movida al historial.");
      mostrarCuentas();
    });

    // 🟥 Eliminar
    div.querySelector(".btn-eliminar").addEventListener("click", async () => {
      if (confirm("¿Eliminar esta cuenta por cobrar?")) {
        await deleteDoc(doc(db, "cuentasPorCobrar", docu.id));
        mostrarCuentas();
      }
    });

    listaCuentas.appendChild(div);
  });
}

// 📌 Mostrar al cargar
mostrarCuentas();
