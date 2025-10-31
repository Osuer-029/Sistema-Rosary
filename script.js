// ================================
// script.js - Heladería Rosary (con Firebase Firestore)
// ================================

// **********************************
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DE FIREBASE
// **********************************
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBuKs7Nr9oDi1BTkuLm2acYdJv3XWxCQN8",
  authDomain: "sistema-anthony-26b3a.firebaseapp.com",
  projectId: "sistema-anthony-26b3a",
  storageBucket: "sistema-anthony-26b3a.firebasestorage.app",
  messagingSenderId: "529902521245",
  appId: "1:529902521245:web:e6326ce36eb31497fa3d74",
  measurementId: "G-QZS4JMEEC9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ================================
// CRUD Productos (colección "inventario")
// ================================
async function addProducto(producto) {
    try {
        const docRef = await addDoc(collection(db, "inventario"), producto);
        console.log("Producto guardado con ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error al añadir producto: ", e);
        throw e;
    }
}

async function updateProducto(id, producto) {
    try {
        const productoRef = doc(db, "inventario", id);
        await updateDoc(productoRef, producto);
        return true;
    } catch (e) {
        console.error("Error al actualizar producto: ", e);
        throw e;
    }
}

async function deleteProducto(id) {
    try {
        await deleteDoc(doc(db, "inventario", id));
        return true;
    } catch (e) {
        console.error("Error al eliminar producto: ", e);
        throw e;
    }
}

async function getAllProductos() {
    try {
        const productosCol = collection(db, "inventario");
        const snapshot = await getDocs(productosCol);
        const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return productos;
    } catch (e) {
        console.error("Error al obtener productos: ", e);
        return [];
    }
}

// ================================
// CRUD Facturas
// ================================
async function addFactura(factura) {
    try {
        const docRef = await addDoc(collection(db, "facturas"), factura);
        const movimiento = {
            type: "ingreso",
            concept: `Factura #${docRef.id} - ${factura?.cliente || "Venta general"}`,
            monto: parseFloat(factura.total || 0),
            date: new Date().toISOString().slice(0, 10),
            timestamp: new Date()
        };
        await addDoc(collection(db, "transacciones_financieras"), movimiento);
        console.log("✅ Factura y movimiento financiero registrados:", movimiento);
        return docRef.id;
    } catch (e) {
        console.error("Error al añadir factura: ", e);
        throw e;
    }
}

async function getAllFacturas() {
    try {
        const q = query(collection(db, "facturas"), orderBy("fechaFactura", "desc"));
        const snapshot = await getDocs(q);
        const facturas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return facturas;
    } catch (e) {
        console.error("Error al obtener facturas: ", e);
        return [];
    }
}



// ================================
// Referencias DOM
// ================================
const listaProductos = document.getElementById("lista-productos");
const buscador = document.getElementById("buscador");
const contenedorSeleccionados = document.getElementById("productos-seleccionados");
let productos = [];
let productosSeleccionados = [];


// ================================
// Utilidades
// ================================
function mostrarMensajeVisual(texto, tipo = "success") {
    const msj = document.createElement("div");
    msj.className = `mensaje-flotante ${tipo}`;
    msj.textContent = texto;
    document.body.appendChild(msj);
    setTimeout(()=> msj.classList.add("visible"), 50);
    setTimeout(()=> {
        msj.classList.remove("visible");
        setTimeout(()=> msj.remove(), 400);
    }, 2200);
}

// ================================
// Cargar productos en tiempo real desde "inventario"
// ================================
function cargarProductosRealtime() {
    const productosCol = collection(db, "inventario");

    onSnapshot(productosCol, (snapshot) => {
        productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        mostrarProductos(productos);
        console.log("Productos cargados:", productos); // debug
    }, (error) => {
        console.error("Error escuchando productos:", error);
    });
}

