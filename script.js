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

    Object.values(productosAgrupados).forEach(p => {
        const div = document.createElement("div");
        div.className = "producto-cuadro";
        div.innerHTML = `
            <div class="producto-info">
                <img src="${p.imagen}" alt="${p.nombre}" class="producto-mini">
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

        // Botones de control de cantidad
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

    // Mostrar total y botón imprimir
    const totalDiv = document.createElement("div");
    totalDiv.className = "total-pago";
    totalDiv.innerHTML = `
        <strong>Total: RD$ ${total.toFixed(2)}</strong>
        <button id="btnImprimirTicket" class="btn-imprimir">🧾 Imprimir Ticket</button>
    `;
    contenedorSeleccionados.appendChild(totalDiv);

    document.getElementById("btnImprimirTicket").addEventListener("click", async () => {
    const listaParaFactura = Object.values(productosAgrupados);

    // Calcular total
    let total = listaParaFactura.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

    // Crear objeto factura
    const factura = {
        cliente: "Cliente general", // o el nombre que ingreses en inputCliente
        productos: listaParaFactura.map(p => ({
            nombre: p.nombre,
            precio: p.precio,
            cantidad: p.cantidad
        })),
        total: total,
        fechaFactura: new Date().toISOString().slice(0, 10)
    };

    // Guardar en Firestore
    await addFactura(factura);

    // Imprimir ticket
    imprimirTicket(listaParaFactura);

    // Limpiar productos seleccionados
    productosSeleccionados = [];
    mostrarProductosSeleccionados(productosSeleccionados);
    mostrarMensajeVisual("✅ Factura registrada y productos limpiados", "success");
});

}


// ... (código anterior)

function imprimirTicket(listaProductos, cliente = {nombre: "General", telefono: "No disponible"}) {
    const { jsPDF } = window.jspdf;

    // Tamaño de ticket 80 mm x 300 mm máximo
    const anchoTicket = 80 * 2.83465; // 80mm en puntos
    const altoMaximo = 300 * 2.83465; // 300mm máximo
    const doc = new jsPDF({ unit: "pt", format: [anchoTicket, altoMaximo] });

    let y = 20;
    let total = 0;

    // === CARGAR LOGO LOCAL (mismo nivel que script.js) ===
    const img = new Image();
    img.src = "logo rosary.jpg"; // ✅ tu logo directamente en la raíz del proyecto

    img.onload = function() {
        // Ajustar ancho y alto proporcional del logo
        const logoAncho = anchoTicket * 0.8;
        const logoX = (anchoTicket - logoAncho) / 2;
        const logoAlto = (img.height / img.width) * logoAncho;

        // Insertar logo
        doc.addImage(img, "JPEG", logoX, y, logoAncho, logoAlto);
        y += logoAlto + 10;

        // === ENCABEZADO ===
        doc.setFont("Courier", "bold");
        doc.setFontSize(12);
        doc.text("HELADERÍA ROSARY", anchoTicket / 2, y, { align: "center" }); y += 18;

        doc.setFont("Courier", "normal");
        doc.setFontSize(9);
        doc.text("Villa González - Santiago", anchoTicket / 2, y, { align: "center" }); y += 12;
        doc.text("Tel: +1 (809) 790-4593", anchoTicket / 2, y, { align: "center" }); y += 12;
        doc.text("----------------------------------------", anchoTicket / 2, y, { align: "center" }); y += 12;

        const fecha = new Date();
        const fechaStr = fecha.toLocaleDateString('es-ES');
        const horaStr = fecha.toLocaleTimeString('es-ES');
        doc.text(`Fecha: ${fechaStr}  Hora: ${horaStr}`, anchoTicket / 2, y, { align: "center" }); y += 12;
        doc.text("----------------------------------------", anchoTicket / 2, y, { align: "center" }); y += 12;

        // === PRODUCTOS ===
        doc.setFont("Courier", "bold");
        doc.text("Producto", 10, y);
        doc.text("Cant", 100, y, { align: "center" });
        doc.text("P.Unit", 150, y, { align: "center" });
        doc.text("Total", anchoTicket - 10, y, { align: "right" });
        y += 12;

        doc.setFont("Courier", "normal");
        doc.text("----------------------------------------", anchoTicket / 2, y, { align: "center" }); y += 12;

        listaProductos.forEach(p => {
            const nombre = p.nombre.length > 16 ? p.nombre.slice(0, 16) + "..." : p.nombre;
            const cantidad = p.cantidad || 1;
            const precio = Number(p.precio).toFixed(2);
            const subtotal = (cantidad * p.precio).toFixed(2);

            doc.text(nombre, 10, y);
            doc.text(String(cantidad), 100, y, { align: "center" });
            doc.text(precio, 150, y, { align: "center" });
            doc.text(subtotal, anchoTicket - 10, y, { align: "right" });
            y += 12;
            total += cantidad * p.precio;
        });

        doc.text("----------------------------------------", anchoTicket / 2, y, { align: "center" }); y += 14;
        doc.setFont("Courier", "bold");
        doc.text(`TOTAL: RD$ ${total.toFixed(2)}`, anchoTicket / 2, y, { align: "center" }); y += 20;

        // === PIE DE PÁGINA ===
        doc.setFont("Courier", "normal");
        doc.setFontSize(9);
        doc.text("¡Gracias por preferirnos!", anchoTicket / 2, y, { align: "center" }); y += 12;
        doc.text("Vuelva pronto!", anchoTicket / 2, y, { align: "center" }); y += 12;
        doc.text("----------------------------------------", anchoTicket / 2, y, { align: "center" }); y += 10;

        // === AJUSTE DINÁMICO DE ALTURA ===
        const altoReal = Math.min(y + 20, altoMaximo);
        doc.internal.pageSize.height = altoReal;

        // === IMPRIMIR DIRECTAMENTE SIN NUEVA PÁGINA ===
        doc.autoPrint();

        const pdfData = doc.output('datauristring');
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.src = pdfData;
        document.body.appendChild(iframe);

        iframe.onload = function() {
            iframe.contentWindow.focus();
            iframe.contentWindow.print({ scale: 0.8 });
        };
    };
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
// Inicialización
// ================================
document.addEventListener('DOMContentLoaded', cargarProductosRealtime);
