// ===============================================
// servicios.js - Gestión de Clientes (Firebase Firestore)
// ===============================================

// **********************************
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DE FIREBASE
// **********************************
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  runTransaction, 
  serverTimestamp, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDi-yeyvgHQg0n2xAEh_D-n4sx0OD3SSc",
  authDomain: "sistema-anthony-7cea5.firebaseapp.com",
  projectId: "sistema-anthony-7cea5",
  storageBucket: "sistema-anthony-7cea5.firebasestorage.app",
  messagingSenderId: "940908012115",
  appId: "1:940908012115:web:204117d50beef619475ca6",
  measurementId: "G-RZDC3CMSZQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); 
const CLIENTES_COLLECTION = "servicios_clientes";

// ===============================================
// 2. REFERENCIAS DOM Y ESTADO LOCAL
// ===============================================
const nombre = document.getElementById("nombre");
const correo = document.getElementById("correo");
const telefono = document.getElementById("telefono");
const fechaEntrada = document.getElementById("fechaEntrada");
const monto = document.getElementById("monto");
const servicio = document.getElementById("servicio");
const btnAgregar = document.getElementById("btn-agregar");
const lista = document.getElementById("clientes-lista");
const btnVolver = document.getElementById("btn-volver");

// Buscador
const buscadorInput = document.getElementById("buscador-input");
const btnBuscar = document.getElementById("btn-buscar");

// Modal Editar
const modalEditar = document.getElementById("modal-editar");
const editarNombre = document.getElementById("editar-nombre");
const editarCorreo = document.getElementById("editar-correo");
const editarTelefono = document.getElementById("editar-telefono");
const editarFechaEntrada = document.getElementById("editar-fechaEntrada");
const editarMonto = document.getElementById("editar-monto");
const editarServicio = document.getElementById("editar-servicio");
const btnGuardarEdicion = document.getElementById("guardar-edicion");
const btnCancelarEdicion = document.getElementById("cancelar-edicion");

// Modal Pago
const modalPago = document.getElementById("modal-pago");
const pagoClienteNombre = document.getElementById("pago-cliente-nombre");
const pagoMonto = document.getElementById("pago-monto");
const pagoFecha = document.getElementById("pago-fecha");
const pagoMetodo = document.getElementById("pago-metodo");
const pagoMeses = document.getElementById("pago-meses");
const btnRegistrarPago = document.getElementById("btn-registrar-pago");
const btnCancelarPago = document.getElementById("btn-cancelar-pago");

// Modal Historial de Pagos
const modalPagosHistorial = document.getElementById("modal-pagos-historial");
const historialClienteNombre = document.getElementById("historial-cliente-nombre");
const historialLista = document.getElementById("historial-lista");
const btnCerrarHistorial = document.getElementById("btn-cerrar-historial");

// Modal Estado de Cuenta
const modalEstadoCuenta = document.getElementById("modal-estado-cuenta");
const btnEstadoCuenta = document.getElementById("btn-estado-cuenta");
const btnCerrarEstadoCuenta = document.getElementById("btn-cerrar-estado-cuenta");
const fechaDesde = document.getElementById("fecha-desde");
const fechaHasta = document.getElementById("fecha-hasta");
const btnFiltrarFechas = document.getElementById("btn-filtrar-fechas");
const estadoCuentaLista = document.getElementById("estado-cuenta-lista");

let clientes = [];
let clienteEditando = null;
let clientePagando = null;
let clienteHistorial = null;

