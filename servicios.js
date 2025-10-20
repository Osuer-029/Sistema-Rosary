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
  runTransaction, // <--- NUEVO: Importar para asegurar la integridad de los pagos
  serverTimestamp, // <--- NUEVO: Para registrar la fecha de pago exacta
  Timestamp 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";


// Tu configuración de Firebase (DEBES REVISAR LA API KEY)
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

// Modal Pago <--- NUEVOS ELEMENTOS
const modalPago = document.getElementById("modal-pago");
const pagoClienteNombre = document.getElementById("pago-cliente-nombre");
const pagoMonto = document.getElementById("pago-monto");
const pagoFecha = document.getElementById("pago-fecha");
const pagoMetodo = document.getElementById("pago-metodo");
const btnRegistrarPago = document.getElementById("btn-registrar-pago");
const btnCancelarPago = document.getElementById("btn-cancelar-pago");

let clientes = [];
let clienteEditando = null;
let clientePagando = null; // <--- NUEVO: Almacena el cliente actual para registrar el pago

// ===============================================
// 3. FUNCIONES CRUD DE FIREBASE
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
    await addDoc(collection(db, CLIENTES_COLLECTION), clienteData);
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

/**
 * Registra un pago y actualiza la fecha de corte del cliente en una transacción.
 * @param {string} clienteId - ID de Firestore del cliente.
 * @param {Object} datosPago - Datos del pago (monto, metodo, fecha).
 */
async function registrarPago(clienteId, datosPago) {
  const clienteRef = doc(db, CLIENTES_COLLECTION, clienteId);

  try {
    await runTransaction(db, async (transaction) => {
      const clienteDoc = await transaction.get(clienteRef);
      if (!clienteDoc.exists()) {
        throw "Documento del cliente no existe!";
      }

      // 1. Calcular la nueva fecha de corte (sumar 30 días)
      const fechaActualString = clienteDoc.data().fechaEntrada;
      const fechaActual = new Date(fechaActualString.replace(/-/g, '/'));
      
      // Añadir 30 días. Si el pago es anticipado, se añade desde la fecha actual de corte.
      fechaActual.setDate(fechaActual.getDate() + 30);
      
      // Formatear a YYYY-MM-DD para Firestore/Input Date
      const nuevaFechaEntrada = fechaActual.toISOString().split('T')[0];

      // 2. Actualizar la fecha de entrada del cliente (el campo que controla el restante de días)
      transaction.update(clienteRef, {
        fechaEntrada: nuevaFechaEntrada,
        // Puedes añadir un campo de última_actualización si lo deseas
        ultima_actualizacion: serverTimestamp() 
      });

      // 3. Registrar el pago en una subcolección 'pagos'
      const pagosCollectionRef = collection(db, CLIENTES_COLLECTION, clienteId, 'pagos');
      transaction.set(doc(pagosCollectionRef), {
        monto: datosPago.monto,
        metodo: datosPago.metodo,
        fechaPago: Timestamp.fromDate(new Date(datosPago.fecha)),
        fechaRegistro: serverTimestamp() // Fecha real de cuando se ejecuta la transacción
      });
    });

    alert(`Pago de $${datosPago.monto} registrado con éxito. Fecha de corte actualizada.`);
    await cargarClientes(); // Recargar la lista para mostrar los días restantes actualizados
    modalPago.style.display = "none";
    clientePagando = null;

  } catch (e) {
    console.error("Error en la transacción de pago: ", e);
    alert("Error al registrar el pago. Verifica la consola.");
  }
}

// ===============================================
// 4. LÓGICA DE LA APLICACIÓN Y RENDER
// ===============================================

function limpiar() {
  nombre.value = correo.value = telefono.value = fechaEntrada.value = monto.value = "";
  servicio.value = "Netflix";
}

function calcularDiasRestantes(fechaEntrada) {
  // Convierte la fechaEntrada (YYYY-MM-DD) a un objeto Date
  const fechaCorte = new Date(fechaEntrada.replace(/-/g, '/'));
  const hoy = new Date();
  
  // Si la fecha de corte ya pasó, se usa el día del mes actual para la comparación.
  // Ejemplo: fechaEntrada es '2025-10-20'. Si hoy es '2025-11-01', fechaCorte ya pasó.
  
  let proximoPago = new Date(fechaCorte);
  proximoPago.setFullYear(hoy.getFullYear());
  
  // Ajustar el mes de la fecha de corte al mes actual o al siguiente si ya pasó.
  if (proximoPago < hoy) {
      proximoPago.setMonth(proximoPago.getMonth() + 1);
  }
  
  // Diferencia en milisegundos
  const diffTime = proximoPago.getTime() - hoy.getTime();
  // Diferencia en días
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return dias;
}

