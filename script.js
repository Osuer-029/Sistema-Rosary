// ================================
// script.js - Heladería Rosary (con Firebase Firestore)
// ================================

// **********************************
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DE FIREBASE
// **********************************
// CÓDIGO CORREGIDO: Usando las rutas completas del CDN de Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// ... (resto del código)

// Tu configuración de la aplicación web (de la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDi-yeyvgHQg0n2xAEeH_D-n4sx0OD3SSc",
  authDomain: "sistema-anthony-7cea5.firebaseapp.com",
  projectId: "sistema-anthony-7cea5",
  storageBucket: "sistema-anthony-7cea5.firebasestorage.app",
  messagingSenderId: "940908012115",
  appId: "1:940908012115:web:204117d50beef619475ca6",
  measurementId: "G-RZDC3CMSZQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Opcional: para análisis
const db = getFirestore(app); // 👈 **CLAVE: Inicializar Cloud Firestore**


// ================================
// CRUD Productos (usando Firestore)
// ================================
async function addProducto(producto) {
  try {
    const docRef = await addDoc(collection(db, "productos"), producto);
    console.log("Producto guardado con ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error al añadir producto: ", e);
    throw e;
  }
}

async function updateProducto(id, producto) {
  try {
    const productoRef = doc(db, "productos", id);
    await updateDoc(productoRef, producto);
    return true;
  } catch (e) {
    console.error("Error al actualizar producto: ", e);
    throw e;
  }
}

async function deleteProducto(id) {
  try {
    await deleteDoc(doc(db, "productos", id));
    return true;
  } catch (e) {
    console.error("Error al eliminar producto: ", e);
    throw e;
  }
}

async function getAllProductos() {
  try {
    const productosCol = collection(db, "productos");
    const snapshot = await getDocs(productosCol);
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return productos;
  } catch (e) {
    console.error("Error al obtener productos: ", e);
    return [];
  }
}

// ================================
// CRUD Facturas (usando Firestore)
// ================================
async function addFactura(factura) {
  try {
    const docRef = await addDoc(collection(db, "facturas"), factura);
    return docRef.id;
  } catch (e) {
    console.error("Error al añadir factura: ", e);
    throw e;
  }
}