// ===============================================
// 3. FUNCIONES DE BASE DE DATOS Y TRANSACCIONES
// ===============================================
async function cargarClientes() {
  try {
    const q = query(collection(db, CLIENTES_COLLECTION), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    render();
  } catch (e) {
    console.error("Error al cargar clientes: ", e);
  }
}

async function agregarCliente(clienteData) {
  try {
    const fechaInicial = new Date(clienteData.fechaEntrada.replace(/-/g, '/'));
    fechaInicial.setMonth(fechaInicial.getMonth() + 1);
    const primerCorte = fechaInicial.toISOString().split('T')[0];

    const clienteDataConCorte = { 
        ...clienteData,
        fechaEntrada: primerCorte, 
        fechaCreacion: serverTimestamp()
    };
    
    await addDoc(collection(db, CLIENTES_COLLECTION), clienteDataConCorte);
    await cargarClientes();
    limpiar();
  } catch (e) {
    console.error("Error al añadir cliente: ", e);
    alert("Error al guardar cliente. Revisa tu consola y reglas de Firebase.");
  }
}

async function actualizarCliente(id, clienteData) {
  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, id);
    await updateDoc(clienteRef, clienteData);
    await cargarClientes();
  } catch (e) {
    console.error("Error al actualizar cliente: ", e);
  }
}

async function eliminarCliente(id) {
  if (confirm("¿Eliminar este cliente? Esta acción es permanente.")) {
    try {
      await deleteDoc(doc(db, CLIENTES_COLLECTION, id));
      await cargarClientes();
    } catch (e) {
      console.error("Error al eliminar cliente: ", e);
    }
  }
}

// ===============================================
// 4. PAGOS
// ===============================================
async function getPagosCliente(clienteId) {
  try {
      const pagosCol = collection(db, CLIENTES_COLLECTION, clienteId, 'pagos');
      const q = query(pagosCol, orderBy('fechaPago', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaPago: doc.data().fechaPago.toDate()
      }));
  } catch (e) {
      console.error("Error al obtener pagos: ", e);
      return [];
  }
}

async function registrarPago(clienteId, datosPago) {
  const clienteRef = doc(db, CLIENTES_COLLECTION, clienteId);
  let nuevaFechaEntrada = null;

  try {
    await runTransaction(db, async (transaction) => {
      const clienteDoc = await transaction.get(clienteRef);
      if (!clienteDoc.exists()) throw "Cliente no existe!";

      const fechaActual = new Date(clienteDoc.data().fechaEntrada.replace(/-/g, '/'));
      fechaActual.setMonth(fechaActual.getMonth() + datosPago.meses);
      nuevaFechaEntrada = fechaActual.toISOString().split('T')[0];

      transaction.update(clienteRef, {
        fechaEntrada: nuevaFechaEntrada,
        ultima_actualizacion: serverTimestamp()
      });

      const pagosCollectionRef = collection(db, CLIENTES_COLLECTION, clienteId, 'pagos');
      transaction.set(doc(pagosCollectionRef), {
        monto: datosPago.monto,
        metodo: datosPago.metodo,
        mesesPagados: datosPago.meses,
        fechaPago: Timestamp.fromDate(new Date(datosPago.fecha.replace(/-/g, '/'))),
        fechaCorteNueva: nuevaFechaEntrada,
        fechaRegistro: serverTimestamp()
      });
    });

    alert(`Pago registrado con éxito. Próximo corte: ${nuevaFechaEntrada}`);
    await cargarClientes();
    modalPago.style.display = "none";
    clientePagando = null;

  } catch (e) {
    console.error("Error en transacción de pago: ", e);
    alert("Error al registrar el pago. Revisa la consola.");
  }
}

// ===============================================
// 5. RENDER Y UTILIDADES
// ===============================================
function limpiar() {
  nombre.value = correo.value = telefono.value = fechaEntrada.value = monto.value = "";
  servicio.value = "Netflix";
}

function calcularDiasAbsolutos(fechaEntrada) {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const fechaCorte = new Date(fechaEntrada.replace(/-/g,'/'));
  fechaCorte.setHours(0,0,0,0);
  return Math.ceil((fechaCorte.getTime() - hoy.getTime()) / (1000*60*60*24));
}

