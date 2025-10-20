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

// NUEVAS REFERENCIAS PARA EL BUSCADOR
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

let clientes = [];
let clienteEditando = null;
let clientePagando = null;


// ===============================================
// 3. FUNCIONES DE BASE DE DATOS Y TRANSACCIONES
// ===============================================

async function cargarClientes() {
  try {
    const q = query(collection(db, CLIENTES_COLLECTION), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Llama a render sin argumentos para mostrar todos los clientes inicialmente
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

async function registrarPago(clienteId, datosPago) {
  const clienteRef = doc(db, CLIENTES_COLLECTION, clienteId);
  
  let nuevaFechaEntrada = null; 

  try {
    await runTransaction(db, async (transaction) => {
      const clienteDoc = await transaction.get(clienteRef);
      if (!clienteDoc.exists()) {
        throw "Documento del cliente no existe!";
      }

      const fechaActualString = clienteDoc.data().fechaEntrada;
      const fechaActual = new Date(fechaActualString.replace(/-/g, '/'));
      
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

    const fechaFormateada = new Date(Date.parse(nuevaFechaEntrada)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    alert(`Pago de $${datosPago.monto} por ${datosPago.meses} mes(es) registrado con éxito. Próximo corte: ${fechaFormateada}.`);
    
    await cargarClientes();
    modalPago.style.display = "none";
    clientePagando = null;

  } catch (e) {
    console.error("Error en la transacción de pago: ", e);
    alert("Error al registrar el pago. Revisa la consola para más detalles.");
  }
}

// ===============================================
// 4. LÓGICA DE LA APLICACIÓN Y RENDER
// ===============================================


function limpiar() {
  nombre.value = correo.value = telefono.value = fechaEntrada.value = monto.value = "";
  servicio.value = "Netflix";
}

function calcularDiasAbsolutos(fechaEntrada) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let fechaCorteAbsoluta = new Date(fechaEntrada.replace(/-/g, '/'));
    fechaCorteAbsoluta.setHours(0, 0, 0, 0);

    const diffTime = fechaCorteAbsoluta.getTime() - hoy.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return dias;
}

function calcularDiasProgramados(fechaEntrada) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); 
  
  const diaDeCorte = new Date(fechaEntrada.replace(/-/g, '/')).getDate();
  
  let proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth(), diaDeCorte);
  proximoCorte.setHours(0, 0, 0, 0); 

  if (proximoCorte <= hoy) {
      proximoCorte.setMonth(proximoCorte.getMonth() + 1);
  }
  
  const diffTime = proximoCorte.getTime() - hoy.getTime();
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return dias;
}

/**
 * Función principal de renderizado.
 * @param {Array<Object>} [clientesFiltrados=clientes] - La lista de clientes a mostrar (toda o filtrada).
 */
function render(clientesFiltrados = clientes) {
  lista.innerHTML = "";
  
  if (clientesFiltrados.length === 0) {
    lista.innerHTML = "<p style='text-align:center;'>No se encontraron clientes que coincidan con la búsqueda.</p>";
    return;
  }
  
  clientesFiltrados.forEach(c => {
    const diasFaltanAbsolutos = calcularDiasAbsolutos(c.fechaEntrada);
    const diasFaltanProgramados = calcularDiasProgramados(c.fechaEntrada);

    const alerta = diasFaltanAbsolutos <= 3 ? "alerta-roja" : (diasFaltanAbsolutos <= 7 ? "alerta-amarilla" : "");
    const progreso = Math.max(0, Math.min(100, (30 - diasFaltanProgramados) / 30 * 100)); 
    
    const fechaCorteDB = new Date(c.fechaEntrada.replace(/-/g, '/'));
    const proximoCorteStr = fechaCorteDB.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const mensajeDias = diasFaltanAbsolutos <= 0 ? "⚠️ Pago Vencido" : `⏰ Faltan ${diasFaltanAbsolutos} días`;
    
    const div = document.createElement("div");
    div.className = "card";
    
    const telefonoLimpio = c.telefono ? c.telefono.replace(/\s/g, '') : '';
    const correoLink = c.correo ? `<a href="mailto:${c.correo}" class="contacto-link" title="Enviar correo">📧</a>` : '';
    const telefonoLink = c.telefono ? `<a href="tel:${telefonoLimpio}" class="contacto-link" title="Llamar">📞</a>` : '';
    
    div.innerHTML = `
      <h3>${c.nombre} (${c.servicio})</h3>
      <div class="contacto-info">
        <p>
          ${correoLink} ${c.correo || "Sin correo"} | 
          ${telefonoLink} ${c.telefono || "Sin teléfono"}
        </p>
      </div>
      <p>🗓️ **Próximo Corte:** ${proximoCorteStr}</p>
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

function abrirModalPago(id) {
    clientePagando = clientes.find(c => c.id === id);
    if (!clientePagando) return;

    pagoClienteNombre.textContent = clientePagando.nombre;
    pagoMonto.value = clientePagando.monto; 
    pagoFecha.value = new Date().toISOString().split('T')[0];
    pagoMetodo.value = 'Efectivo';
    pagoMeses.value = '1';
    modalPago.style.display = "flex";
}

/**
 * Filtra la lista de clientes basándose en el texto del buscador.
 */
function filtrarClientes() {
    const termino = buscadorInput.value.toLowerCase().trim();
    
    if (termino === "") {
        render(clientes);
        return;
    }
    
    const clientesFiltrados = clientes.filter(c => {
        const nombre = c.nombre ? c.nombre.toLowerCase() : '';
        const servicio = c.servicio ? c.servicio.toLowerCase() : '';
        
        // Comprueba si el término está en el nombre O en el servicio
        return nombre.includes(termino) || servicio.includes(termino);
    });

    render(clientesFiltrados);
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

// LISTENERS DE PAGO
btnRegistrarPago.addEventListener("click", () => {
    if (!clientePagando || !pagoMonto.value || !pagoFecha.value || !pagoMetodo.value || !pagoMeses.value || parseInt(pagoMeses.value) < 1) {
        alert("Completa todos los campos del pago correctamente y asegura que los meses pagados sea al menos 1.");
        return;
    }

    const datosPago = {
        monto: parseFloat(pagoMonto.value),
        fecha: pagoFecha.value,
        metodo: pagoMetodo.value,
        meses: parseInt(pagoMeses.value)
    };

    registrarPago(clientePagando.id, datosPago);
});

btnCancelarPago.addEventListener("click", () => {
    modalPago.style.display = "none";
    clientePagando = null;
});

// LISTENERS DEL BUSCADOR: Ejecutar la búsqueda al hacer clic en el botón o al teclear
btnBuscar.addEventListener("click", filtrarClientes);
// Ejecuta la búsqueda mientras el usuario escribe
buscadorInput.addEventListener("input", filtrarClientes);


// **INICIO DE LA APLICACIÓN:** Cargar datos de Firebase al inicio
cargarClientes(); 

/* --- Re-renderizar para actualizar días automáticamente (cada 6 horas) --- */
setInterval(cargarClientes, 1000 * 60 * 60 * 6);