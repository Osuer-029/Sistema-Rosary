// ===============================================
// servicios.js - Gestión de Clientes (Firebase Firestore)
// ===============================================

// **********************************
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DE FIREBASE
// **********************************
// **IMPORTANTE:** Usamos las rutas completas del CDN para evitar el error "Failed to resolve module specifier"
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
  orderBy 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";


// Tu nueva configuración de Firebase
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
const db = getFirestore(app); // Inicializar Firestore
const CLIENTES_COLLECTION = "servicios_clientes"; // Nombre de la colección en Firestore


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

const modalEditar = document.getElementById("modal-editar");
const editarNombre = document.getElementById("editar-nombre");
const editarCorreo = document.getElementById("editar-correo");
const editarTelefono = document.getElementById("editar-telefono");
const editarFechaEntrada = document.getElementById("editar-fechaEntrada");
const editarMonto = document.getElementById("editar-monto");
const editarServicio = document.getElementById("editar-servicio");
const btnGuardarEdicion = document.getElementById("guardar-edicion");
const btnCancelarEdicion = document.getElementById("cancelar-edicion");
const btnVolver = document.getElementById("btn-volver"); // Asumimos que tienes un botón de Volver

let clientes = []; // Ahora se carga desde Firebase, no de localStorage
let clienteEditando = null;


// ===============================================
// 3. FUNCIONES CRUD DE FIREBASE
// ===============================================

// Función para obtener todos los clientes
async function cargarClientes() {
  try {
    // Ordenar por nombre para mejor visualización inicial
    const q = query(collection(db, CLIENTES_COLLECTION), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    // Mapeamos los documentos para incluir el ID de Firestore (doc.id)
    clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    render();
  } catch (e) {
    console.error("Error al cargar clientes: ", e);
  }
}

// Función para agregar un nuevo cliente
async function agregarCliente(clienteData) {
  try {
    await addDoc(collection(db, CLIENTES_COLLECTION), clienteData);
    await cargarClientes(); // Recargar y renderizar la lista
    limpiar();
  } catch (e) {
    console.error("Error al añadir cliente: ", e);
    alert("Error al guardar cliente. Revisa tu consola y reglas de Firebase.");
  }
}

// Función para actualizar un cliente existente
async function actualizarCliente(id, clienteData) {
  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, id);
    await updateDoc(clienteRef, clienteData);
    await cargarClientes(); // Recargar y renderizar la lista
  } catch (e) {
    console.error("Error al actualizar cliente: ", e);
    alert("Error al actualizar cliente. Revisa tu consola.");
  }
}

// Función para eliminar un cliente
async function eliminarCliente(id) {
  try {
    await deleteDoc(doc(db, CLIENTES_COLLECTION, id));
    await cargarClientes(); // Recargar y renderizar la lista
  } catch (e) {
    console.error("Error al eliminar cliente: ", e);
    alert("Error al eliminar cliente. Revisa tu consola.");
  }
}


// ===============================================
// 4. EVENT LISTENERS
// ===============================================

btnAgregar.addEventListener("click", () => {
  if (!nombre.value || !fechaEntrada.value || !monto.value) {
    alert("Por favor completa los campos obligatorios.");
    return;
  }
  
  const nuevo = {
    // Ya no usamos Date.now() para el ID, Firestore lo asigna automáticamente
    nombre: nombre.value.trim(),
    correo: correo.value.trim(),
    telefono: telefono.value.trim(),
    // Almacenamos la fecha como string para facilidad de uso
    fechaEntrada: fechaEntrada.value, 
    monto: parseFloat(monto.value),
    servicio: servicio.value
  };
  
  agregarCliente(nuevo); // Llama a la función de Firebase
});