// ================================
// Mostrar productos en pantalla
// ================================
// ================================
// Mostrar productos disponibles (compactos y adaptados)
// ================================
function mostrarProductos(lista) {
  listaProductos.innerHTML = "";
  lista.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <img src="${p.imagen || 'https://via.placeholder.com/100'}" alt="${p.nombre}">
      <h4>${p.nombre || 'Sin nombre'}</h4>
      <p>RD$ ${Number(p.precio || 0).toFixed(2)}</p>
    `;
    listaProductos.appendChild(card);

    card.addEventListener("click", () => {
      productosSeleccionados.push(p);
      mostrarProductosSeleccionados(productosSeleccionados);
      mostrarMensajeVisual(`✅ ${p.nombre} agregado`, "success");
    });
  });
}


const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

// Variables para controlar scroll del carrusel
const scrollAmount = 350;

btnNext.addEventListener("click", () => {
    listaProductos.scrollBy({ left: scrollAmount, behavior: 'smooth' });
});

btnPrev.addEventListener("click", () => {
    listaProductos.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
});

// ================================
// Mostrar productos escaneados (estilo lista supermercado)
// ================================
// ================================
// Mostrar productos seleccionados con control de cantidad y total
// ================================
// ================================
// Mostrar productos seleccionados (solo lista + total)
// ================================
function mostrarProductosSeleccionados(lista) {
  contenedorSeleccionados.innerHTML = "";
  let total = 0;

  // Agrupar productos por id para contar cantidad
  const productosAgrupados = {};
  lista.forEach(p => {
    if (productosAgrupados[p.id]) {
      productosAgrupados[p.id].cantidad += 1;
    } else {
      productosAgrupados[p.id] = { ...p, cantidad: 1 };
    }
  });

  // Renderizar cada producto
  Object.values(productosAgrupados).forEach(p => {
    const div = document.createElement("div");
    div.className = "producto-cuadro";
    div.innerHTML = `
      <div class="producto-info">
        <img src="${p.imagen || 'https://via.placeholder.com/60'}" alt="${p.nombre}" class="producto-mini">
        <div class="producto-detalles">
          <span class="nombre">${p.nombre}</span>
          <span class="detalle">RD$ ${p.precio.toFixed(2)}</span>
        </div>
      </div>
      <div class="cantidad-control">
        <button class="btn-menos">➖</button>
        <span class="cantidad">${p.cantidad}</span>
        <button class="btn-mas">➕</button>
        <button class="btn-quitar">❌</button>
      </div>
    `;
    contenedorSeleccionados.appendChild(div);

    total += p.precio * p.cantidad;

    // Botones de control
    const btnMas = div.querySelector(".btn-mas");
    const btnMenos = div.querySelector(".btn-menos");
    const btnQuitar = div.querySelector(".btn-quitar");

    btnMas.addEventListener("click", () => {
      productosSeleccionados.push(p);
      mostrarProductosSeleccionados(productosSeleccionados);
    });

    btnMenos.addEventListener("click", () => {
      const index = productosSeleccionados.findIndex(prod => prod.id === p.id);
      if (index !== -1) productosSeleccionados.splice(index, 1);
      mostrarProductosSeleccionados(productosSeleccionados);
    });

    btnQuitar.addEventListener("click", () => {
      productosSeleccionados = productosSeleccionados.filter(prod => prod.id !== p.id);
      mostrarProductosSeleccionados(productosSeleccionados);
    });
  });

  // 🔹 Actualiza el total en la interfaz (HTML)
  const totalElem = document.getElementById("totalFactura");
  totalElem.textContent = `RD$ ${total.toFixed(2)}`;

  // ⚡ Dispara un evento personalizado para recalcular la devuelta
  const event = new Event("totalActualizado");
  document.dispatchEvent(event);
}


// 🔹 Obtener dinero recibido y devuelta
const pagoInput = document.getElementById("pagoCliente");
const devueltaInput = document.getElementById("devueltaCliente");

const dineroRecibido = parseFloat(pagoInput?.value) || 0;
const devuelta = parseFloat(devueltaInput?.value.replace(/[^0-9.-]/g, "")) || 0;



// ... (código anterior)

async function imprimirTicket(listaProductos, cliente = { nombre: "General" }) {
  if (!listaProductos || listaProductos.length === 0) {
    alert("No hay productos en la lista para imprimir.");
    return;
  }

  // Convertir logo a Base64
  async function getBase64Image(url) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
      return "";
    }
  }
  const logoBase64 = await getBase64Image("logo rosary.jpg");

  // 🔹 Agrupar productos y contar cantidad
  const productosAgrupados = {};
  listaProductos.forEach(p => {
    if (productosAgrupados[p.id]) {
      productosAgrupados[p.id].cantidad += 1;
    } else {
      productosAgrupados[p.id] = { ...p, cantidad: 1 };
    }
  });

  const productosFinal = Object.values(productosAgrupados);

  // 🔹 Calcular total
  let total = 0;
  productosFinal.forEach(p => {
    total += (p.precio || 0) * p.cantidad;
  });

  // 🔹 Dinero recibido y devuelta
  const pagoInput = document.getElementById("pagoCliente");
  const devueltaInput = document.getElementById("devueltaCliente");
  const dineroRecibido = parseFloat(pagoInput?.value) || 0;
  const devuelta = parseFloat(devueltaInput?.value.replace(/[^0-9.-]/g, "")) || 0;

  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString("es-DO");
  const horaStr = fecha.toLocaleTimeString("es-DO");

  const ticketHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Ticket - Heladería Rosary</title>
<style>
@page { size: 80mm auto; margin: 0; }
html, body { margin: 0; padding: 0; width: 80mm; background: #fff; }
body { font-family: 'Courier New', monospace; font-size: 10pt; display: flex; justify-content: center; align-items: flex-start; }
.ticket { width: 72mm; text-align: center; line-height: 1.3; margin: 0 auto; padding: 0; }
img.logo { width: 110px; height: auto; display: block; margin: 0 auto 4px auto; }
.linea { border-top: 1px dashed #000; margin: 3px 0; }
table { width: 92%; border-collapse: collapse; table-layout: fixed; margin: 0 auto; }
td { padding: 1px 0; word-wrap: break-word; }
.producto { width: 48%; text-align: left; }
.cantidad { width: 20%; text-align: center; }
.total { width: 25%; text-align: right; }
.footer { margin-top: 6px; font-size: 9pt; }
</style>
</head>
<body>
<div class="ticket">
  ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Rosary" class="logo">` : ""}
  <strong>HELADERÍA ROSARY</strong><br>
  Villa González - Santiago<br>
  Tel: +1 (809) 790-4593<br>
  <div class="linea"></div>
  <small>Fecha: ${fechaStr} - Hora: ${horaStr}</small><br>
  <div class="linea"></div>

  <table>
    <thead>
      <tr>
        <td class="producto"><b>Producto</b></td>
        <td class="cantidad"><b>Cant</b></td>
        <td class="total"><b>Total</b></td>
      </tr>
    </thead>
    <tbody>
      ${productosFinal.map(p => `
        <tr>
          <td class="producto">${p.nombre.length > 16 ? p.nombre.slice(0,16) + "…" : p.nombre}</td>
          <td class="cantidad">${p.cantidad}</td>
          <td class="total">RD$ ${(p.precio * p.cantidad).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="linea"></div>
  <strong>TOTAL: RD$ ${total.toFixed(2)}</strong><br>
  <strong>Dinero recibido: RD$ ${dineroRecibido.toFixed(2)}</strong><br>
  <strong>Devuelta: RD$ ${devuelta.toFixed(2)}</strong>
  <div class="linea"></div>

  <div class="footer">
    ¡Gracias por preferirnos!<br>
    ¡Vuelva pronto!
  </div>
</div>

<script>
window.onload = function() {
  document.body.style.marginTop = "0px";
  window.print();
  setTimeout(() => window.close(), 600);
};
</script>
</body>
</html>
`;

  const printWin = window.open("", "", "width=400,height=800");
  printWin.document.open();
  printWin.document.write(ticketHTML);
  printWin.document.close();
}










// ================================
// Escáner de código de barras optimizado (para pistola lectora)
// ================================

// Campo invisible para capturar el escaneo
const inputScanner = document.createElement("input");
inputScanner.type = "text";
inputScanner.id = "inputScanner";
inputScanner.style.position = "absolute";
inputScanner.style.opacity = "0";
inputScanner.style.height = "0";
inputScanner.style.width = "0";
document.body.appendChild(inputScanner);

// Variable para almacenar temporalmente los caracteres del escaneo
let bufferCodigo = "";

// Escuchar todo lo que el escáner teclee
document.addEventListener("keydown", (e) => {
  // Si es una tecla alfanumérica o número, la agregamos al buffer
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
    bufferCodigo += e.key;
  }

  // Si el lector envía Enter, procesamos el código
  if (e.key === "Enter") {
    const codigoEscaneado = bufferCodigo.trim();
    bufferCodigo = ""; // limpiar buffer

    if (!codigoEscaneado) return;

    const productoEncontrado = productos.find(
      (p) => (p.codigo || "").toString().trim() === codigoEscaneado
    );

    if (productoEncontrado) {
      productosSeleccionados.push(productoEncontrado);
      mostrarProductosSeleccionados(productosSeleccionados);
      mostrarMensajeVisual(`✅ ${productoEncontrado.nombre} agregado`, "success");
    } else {
      mostrarMensajeVisual("❌ Producto no encontrado", "error");
    }
  }
});