function render() {
  lista.innerHTML = "";
  if (clientes.length === 0) {
    lista.innerHTML = "<p style='text-align:center;'>No hay clientes de servicios registrados.</p>";
    return;
  }
  
  clientes.forEach(c => {
    const diasFaltan = calcularDiasRestantes(c.fechaEntrada);
    const progreso = Math.max(0, Math.min(100, (30 - diasFaltan) / 30 * 100)); 
    const alerta = diasFaltan <= 3 ? "alerta-roja" : (diasFaltan <= 7 ? "alerta-amarilla" : "");
    
    const div = document.createElement("div");
    div.className = "card";
    
    const mensajeDias = diasFaltan <= 0 ? "⚠️ Pago Pendiente" : `⏰ Faltan ${diasFaltan} días`;
    
    div.innerHTML = `
      <h3>${c.nombre} (${c.servicio})</h3>
      <p>📧 ${c.correo || "—"} | 📞 ${c.telefono || "—"}</p>
      <p>🗓️ **Próximo Corte:** ${c.fechaEntrada}</p>
      <p>💰 **Monto:** $${Number(c.monto).toFixed(2)}</p>
      <div class="contador">
        <span class="${alerta}">${mensajeDias}</span>
        <div class="barra-progreso"><span style="width:${progreso}%" class="${alerta}"></span></div>
      </div>
      <div class="acciones">
        <button class="btn-pago" data-id="${c.id}">✅ Registrar Pago</button>
        <button class="btn-editar" data-id="${c.id}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${c.id}">🗑️ Eliminar</button>
      </div>
    `;
    
    // Asignar event listeners
    div.querySelector(".btn-pago").addEventListener("click", (e) => abrirModalPago(e.target.dataset.id));
    div.querySelector(".btn-editar").addEventListener("click", (e) => abrirEditar(e.target.dataset.id));
    div.querySelector(".btn-eliminar").addEventListener("click", (e) => eliminarCliente(e.target.dataset.id));
    
    lista.appendChild(div);
  });
}

function abrirEditar(id){
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

// NUEVA FUNCIÓN: Abrir modal de pago
function abrirModalPago(id) {
    clientePagando = clientes.find(c => c.id === id);
    if (!clientePagando) return;

    pagoClienteNombre.textContent = clientePagando.nombre;
    pagoMonto.value = clientePagando.monto; // Sugerir el monto predeterminado
    pagoFecha.value = new Date().toISOString().split('T')[0]; // Fecha de hoy
    pagoMetodo.value = 'Efectivo'; // Método predeterminado
    modalPago.style.display = "flex";
}


// ===============================================
// 5. EVENT LISTENERS
// ===============================================

btnAgregar.addEventListener("click", () => {
  if (!nombre.value || !fechaEntrada.value || !monto.value || !servicio.value) {
    alert("Por favor completa los campos obligatorios.");
    return;
  }
  
  const nuevo = {
    nombre: nombre.value.trim(),
    correo: correo.value.trim(),
    telefono: telefono.value.trim(),
    fechaEntrada: fechaEntrada.value,
    monto: parseFloat(monto.value),
    servicio: servicio.value,
    fechaCreacion: serverTimestamp() // Marcar la fecha de creación
  };
  
  agregarCliente(nuevo);
});

btnGuardarEdicion.addEventListener("click", () => {
  if (!clienteEditando) return;

  const datosActualizados = {
    nombre: editarNombre.value.trim(),
    correo: editarCorreo.value.trim(),
    telefono: editarTelefono.value.trim(),
    fechaEntrada: editarFechaEntrada.value,
    monto: parseFloat(editarMonto.value),
    servicio: editarServicio.value
  };

  actualizarCliente(clienteEditando.id, datosActualizados);
  modalEditar.style.display = "none";
  clienteEditando = null;
});

btnCancelarEdicion.addEventListener("click", () => modalEditar.style.display = "none");
if (btnVolver) btnVolver.addEventListener("click", () => window.location.href="index.html");


// NUEVOS LISTENERS DE PAGO
btnRegistrarPago.addEventListener("click", () => {
    if (!clientePagando || !pagoMonto.value || !pagoFecha.value || !pagoMetodo.value) {
        alert("Completa todos los campos del pago.");
        return;
    }

    const datosPago = {
        monto: parseFloat(pagoMonto.value),
        fecha: pagoFecha.value,
        metodo: pagoMetodo.value
    };

    registrarPago(clientePagando.id, datosPago);
});

btnCancelarPago.addEventListener("click", () => {
    modalPago.style.display = "none";
    clientePagando = null;
});

// **INICIO DE LA APLICACIÓN:** Cargar datos de Firebase al inicio
cargarClientes(); 

/* --- Re-renderizar para actualizar días automáticamente (cada 6 horas) --- */
setInterval(render, 1000 * 60 * 60 * 6);