btnGuardarEdicion.addEventListener("click", () => {
  if (!clienteEditando || !editarNombre.value || !editarFechaEntrada.value || !editarMonto.value) {
    alert("Por favor completa los campos obligatorios para la edición.");
    return;
  }

  const datosActualizados = {
    nombre: editarNombre.value.trim(),
    correo: editarCorreo.value.trim(),
    telefono: editarTelefono.value.trim(),
    fechaEntrada: editarFechaEntrada.value,
    monto: parseFloat(editarMonto.value),
    servicio: editarServicio.value
  };

  // Llama a la función de actualización de Firebase con el ID de Firestore
  actualizarCliente(clienteEditando.id, datosActualizados);
  
  modalEditar.style.display = "none";
  clienteEditando = null; // Limpiamos el estado
});

if (btnCancelarEdicion) btnCancelarEdicion.addEventListener("click", () => modalEditar.style.display = "none");
if (btnVolver) btnVolver.addEventListener("click", () => window.location.href="index.html");


// ===============================================
// 5. LÓGICA DE LA APLICACIÓN (Funciones Auxiliares)
// ===============================================

function limpiar() {
  nombre.value = correo.value = telefono.value = fechaEntrada.value = monto.value = "";
  servicio.value = "Netflix";
}

// **Función 'guardar' eliminada porque ahora usa Firebase**
// function guardar() { ... } 

function calcularDiasRestantes(fecha) {
  const hoy = new Date();
  // Aseguramos que la fecha es interpretada correctamente
  let proximoPago = new Date(fecha.replace(/-/g, '/')); 
  
  // Lógica para calcular la próxima fecha en el mes actual o siguiente
  proximoPago.setMonth(hoy.getMonth());
  proximoPago.setFullYear(hoy.getFullYear());
  
  // Si la fecha de pago ya pasó este mes, se fija para el mes siguiente
  if (proximoPago < hoy) {
    proximoPago.setMonth(proximoPago.getMonth() + 1);
  }
  
  const dias = Math.ceil((proximoPago - hoy) / (1000 * 60 * 60 * 24));
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
    // Calculamos el progreso inverso (cuánto falta)
    const progreso = Math.max(0, Math.min(100, (30 - diasFaltan) / 30 * 100)); 
    const alerta = diasFaltan <= 3 ? "alerta" : "";
    
    const div = document.createElement("div");
    div.className = "card";
    
    // Si los días son 0 o menos, el texto cambia a Pendiente
    const mensajeDias = diasFaltan <= 0 ? "⚠️ Pendiente de pago" : `⏰ Faltan ${diasFaltan} días`;
    
    div.innerHTML = `
      <h3>${c.nombre}</h3>
      <p>📧 ${c.correo || "—"}</p>
      <p>📞 ${c.telefono || "—"}</p>
      <p>🎬 Servicio: ${c.servicio}</p>
      <p>🗓️ Fecha de ingreso: ${c.fechaEntrada}</p>
      <p>💰 Monto: $${Number(c.monto).toFixed(2)}</p>
      <div class="contador">
        ${mensajeDias}
        <div class="barra-progreso ${alerta}"><span style="width:${progreso}%"></span></div>
      </div>
      <div class="acciones">
        <button class="btn-editar">✏️ Editar</button>
        <button class="btn-eliminar">🗑️ Eliminar</button>
      </div>
    `;
    // Usamos c.id (el ID de Firestore)
    div.querySelector(".btn-editar").addEventListener("click", () => abrirEditar(c.id)); 
    div.querySelector(".btn-eliminar").addEventListener("click", () => confirmarEliminar(c.id));
    lista.appendChild(div);
  });
}

function abrirEditar(id){
  // Buscamos al cliente en el array local
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

function confirmarEliminar(id){
  if(confirm("¿Eliminar este cliente? Esta acción es permanente.")){
    eliminarCliente(id); // Llama a la función de Firebase
  }
}

// **INICIO DE LA APLICACIÓN:** Cargar datos de Firebase al inicio
cargarClientes(); 

/* --- Actualizar días automáticamente cada hora (Mantiene la lógica original) --- */
setInterval(render, 1000 * 60 * 60);