// ================================
// Escáner de código de barras
// ================================
document.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        const codigoEscaneado = (e.target.value || "").toString().trim();
        if (!codigoEscaneado) return;

        const productoEncontrado = productos.find(p => (p.codigo || "").toString().trim() === codigoEscaneado);

        if (productoEncontrado) {
            if (!productosSeleccionados.some(p => p.id === productoEncontrado.id)) {
                productosSeleccionados.push(productoEncontrado);
                mostrarProductosSeleccionados(productosSeleccionados);
            }
        } else {
            alert("Producto no encontrado"); // temporal para debug
        }

        if (e.target.value !== undefined) e.target.value = '';
    }
});


// ================================
// Botón Imprimir Factura
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const btnImprimir = document.getElementById("btn-imprimir-factura");
  const inputCliente = document.getElementById("inputCliente");

  btnImprimir.addEventListener("click", async () => {
    const cliente = {
      nombre: inputCliente?.value || "General"
    };

    // Imprimir ticket
    await imprimirTicket(productosSeleccionados, cliente);

    // 🔹 Limpiar productos seleccionados después de imprimir
    productosSeleccionados = [];
    mostrarProductosSeleccionados(productosSeleccionados); // Actualiza la interfaz
    document.getElementById("pagoCliente").value = ""; // Limpiar pago
    document.getElementById("devueltaCliente").value = "RD$ 0.00"; // Reset devuelta
  });
});



// ================================
// Inicialización
// ================================
document.addEventListener('DOMContentLoaded', cargarProductosRealtime);

// 🔁 Recalcular devuelta cuando cambie el total visual
document.addEventListener("totalActualizado", () => {
  const pagoClienteInput = document.getElementById("pagoCliente");
  if (pagoClienteInput) {
    pagoClienteInput.dispatchEvent(new Event("input"));
  }
});