function render(clientesFiltrados = clientes) {
  lista.innerHTML = "";

  if (clientesFiltrados.length === 0) {
    lista.innerHTML = "<p style='text-align:center;'>No se encontraron clientes.</p>";
    return;
  }

  clientesFiltrados.forEach(c => {
    const diasFaltan = calcularDiasAbsolutos(c.fechaEntrada);
    const alerta = diasFaltan <= 3 ? "alerta-roja" : (diasFaltan <= 7 ? "alerta-amarilla" : "");

    const fechaCorteDB = new Date(c.fechaEntrada.replace(/-/g, '/'));
    const proximoCorteStr = fechaCorteDB.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="card-header">
        <h3>${c.nombre}</h3>
        <span>${c.servicio}</span>
      </div>
      <div class="contacto-info">
        <p>📧 ${c.correo || "Sin correo"} | 📞 ${c.telefono || "Sin teléfono"}</p>
      </div>
      <div class="card-detalles">
        <p>🗓️ Próximo Corte: <strong>${proximoCorteStr}</strong></p>
        <p>💰 Monto: <strong>$${Number(c.monto).toFixed(2)}</strong></p>
      </div>
      <div class="contador">
        <span class="${alerta}">${diasFaltan <= 0 ? "⚠️ Pago Vencido" : `⏰ Faltan ${diasFaltan} días`}</span>
      </div>
      <div class="acciones">
        <button class="btn-historial-pago" data-id="${c.id}">📄 Ver Pagos</button>
        <button class="btn-pago" data-id="${c.id}">✅ Registrar Pago</button>
        <button class="btn-editar" data-id="${c.id}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${c.id}">🗑️ Eliminar</button>
      </div>
    `;

    div.querySelector(".btn-historial-pago").addEventListener("click",(e)=>abrirHistorialPagos(e.target.dataset.id));
    div.querySelector(".btn-pago").addEventListener("click",(e)=>abrirModalPago(e.target.dataset.id));
    div.querySelector(".btn-editar").addEventListener("click",(e)=>abrirEditar(e.target.dataset.id));
    div.querySelector(".btn-eliminar").addEventListener("click",(e)=>eliminarCliente(e.target.dataset.id));

    lista.appendChild(div);
  });
}

// ===============================================
// 6. MODALES Y FUNCIONES DE EDICIÓN
// ===============================================
function abrirEditar(id) {
  clienteEditando = clientes.find(c => c.id === id);
  if (!clienteEditando) return;
  editarNombre.value = clienteEditando.nombre;
  editarCorreo.value = clienteEditando.correo;
  editarTelefono.value = clienteEditando.telefono;
  editarFechaEntrada.value = clienteEditando.fechaEntrada;
  editarMonto.value = clienteEditando.monto;
  editarServicio.value = clienteEditando.servicio;
  modalEditar.style.display = "flex";
}

function abrirModalPago(id) {
  clientePagando = clientes.find(c => c.id === id);
  if (!clientePagando) return;
  pagoClienteNombre.textContent = clientePagando.nombre;
  pagoMonto.value = clientePagando.monto;
  pagoFecha.value = new Date().toISOString().split('T')[0];
  pagoMetodo.value = 'Efectivo';
  pagoMeses.value = 1;
  modalPago.style.display = "flex";
}

async function abrirHistorialPagos(id) {
  clienteHistorial = clientes.find(c => c.id === id);
  if (!clienteHistorial) return;

  historialClienteNombre.textContent = `Historial de Pagos: ${clienteHistorial.nombre}`;
  historialLista.innerHTML = "<p>Cargando...</p>";

  const pagos = await getPagosCliente(clienteHistorial.id);
  if (pagos.length === 0) {
    historialLista.innerHTML = "<p>No hay pagos registrados.</p>";
    return;
  }

  historialLista.innerHTML = "";
  pagos.forEach(p => {
    const div = document.createElement("div");
    const fechaPagoStr = new Date(p.fechaPago).toLocaleDateString('es-ES');
    div.innerHTML = `
      <p>💰 $${p.monto.toFixed(2)} - ${p.mesesPagados} mes(es) - ${fechaPagoStr} - ${p.metodo}</p>
    `;
    historialLista.appendChild(div);
  });

  modalPagosHistorial.style.display = "flex";
}

// ===============================================
// 7. ESTADO DE CUENTA (Rango de Fechas)
// ===============================================
btnEstadoCuenta.addEventListener("click", () => {
  modalEstadoCuenta.style.display = "flex";
  estadoCuentaLista.innerHTML = "<p>Seleccione un rango de fechas y haga clic en filtrar.</p>";
});

btnCerrarEstadoCuenta.addEventListener("click", () => {
  modalEstadoCuenta.style.display = "none";
  fechaDesde.value = fechaHasta.value = "";
});

btnFiltrarFechas.addEventListener("click", async () => {
  if (!fechaDesde.value || !fechaHasta.value) {
    alert("Seleccione ambas fechas.");
    return;
  }
  const desde = new Date(fechaDesde.value);
  const hasta = new Date(fechaHasta.value);
  if (hasta < desde) { alert("La fecha hasta debe ser mayor o igual a la fecha desde."); return; }

  estadoCuentaLista.innerHTML = "<p>Cargando...</p>";

  let html = "";
  for (const c of clientes) {
    const dias = calcularDiasAbsolutos(c.fechaEntrada);
    const fechaCorte = new Date(c.fechaEntrada.replace(/-/g, '/'));

    if (fechaCorte >= desde && fechaCorte <= hasta) {
      html += `
        <div class="card">
          <h4>${c.nombre} (${c.servicio})</h4>
          <p>💰 $${Number(c.monto).toFixed(2)}</p>
          <p>🗓️ Próximo Corte: ${fechaCorte.toLocaleDateString('es-ES')}</p>
          <p>${dias <= 0 ? "⚠️ Vencido" : `⏰ Faltan ${dias} día(s)`}</p>
        </div>
      `;
    }
  }

  estadoCuentaLista.innerHTML = html || "<p>No hay clientes con pagos en este rango.</p>";
});

// ===============================================
// 8. EVENTOS BOTONES Y BUSCADOR
// ===============================================
btnAgregar.addEventListener("click", () => {
  if (!nombre.value || !monto.value || !fechaEntrada.value) { alert("Nombre, monto y fecha son obligatorios."); return; }
  agregarCliente({
    nombre: nombre.value,
    correo: correo.value,
    telefono: telefono.value,
    fechaEntrada: fechaEntrada.value,
    monto: parseFloat(monto.value),
    servicio: servicio.value
  });
});

btnGuardarEdicion.addEventListener("click", () => {
  if (!editarNombre.value || !editarMonto.value || !editarFechaEntrada.value) { alert("Nombre, monto y fecha son obligatorios."); return; }
  actualizarCliente(clienteEditando.id, {
    nombre: editarNombre.value,
    correo: editarCorreo.value,
    telefono: editarTelefono.value,
    fechaEntrada: editarFechaEntrada.value,
    monto: parseFloat(editarMonto.value),
    servicio: editarServicio.value
  });
  modalEditar.style.display = "none";
});

btnCancelarEdicion.addEventListener("click", () => modalEditar.style.display = "none");

btnRegistrarPago.addEventListener("click", () => {
  registrarPago(clientePagando.id, {
    monto: parseFloat(pagoMonto.value),
    fecha: pagoFecha.value,
    metodo: pagoMetodo.value,
    meses: parseInt(pagoMeses.value)
  });
});

btnCancelarPago.addEventListener("click", () => modalPago.style.display = "none");

btnCerrarHistorial.addEventListener("click", () => modalPagosHistorial.style.display = "none");

btnBuscar.addEventListener("click", () => {
  const term = buscadorInput.value.toLowerCase();
  const filtrados = clientes.filter(c => c.nombre.toLowerCase().includes(term) || c.servicio.toLowerCase().includes(term));
  render(filtrados);
});

// Botón volver
if (btnVolver) {
    btnVolver.addEventListener("click", () => {
        // Cambia la ruta según tu estructura de carpetas
        window.location.href="../index.html"; 
    });
}


// ===============================================
// 9. INICIALIZACIÓN
// ===============================================
cargarClientes();