async function getAllFacturas() {
  try {
    // Usamos query para ordenar por fecha, asumiendo que el campo es 'fechaFactura'
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
// CRUD Recibos (usando Firestore)
// ================================
async function addRecibo(recibo) {
  try {
    const docRef = await addDoc(collection(db, "recibos"), recibo);
    return docRef.id;
  } catch (e) {
    console.error("Error al añadir recibo: ", e);
    throw e;
  }
}

async function getAllRecibos() {
  try {
    // Usamos query para ordenar por fecha, asumiendo que el campo es 'fecha'
    const q = query(collection(db, "recibos"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    const recibos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return recibos;
  } catch (e) {
    console.error("Error al obtener recibos: ", e);
    return [];
  }
}

// ================================
// Referencias DOM (Mismo código, sin cambios)
// ================================
const listaProductos = document.getElementById("lista-productos");
const btnAbrirAgregar = document.getElementById("btn-abrir-agregar");
const modalAgregar = document.getElementById("agregar-producto");
const btnCerrarAgregar = document.getElementById("btn-cerrar-agregar");
const btnCancelarAgregar = document.getElementById("btn-cancelar-agregar");
const btnAgregar = document.getElementById("btn-agregar");
const buscador = document.getElementById("buscador");

const modalFacturacion = document.getElementById("facturacion");
const btnCerrarFactura = document.getElementById("btn-cerrar-factura");
const btnCancelarFactura = document.getElementById("btn-cancelar-factura");
const btnFacturar = document.getElementById("btn-facturar");

const modalConfirmar = document.getElementById("modal-confirmar");
const btnConfirmarSi = document.getElementById("btn-confirmar-si");
const btnConfirmarNo = document.getElementById("btn-confirmar-no");

const modalRecibo = document.getElementById("recibo-caja");
const btnRecibo = document.getElementById("btn-recibo");
const btnCerrarRecibo = document.getElementById("btn-cerrar-recibo");
const btnGuardarRecibo = document.getElementById("btn-guardar-recibo");
const btnCancelarRecibo = document.getElementById("btn-cancelar-recibo");

const modalHistorial = document.getElementById("historial-facturas");
const btnHistorial = document.getElementById("btn-historial");
const btnCerrarHistorial = document.getElementById("btn-cerrar-historial");
const listaFacturasContainer = document.getElementById("lista-facturas");
const listaRecibosContainer = document.getElementById("lista-recibos");

// === Referencias correctas para los campos del modal de Facturación ===
const inputCliente = document.getElementById("inputCliente");
const metodoPagoSelect = document.getElementById("metodoPago");

// proteger si el select no existe por alguna razón
if (metodoPagoSelect) {
  metodoPagoSelect.addEventListener("change", (e) => {
    metodoSeleccionado = e.target.value;
  });
}

let metodoSeleccionado = "Efectivo"; // valor por defecto

// ================================
// Estado local (Mismo código, sin cambios)
// ================================
let productos = [];
let editId = null;
let productoAEliminar = null;
let productosSeleccionados = [];

// ================================
// Utiles (Mismo código, sin cambios)
// ================================
function toBase64(file) {
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = err=>reject(err);
  });
}

function mostrarMensajeVisual(texto, tipo = "success") {
  // pequeño snackbar visual (no bloqueante)
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
// Cargar / Mostrar Productos (Mismo código, sin cambios lógicos)
// ================================
async function cargarProductos() {
  // Ahora llama a la versión de Firestore
  productos = await getAllProductos(); 
  mostrarProductos(productos);
}

// ================================
// Mostrar productos en la lista principal (Mismo código, sin cambios)
// ================================
function mostrarProductos(lista) {
  listaProductos.innerHTML = "";

  lista.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("producto");
    div.innerHTML = `
      ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}">` : ""}
      <h3>${p.nombre || 'Sin nombre'}</h3>
      <p>${p.descripcion || ''}</p>
      <p>RD$ ${Number(p.precio).toFixed(2)}</p>
      <p>Stock: ${p.stock !== undefined ? p.stock : '-'}</p>
      <div class="botones-principal">
        <button class="btn-editar">✏️ Editar</button>
        <button class="btn-eliminar">🗑️ Eliminar</button>
      </div>
    `;
    listaProductos.appendChild(div);

    // Clic en producto -> agrega a factura
    div.addEventListener("click", () => {
      productosSeleccionados.push(Object.assign({}, p));
      modalFacturacion.style.display = "flex";
      mostrarFactura();
    });

    // Botón Editar
    div.querySelector(".btn-editar").addEventListener("click", e => {
      e.stopPropagation();
      editarProducto(p);
    });

    // Botón Eliminar
    div.querySelector(".btn-eliminar").addEventListener("click", e => {
      e.stopPropagation();
      productoAEliminar = p;
      modalConfirmar.style.display = "flex";
    });
  });
}

// ================================
// Función para abrir modal de edición (Mismo código, sin cambios)
// ================================
function editarProducto(producto) {
  editId = producto.id; // guardamos el id real para update
  document.getElementById("nombre").value = producto.nombre || "";
  document.getElementById("descripcion").value = producto.descripcion || "";
  document.getElementById("precio").value = producto.precio || "";
  document.getElementById("stock").value = producto.stock || "";
  document.getElementById("imagen").value = ""; // no cargamos imagen por seguridad
  modalAgregar.style.display = "flex";
}


// ================================
// Modal Agregar Producto (Mismo código, sin cambios)
// ================================
if (btnAbrirAgregar) btnAbrirAgregar.addEventListener("click", () => {
  editId = null;
  document.getElementById("nombre").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("imagen").value = "";
  modalAgregar.style.display = "flex";
});

if (btnCerrarAgregar) btnCerrarAgregar.addEventListener("click", () => modalAgregar.style.display = "none");
if (btnCancelarAgregar) btnCancelarAgregar.addEventListener("click", () => modalAgregar.style.display = "none");

if (btnAgregar) btnAgregar.addEventListener("click", async () => {
  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const stock = parseInt(document.getElementById("stock").value);
  const file = document.getElementById("imagen").files[0];

  if (isNaN(precio) || isNaN(stock)) {
    alert("Debe ingresar precio y stock válidos");
    return;
  }

  let imagenBase64 = "";
  if (file) imagenBase64 = await toBase64(file);

  const productoData = { nombre, descripcion, precio, stock, imagen: imagenBase64 };

  if (editId) {
    // Llama a la nueva función updateProducto de Firestore
    await updateProducto(editId, productoData);
  } else {
    // Llama a la nueva función addProducto de Firestore
    await addProducto(productoData);
  }

  modalAgregar.style.display = "none";
  await cargarProductos();
});

// ================================
// Eliminar Producto (confirmación) (Mismo código, sin cambios)
// ================================
if (btnConfirmarSi) btnConfirmarSi.addEventListener("click", async () => {
  if (productoAEliminar) {
    // Llama a la nueva función deleteProducto de Firestore
    await deleteProducto(productoAEliminar.id); 
    productoAEliminar = null;
    await cargarProductos();
  }
  modalConfirmar.style.display = "none";
});
if (btnConfirmarNo) btnConfirmarNo.addEventListener("click", () => {
  productoAEliminar = null;
  modalConfirmar.style.display = "none";
});

// ================================
// Facturación (selección automática y modal) (Mismo código, sin cambios)
// ================================
function seleccionarProducto(producto) {
  // Agregar copia para evitar referencias compartidas
  productosSeleccionados.push(Object.assign({}, producto));
  mostrarFactura();

  // Si es el primer producto, abrimos modal automáticamente
  if (productosSeleccionados.length === 1) {
    modalFacturacion.style.display = "flex";
  } else {
    // si ya está abierto, mostramos un mensaje corto
    mostrarMensajeVisual(`${producto.nombre || 'Producto'} agregado`, "success");
  }
}

// Mostrar factura con todos los productos seleccionados (Mismo código, sin cambios)
function mostrarFactura() {
  const panel = modalFacturacion.querySelector(".fact-panel");
  if (!panel) return;

  const oldList = panel.querySelector(".lista-seleccion");
  if (oldList) oldList.remove();

  const lista = document.createElement("div");
  lista.classList.add("lista-seleccion");

  let total = 0;

  productosSeleccionados.forEach((p, i) => {
    total += Number(p.precio);
    const item = document.createElement("div");
    item.classList.add("producto-cuadro");
    item.innerHTML = `
      ${p.imagen ? `<img src="${p.imagen}" class="producto-img" alt="Imagen producto">` : ""}
      <div class="producto-info">
        <p><strong>${p.nombre}</strong></p>
        <p>${p.descripcion || ""}</p>
        <p>RD$ ${Number(p.precio).toFixed(2)}</p>
      </div>
      <div class="fact-controls">
        <button data-index="${i}" class="btn-quitar">❌ Quitar</button>
      </div>
    `;
    lista.appendChild(item);
  });

  const totalDiv = document.createElement("div");
  totalDiv.classList.add("total");
  totalDiv.textContent = `Total: RD$ ${total.toFixed(2)}`;
  lista.appendChild(totalDiv);

  // Botón para agregar más productos
  const btnSeguir = document.createElement("button");
  btnSeguir.textContent = "➕ Agregar más productos";
  btnSeguir.classList.add("btn-mas");
  btnSeguir.addEventListener("click", () => {
    modalFacturacion.style.display = "none";
    mostrarProductosDisponibles(); // volver a lista de productos
    document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
  });
  lista.appendChild(btnSeguir);

  panel.appendChild(lista);

  // Listeners para quitar productos
  lista.querySelectorAll(".btn-quitar").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = Number(e.target.dataset.index);
      productosSeleccionados.splice(idx, 1);
      mostrarFactura();
    });
  });
}

// Mostrar todos los productos disponibles (Mismo código, sin cambios)
function mostrarProductosDisponibles() {
  const listaProductos = document.getElementById("lista-productos");
  listaProductos.innerHTML = ""; // Limpiamos lista actual

  productos.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("producto");
    div.innerHTML = `
      ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}">` : ""}
      <h3>${p.nombre}</h3>
      <p>${p.descripcion || ""}</p>
      <p>RD$ ${Number(p.precio).toFixed(2)}</p>
      <div class="botones-principal">
        <button class="btn-editar">✏️ Editar</button>
        <button class="btn-eliminar">🗑️ Eliminar</button>
      </div>
    `;
    listaProductos.appendChild(div);

    // Al hacer clic en el producto, se agrega automáticamente a la factura
    div.addEventListener("click", () => {
      productosSeleccionados.push(p);
      modalFacturacion.style.display = "flex";
      mostrarFactura();
    });

    // Botón Editar
    div.querySelector(".btn-editar").addEventListener("click", e => {
      e.stopPropagation(); // evita que agregue el producto al hacer clic aquí
      editarProducto(p); 
    });

    // Botón Eliminar
    div.querySelector(".btn-eliminar").addEventListener("click", e => {
      e.stopPropagation();
      productoAEliminar = p;
      modalConfirmar.style.display = "flex";
    });
  });
}


// Inicializamos productos disponibles al cargar página
// **Se cambia el orden para asegurar que Firestore esté inicializado**
document.addEventListener('DOMContentLoaded', cargarProductos);


// Cerrar modal facturación (botones) (Mismo código, sin cambios)
if (btnCerrarFactura) btnCerrarFactura.addEventListener("click", () => { modalFacturacion.style.display = "none"; });
if (btnCancelarFactura) btnCancelarFactura.addEventListener("click", () => { productosSeleccionados = []; mostrarFactura(); modalFacturacion.style.display = "none"; });

// ================================
// Generar Factura -> guarda + recibo + ticket pdf (Mismo código, sin cambios lógicos)
// ================================
if (btnFacturar) btnFacturar.addEventListener("click", async () => {
  if (productosSeleccionados.length === 0) {
    mostrarMensajeVisual("No hay productos seleccionados.", "error");
    return;
  }

  const cliente = (inputCliente && inputCliente.value.trim()) ? inputCliente.value.trim() : "Consumidor Final";
  const metodoPago = (metodoPagoSelect && metodoPagoSelect.value) ? metodoPagoSelect.value : metodoSeleccionado;
  const numeroFactura = "FAC-" + Date.now();
  // Almacenar fecha en un formato ISO para facilitar consultas en Firestore
  const fechaFactura = new Date().toISOString(); 
  const total = productosSeleccionados.reduce((acc, p) => acc + Number(p.precio), 0);

  const facturaObj = {
    numeroFactura,
    fechaFactura,
    productos: productosSeleccionados,
    total,
    cliente,
    metodoPago,
    // Formato de fecha local para impresión
    fechaFacturaLocal: new Date().toLocaleString("es-DO", { hour12: true }) 
  };

  // guardar factura (Usa la función de Firestore)
  try {
    await addFactura(facturaObj);
  } catch (err) {
    console.error("Error guardando factura:", err);
    mostrarMensajeVisual("Error guardando factura (revisa consola)", "error");
    return;
  }

  // crear recibo automático (Usa la función de Firestore)
  const reciboObj = {
    // Usar formato ISO para fecha para la BD, y local para impresión
    fecha: new Date().toISOString(), 
    cliente,
    monto: total,
    concepto: `Pago factura ${numeroFactura}`,
    origenFactura: numeroFactura,
    fechaLocal: new Date().toLocaleString("es-DO", { hour12: true })
  };
  try { await addRecibo(reciboObj); } catch (e) { console.warn("No se guardó recibo:", e); }

  mostrarMensajeVisual("✅ Factura generada con éxito", "success");

  // generar ticket (jsPDF)
  try {
    generarFacturaTicket(facturaObj);
  } catch (err) {
    console.error("Error generando PDF:", err);
    // fallback: imprimir HTML simple
    imprimirFacturaHTML(facturaObj);
  }

  // limpiar y mantener modal cerrado
  productosSeleccionados = [];
  mostrarFactura();
  modalFacturacion.style.display = "none";
  await cargarHistorial();
});

// ================================
// Recibo de Caja (modal manual) (Mismo código, sin cambios lógicos)
// ================================
if (btnRecibo) btnRecibo.addEventListener("click", () => {
  document.getElementById("recibo-cliente").value = "";
  document.getElementById("recibo-monto").value = "";
  document.getElementById("recibo-concepto").value = "";
  modalRecibo.style.display = "flex";
});
if (btnCerrarRecibo) btnCerrarRecibo.addEventListener("click", () => modalRecibo.style.display = "none");
if (btnCancelarRecibo) btnCancelarRecibo.addEventListener("click", () => modalRecibo.style.display = "none");

if (btnGuardarRecibo) btnGuardarRecibo.addEventListener("click", async () => {
  const cliente = document.getElementById("recibo-cliente").value.trim();
  const monto = parseFloat(document.getElementById("recibo-monto").value);
  const concepto = document.getElementById("recibo-concepto").value.trim();

  if (!cliente || isNaN(monto)) {
    alert("Debe completar el cliente y el monto.");
    return;
  }

  const recibo = {
    fecha: new Date().toISOString(),
    cliente,
    monto,
    concepto,
    fechaLocal: new Date().toLocaleString("es-DO")
  };

  // Llama a la nueva función addRecibo de Firestore
  await addRecibo(recibo); 
  modalRecibo.style.display = "none";
  mostrarMensajeVisual("✅ Recibo guardado correctamente", "success");
  await cargarHistorial();
});

// ================================
// Historial (facturas + recibos) — render estilizado (Mismo código, sin cambios lógicos)
// ================================
// ================================
// Cargar historial de facturas y recibos (optimizado)
// ================================
async function cargarHistorial() {
  listaFacturasContainer.innerHTML = "";
  listaRecibosContainer.innerHTML = "";

  // Ahora llama a la versión de Firestore
  const facturas = await getAllFacturas(); 
  const recibos = await getAllRecibos();

  // ======== Crear filtro de fechas ========
  const filtroDiv = document.createElement("div");
  filtroDiv.classList.add("filtro-fecha");
  filtroDiv.innerHTML = `
    <div class="filtro-fecha-inner">
      <label>Desde: <input type="text" id="fecha-desde" placeholder="Selecciona fecha"></label>
      <label>Hasta: <input type="text" id="fecha-hasta" placeholder="Selecciona fecha"></label>
      <button id="btn-filtrar-fecha">Filtrar</button>
      <button id="btn-ver-todo">Ver todo</button>
    </div>
  `;
  listaFacturasContainer.appendChild(filtroDiv);

  // ===== Inicializar Flatpickr sobre los inputs del filtro =====
  const inputDesde = filtroDiv.querySelector("#fecha-desde");
  const inputHasta = filtroDiv.querySelector("#fecha-hasta");
  flatpickr(inputDesde, { dateFormat: "Y-m-d", allowInput: true });
  flatpickr(inputHasta, { dateFormat: "Y-m-d", allowInput: true });

  // ===== Estilos internos (responsivo) =====
  const style = document.createElement("style");
  style.textContent = `
    .filtro-fecha-inner { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
    .filtro-fecha-inner label { display:flex; flex-direction:column; font-size:14px; }
    .filtro-fecha-inner input { padding:8px; border-radius:6px; border:1px solid #ccc; }
    .filtro-fecha-inner button { padding:6px 12px; border:none; border-radius:6px; background:#3498db; color:#fff; cursor:pointer; transition:0.2s; }
    .filtro-fecha-inner button:hover { background:#2980b9; }
    @media (max-width:600px) { .filtro-fecha-inner { flex-direction:column; align-items:flex-start; } }
  `;
  document.head.appendChild(style);

  // ===== Mensaje inicial =====
  const mensajeInicial = document.createElement("p");
  mensajeInicial.textContent = "Seleccione una fecha o rango para ver facturas.";
  listaFacturasContainer.appendChild(mensajeInicial);
  listaRecibosContainer.innerHTML = "";

  // ===== Función de filtrado =====
  function filtrarYMostrar() {
    const desdeVal = inputDesde.value;
    const hastaVal = inputHasta.value;

    // Si no hay ninguna fecha seleccionada, mostrar solo mensaje inicial
    if (!desdeVal && !hastaVal) {
      listaFacturasContainer.innerHTML = "";
      listaFacturasContainer.appendChild(filtroDiv);
      listaFacturasContainer.appendChild(mensajeInicial);
      listaRecibosContainer.innerHTML = "";
      return;
    }

    // Usamos las fechas ISO para la comparación
    const desde = desdeVal ? new Date(desdeVal + "T00:00:00.000Z") : null;
    const hasta = hastaVal ? new Date(hastaVal + "T23:59:59.999Z") : null;

    // ===== FILTRAR FACTURAS =====
    const filtradasFacturas = facturas.filter(f => {
      // Usar la fecha ISO para la comparación
      const fecha = new Date(f.fechaFactura); 
      return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
    });

    // ===== FILTRAR RECIBOS =====
    const filtradosRecibos = recibos.filter(r => {
      // Usar la fecha ISO para la comparación
      const fecha = new Date(r.fecha); 
      return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
    });

    mostrarFacturasFiltradas(filtradasFacturas);
    mostrarRecibosFiltrados(filtradosRecibos);
  }

  // ===== Botones de filtrado =====
  const btnFiltrar = filtroDiv.querySelector("#btn-filtrar-fecha");
  const btnVerTodo = filtroDiv.querySelector("#btn-ver-todo");

  btnFiltrar.addEventListener("click", filtrarYMostrar);
  btnVerTodo.addEventListener("click", () => {
    mostrarFacturasFiltradas(facturas);
    mostrarRecibosFiltrados(recibos);
  });
}


// ahora sí inicializar flatpickr
flatpickr("#fecha-desde", { dateFormat: "Y-m-d", allowInput: true });
flatpickr("#fecha-hasta", { dateFormat: "Y-m-d", allowInput: true });


// Función para mostrar recibos filtrados (Mismo código, sin cambios)
function mostrarRecibosFiltrados(recibos) {
  listaRecibosContainer.innerHTML = "";
  if (!recibos.length) {
    listaRecibosContainer.innerHTML = `<p>No hay recibos registrados.</p>`;
    return;
  }

  // Ahora se usa el campo 'fecha' de Firestore para ordenar por la fecha real
  recibos.sort((a,b) => (new Date(b.fecha)).getTime() - (new Date(a.fecha)).getTime());

  recibos.forEach(r => {
    const div = document.createElement("div");
    div.classList.add("item-historial");
    div.innerHTML = `
      <div style="flex:1">
        <p><strong>Cliente:</strong> ${r.cliente} <span style="color:#666">- ${r.fechaLocal || r.fecha}</span></p>
        <p style="margin-top:6px"><strong>Monto:</strong> RD$ ${Number(r.monto).toFixed(2)}</p>
        ${r.concepto ? `<p style="margin-top:6px"><strong>Concepto:</strong> ${r.concepto}</p>` : ""}
      </div>
      <div class="acciones-historial">
        <button class="btn-ver">Ver</button>
      </div>
    `;
    div.querySelector(".btn-ver").addEventListener("click", () => imprimirRecibo(r));
    listaRecibosContainer.appendChild(div);
  });
}


// Función auxiliar para mostrar facturas filtradas (Mismo código, sin cambios)
function mostrarFacturasFiltradas(facturas) {
  const filtroDiv = listaFacturasContainer.querySelector("div");
  listaFacturasContainer.innerHTML = "";
  if (filtroDiv) listaFacturasContainer.appendChild(filtroDiv);

  if (!facturas.length) {
    listaFacturasContainer.innerHTML += `<p>No hay facturas para esas fechas.</p>`;
    return;
  }

  // Ahora se usa el campo 'fechaFactura' de Firestore para ordenar por la fecha real
  facturas.sort((a,b) => (new Date(b.fechaFactura)).getTime() - (new Date(a.fechaFactura)).getTime());

  facturas.forEach(f => {
    const div = document.createElement("div");
    div.classList.add("item-historial");
    const totalFormatted = Number(f.total).toFixed(2);
    div.innerHTML = `
      <div style="flex:1">
        <p><strong>${f.numeroFactura}</strong> <span style="color:#666">- ${f.fechaFacturaLocal || f.fechaFactura}</span></p>
        <p style="margin-top:6px"><strong>Cliente:</strong> ${f.cliente || "Consumidor Final"} • <strong>Método:</strong> ${f.metodoPago || "-"}</p>
        <p style="margin-top:6px"><strong>Total:</strong> RD$ ${totalFormatted}</p>
      </div>
      <div class="acciones-historial">
        <button class="btn-ver">Ver</button>
        <button class="btn-recibo">Recibo</button>
      </div>
    `;
    div.querySelector(".btn-ver").addEventListener("click", () => imprimirFacturaHTML(f));
    div.querySelector(".btn-recibo").addEventListener("click", () => imprimirRecibo(f));
    listaFacturasContainer.appendChild(div);
  });
}



// abrir / cerrar historial (Mismo código, sin cambios)
if (btnHistorial) btnHistorial.addEventListener("click", async () => {
  await cargarHistorial();
  modalHistorial.style.display = "flex";
});
if (btnCerrarHistorial) btnCerrarHistorial.addEventListener("click", () => modalHistorial.style.display = "none");

// ================================
// Imprimir Factura / Recibo (HTML fallback) (Mismo código, sin cambios)
// ================================
function imprimirFacturaHTML(f) {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html><head><title>${f.numeroFactura}</title>
      <style>body{font-family:Arial;padding:12px} .producto{border-top:1px dashed #ccc;padding:6px 0}</style>
    </head><body>
      <h2 style="text-align:center">Heladería Rosary</h2>
      <p><strong>No. Factura:</strong> ${f.numeroFactura}</p>
      <p><strong>Fecha:</strong> ${f.fechaFacturaLocal || f.fechaFactura}</p>
      <p><strong>Cliente:</strong> ${f.cliente || 'Consumidor Final'}</p>
      <p><strong>Método:</strong> ${f.metodoPago || '-'}</p>
      <hr>
      ${f.productos.map(p=>`<div class="producto"><p><strong>${p.nombre || ''}</strong></p><p>RD$ ${Number(p.precio).toFixed(2)}</p></div>`).join('')}
      <hr>
      <p style="text-align:right"><strong>Total: RD$ ${Number(f.total).toFixed(2)}</strong></p>
      <p style="text-align:center;font-style:italic">¡Gracias por su compra!</p>
    </body></html>
  `);
  // dar tiempo para cargar
  printWindow.onload = () => { printWindow.print(); printWindow.close(); };
}

// imprimir recibo (detecta factura o recibo) (Mismo código, sin cambios)
function imprimirRecibo(obj) {
  let isFactura = Boolean(obj && obj.numeroFactura);
  let titulo = isFactura ? `Recibo - ${obj.numeroFactura}` : `Recibo de Caja`;
  let cliente = isFactura ? (obj.cliente || "Consumidor Final") : (obj.cliente || "");
  let fecha = isFactura ? (obj.fechaFacturaLocal || obj.fechaFactura || "") : (obj.fechaLocal || obj.fecha || "");
  let monto = isFactura ? Number(obj.total).toFixed(2) : Number(obj.monto).toFixed(2);
  let metodo = isFactura ? (obj.metodoPago || "") : "";
  let concepto = isFactura ? `Pago factura ${obj.numeroFactura}` : (obj.concepto || "");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>${titulo}</title>
      <style>body{font-family:Arial;padding:12px}.recibo{border:1px solid #000;padding:10px}</style>
    </head>
    <body>
      <div class="recibo">
        <h2 style="text-align:center">Recibo de Caja</h2>
        ${isFactura ? `<p><strong>No. Factura:</strong> ${obj.numeroFactura}</p>` : ""}
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        ${metodo ? `<p><strong>Método de pago:</strong> ${metodo}</p>` : ""}
        ${concepto ? `<p><strong>Concepto:</strong> ${concepto}</p>` : ""}
        <hr>
        <p><strong>Monto recibido:</strong> RD$ ${monto}</p>
        <div style="margin-top:12px">Firma Cajero: ____________</div>
        <div style="margin-top:6px">Firma Cliente: ____________</div>
      </div>
    </body>
    </html>
  `);
  printWindow.onload = () => { printWindow.print(); printWindow.close(); };
}

// ================================
// Generar ticket estilo supermercado (jsPDF) (Mismo código, sin cambios)
// ================================
function generarFacturaTicket(f) {
  // Asegurarse de que jsPDF esté cargado
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("jsPDF no está disponible. Incluye la librería antes de script.js");
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 200]
  });

  let y = 8;
  doc.setFont("courier", "bold");
  doc.setFontSize(12);
  doc.text("Heladería Rosary", 40, y, { align: "center" });
  y += 5;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(`Factura: ${f.numeroFactura}`, 6, y); y += 4;
  doc.text(`Fecha: ${f.fechaFacturaLocal || f.fechaFactura}`, 6, y); y += 4;
  doc.text(`Cliente: ${f.cliente}`, 6, y); y += 4;
  doc.text(`Método: ${f.metodoPago}`, 6, y); y += 4;
  doc.line(6, y, 74, y); y += 5;

  // encabezado tabla
  doc.text("Producto", 6, y);
  doc.text("Precio", 66, y, { align: "right" });
  y += 4;
  doc.line(6, y, 74, y); y += 5;

  f.productos.forEach(p => {
    const name = (p.nombre || "Producto").substring(0, 28);
    doc.text(name, 6, y);
    doc.text(`RD$${Number(p.precio).toFixed(2)}`, 66, y, { align: "right" });
    y += 5;
    // si y se acerca al final, agregar página (por si hay muchos productos)
    if (y > 195) {
      doc.addPage([80, 200]);
      y = 10;
    }
  });

  doc.line(6, y, 74, y); y += 6;
  doc.setFont("courier", "bold");
  doc.text("TOTAL", 6, y);
  doc.text(`RD$${Number(f.total).toFixed(2)}`, 66, y, { align: "right" });
  y += 6;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text("¡Gracias por su compra!", 40, y, { align: "center" });
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}