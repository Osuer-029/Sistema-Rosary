// ===============================================
// servicios.js - Gestión de Clientes (Firebase Firestore)
// ===============================================

// 1. INICIALIZACIÓN FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
  query, orderBy, runTransaction, serverTimestamp, Timestamp 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

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
const analytics = getAnalytics(app);
const db = getFirestore(app);
const CLIENTES_COLLECTION = "servicios_clientes";

// 2. REFERENCIAS DOM
const nombre = document.getElementById("nombre");
const correo = document.getElementById("correo");
const telefono = document.getElementById("telefono");
const fechaEntrada = document.getElementById("fechaEntrada");
const monto = document.getElementById("monto");
const servicio = document.getElementById("servicio");
const tipoServicioSelect = document.getElementById("tipo-servicio"); // nuevo select
const btnAgregar = document.getElementById("btn-agregar");
const lista = document.getElementById("clientes-lista");

const modalEditar = document.getElementById("modal-editar");
const editarNombre = document.getElementById("editar-nombre");
const editarCorreo = document.getElementById("editar-correo");
const editarTelefono = document.getElementById("editar-telefono");
const editarFechaEntrada = document.getElementById("editar-fechaEntrada");
const editarMonto = document.getElementById("editar-monto");
const editarServicio = document.getElementById("editar-servicio");
const editarTipoServicio = document.getElementById("editar-tipo-servicio"); // si existe en HTML, usado al editar
const btnGuardarEdicion = document.getElementById("guardar-edicion");
const btnCancelarEdicion = document.getElementById("cancelar-edicion");

const modalPago = document.getElementById("modal-pago");
const pagoClienteNombre = document.getElementById("pago-cliente-nombre");
const pagoMonto = document.getElementById("pago-monto");
const pagoFecha = document.getElementById("pago-fecha");
const pagoMeses = document.getElementById("pago-meses");
const pagoMetodo = document.getElementById("pago-metodo");
const btnRegistrarPago = document.getElementById("btn-registrar-pago");
const btnCancelarPago = document.getElementById("btn-cancelar-pago");

const modalPagosHistorial = document.getElementById("modal-pagos-historial");
const historialClienteNombre = document.getElementById("historial-cliente-nombre");
const historialLista = document.getElementById("historial-lista");
const btnCerrarHistorial = document.getElementById("btn-cerrar-historial");

const modalFactura = document.getElementById("modal-factura");
const facturaContenido = document.getElementById("factura-contenido");
const btnImprimirPDF = document.getElementById("btn-imprimir-pdf");
const btnCerrarFactura = document.getElementById("btn-cerrar-factura");

const btnEstadoCuenta = document.getElementById("btn-estado-cuenta");
const modalEstadoCuenta = document.getElementById("modal-estado-cuenta");
const fechaDesde = document.getElementById("fecha-desde");
const fechaHasta = document.getElementById("fecha-hasta");
const btnFiltrarFechas = document.getElementById("btn-filtrar-fechas");
const estadoCuentaLista = document.getElementById("estado-cuenta-lista");
const totalCobrar = document.getElementById("total-cobrar");
const btnCerrarEstadoCuenta = document.getElementById("btn-cerrar-estado-cuenta");

let clientes = [];
let clienteEditando = null;
let clientePagando = null;
let clienteHistorial = null;

// Variable para almacenar la factura actual que se muestra en la modal
let facturaActual = null;

// ===============================================
// 3. FUNCIONES BASE DE DATOS
// ===============================================
async function cargarClientes() {
  const q = query(collection(db, CLIENTES_COLLECTION), orderBy("nombre", "asc"));
  const snapshot = await getDocs(q);
  clientes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}

async function agregarCliente(data) {
  const fecha = new Date(data.fechaEntrada);
  await addDoc(collection(db, CLIENTES_COLLECTION), { 
    ...data, 
    fechaCreacion: serverTimestamp(),
    fechaEntrada: fecha.toISOString().split("T")[0]
  });
  limpiar();
  cargarClientes();
}

async function actualizarCliente(id, data) {
  await updateDoc(doc(db, CLIENTES_COLLECTION, id), data);
  cargarClientes();
}

async function eliminarCliente(id) {
  if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
  await deleteDoc(doc(db, CLIENTES_COLLECTION, id));
  cargarClientes();
}

// ===============================================
// 4. PAGOS
// ===============================================
async function getPagosCliente(clienteId) {
  const pagosCol = collection(db, CLIENTES_COLLECTION, clienteId, "pagos");
  const q = query(pagosCol, orderBy("fechaPago", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data(), fechaPago: d.data().fechaPago.toDate() }));
}

// ===============================================
// 4.1. Registrar movimiento en Cuadre (Ingreso/Gasto)
// ===============================================
async function registrarEnCuadre(tipo, descripcion, monto) {
  try {
    const cuadreRef = collection(db, "transacciones_financieras"); // coincide con tu cuadre.js
    await addDoc(cuadreRef, {
      type: tipo === "ingreso" ? "ingreso" : "ingreso",
      concept: descripcion,
      monto: Number(monto),
      date: new Date().toISOString().slice(0,10),
      timestamp: new Date()
    });
    console.log(`✅ Movimiento registrado en cuadre: ${tipo} - ${descripcion} - $${monto}`);
  } catch (e) {
    console.error("❌ Error al registrar en cuadre:", e);
  }
}


async function registrarPago(clienteId, datosPago) {
  const clienteRef = doc(db, CLIENTES_COLLECTION, clienteId);
  await runTransaction(db, async (transaction) => {
    const clienteDoc = await transaction.get(clienteRef);
    if (!clienteDoc.exists()) throw "Cliente no existe";

    const pagosCol = collection(db, CLIENTES_COLLECTION, clienteId, "pagos");
    const pagosSnapshot = await getDocs(pagosCol);
    const pagos = pagosSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Calcula fecha de corte
    let fechaCorte = new Date(clienteDoc.data().fechaCreacion?.toDate() || clienteDoc.data().fechaEntrada.replace(/-/g,'/'));
    for (const p of pagos) fechaCorte.setMonth(fechaCorte.getMonth() + (p.mesesPagados || 1));
    fechaCorte.setMonth(fechaCorte.getMonth() + datosPago.meses);

    transaction.update(clienteRef, { fechaEntrada: fechaCorte.toISOString().split('T')[0] });
    await addDoc(pagosCol, {
      monto: datosPago.monto,
      metodo: datosPago.metodo,
      mesesPagados: datosPago.meses,
      fechaPago: Timestamp.fromDate(new Date(datosPago.fecha.replace(/-/g,'/'))),
      fechaRegistro: serverTimestamp()
    });
  });

  // ⚡️ Aquí sí puedes usar el cliente desde tu arreglo 'clientes'
  const cliente = clientes.find(c => c.id === clienteId);
  if (cliente) {
    await registrarEnCuadre(
      "ingreso",
      `Pago de ${cliente.nombre}`,
      datosPago.monto
    );
  }

  alert("Pago registrado correctamente");
  modalPago.style.display = "none";
  cargarClientes();
}









// ===============================================
// 5. HISTORIAL DE PAGOS
// ===============================================
async function abrirHistorialPagos(clienteId) {
  clienteHistorial = clientes.find(c => c.id === clienteId);
  if (!clienteHistorial) return alert("Cliente no encontrado.");

  historialClienteNombre.textContent = clienteHistorial.nombre;
  historialLista.innerHTML = "<p>Cargando pagos...</p>";

  try {
    const pagos = await getPagosCliente(clienteId);
    if (pagos.length === 0) {
      historialLista.innerHTML = "<p>No hay pagos registrados.</p>";
      modalPagosHistorial.style.display = "flex";
      return;
    }

    historialLista.innerHTML = "";
    pagos.forEach(pago => {
      const div = document.createElement("div");
      div.className = "pago-item";
      div.innerHTML = `
        <p>💰 $${Number(pago.monto).toFixed(2)} | 🗓️ ${pago.fechaPago.toLocaleDateString('es-ES')} | 📝 ${pago.metodo} | Meses: ${pago.mesesPagados || 1}</p>
        <button class="btn-eliminar-pago" data-pago-id="${pago.id}">🗑️ Eliminar Pago</button>
      `;

      div.querySelector(".btn-eliminar-pago").onclick = async () => {
        if (!confirm("¿Eliminar este pago? Se recalculará la fecha de corte.")) return;
        try {
          await deleteDoc(doc(db, CLIENTES_COLLECTION, clienteId, "pagos", pago.id));

          const pagosRestantes = await getPagosCliente(clienteId);
          let nuevaFecha = new Date(clienteHistorial.fechaCreacion?.toDate() || clienteHistorial.fechaEntrada.replace(/-/g,'/'));
          for (const p of pagosRestantes) nuevaFecha.setMonth(nuevaFecha.getMonth() + (p.mesesPagados || 1));
          await updateDoc(doc(db, CLIENTES_COLLECTION, clienteId), { fechaEntrada: nuevaFecha.toISOString().split('T')[0] });

          alert("Pago eliminado y fecha de corte actualizada.");
          await cargarClientes();
          abrirHistorialPagos(clienteId);
        } catch(e) {
          console.error(e);
          alert("Error al eliminar pago");
        }
      };

      historialLista.appendChild(div);
    });

    modalPagosHistorial.style.display = "flex";
  } catch(e) {
    console.error(e);
    historialLista.innerHTML = "<p>Error al cargar pagos.</p>";
  }
}

btnCerrarHistorial.onclick = () => modalPagosHistorial.style.display = "none";

// ===============================================
// 6. RENDER CLIENTES CON DIAS RESTANTES Y VENCIMIENTO
// ===============================================
function calcularDiasAbsolutos(fechaCorte) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const f = new Date(fechaCorte.replace(/-/g,'/')); f.setHours(0,0,0,0);
  return Math.ceil((f - hoy)/(1000*60*60*24));
}

function render(clientesFiltrados = clientes) {
  lista.innerHTML = "";
  if (clientesFiltrados.length === 0) {
    lista.innerHTML = "<p style='text-align:center;'>No hay clientes registrados.</p>";
    return;
  }

  clientesFiltrados.forEach(c => {
    const dias = calcularDiasAbsolutos(c.fechaEntrada);
    const alerta = dias <= 0 ? "alerta-roja" : dias <= 7 ? "alerta-amarilla" : "";
    const fechaCorteStr = new Date(c.fechaEntrada.replace(/-/g,'/')).toLocaleDateString("es-ES");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header"><h3>${c.nombre}</h3><span>${c.servicio} ${c.tipoServicio ? '— ' + c.tipoServicio : ''}</span></div>
      <div class="contacto-info">📧 ${c.correo || "Sin correo"} | 📞 ${c.telefono || "Sin teléfono"}</div>
      <div class="card-detalles">
        <p>🗓️ Próximo Corte: ${fechaCorteStr}</p>
        <p>💰 Monto: $${Number(c.monto).toFixed(2)}</p>
      </div>
      <div class="contador"><span class="${alerta}">${dias <= 0 ? "⚠️ Pago Vencido" : `⏰ ${dias} días`}</span></div>
      <div class="acciones">
        <button class="btn-historial-pago" data-id="${c.id}">📄 Ver Pagos</button>
        <button class="btn-pago" data-id="${c.id}">✅ Registrar Pago</button>
        <button class="btn-imprimir" data-id="${c.id}">🧾 Imprimir</button>
        <button class="btn-editar" data-id="${c.id}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${c.id}">🗑️ Eliminar</button>
      </div>
    `;

    card.querySelector(".btn-historial-pago").onclick = e => abrirHistorialPagos(e.target.dataset.id);
    card.querySelector(".btn-pago").onclick = e => abrirModalPago(e.target.dataset.id);
    card.querySelector(".btn-imprimir").onclick = e => abrirFacturaCliente(e.target.dataset.id);
    card.querySelector(".btn-editar").onclick = e => abrirEditar(e.target.dataset.id);
    card.querySelector(".btn-eliminar").onclick = e => eliminarCliente(e.target.dataset.id);

    lista.appendChild(card);
  });
}

// ===============================================
// 7. MODALES AGREGAR/EDITAR/REGISTRAR PAGO
// ===============================================
function abrirEditar(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;
  clienteEditando = id;
  editarNombre.value = cliente.nombre;
  editarCorreo.value = cliente.correo;
  editarTelefono.value = cliente.telefono;
  editarFechaEntrada.value = cliente.fechaEntrada;
  editarMonto.value = cliente.monto;
  editarServicio.value = cliente.servicio;
  // Si existe el select de tipo dentro del modal de edición, cargar su valor
  if (editarTipoServicio) {
    editarTipoServicio.value = cliente.tipoServicio || "Televisión";
  }
  modalEditar.style.display = "flex";
}

btnGuardarEdicion.onclick = () => {
  if (!clienteEditando) return;
  const datosActualizados = {
    nombre: editarNombre.value,
    correo: editarCorreo.value,
    telefono: editarTelefono.value,
    fechaEntrada: editarFechaEntrada.value,
    monto: parseFloat(editarMonto.value),
    servicio: editarServicio.value
  };
  // Si existe el select de tipo en el modal de edición, inclúyelo
  if (editarTipoServicio) {
    datosActualizados.tipoServicio = editarTipoServicio.value;
  }
  actualizarCliente(clienteEditando, datosActualizados);
  modalEditar.style.display = "none";
};

btnCancelarEdicion.onclick = () => modalEditar.style.display = "none";

function abrirModalPago(id) {
  clientePagando = id;
  const cliente = clientes.find(c => c.id === id);
  pagoClienteNombre.textContent = cliente.nombre;
  pagoMonto.value = cliente.monto;
  pagoFecha.valueAsDate = new Date();
  pagoMeses.value = 1;
  modalPago.style.display = "flex";
}

btnRegistrarPago.onclick = () => {
  if (!clientePagando) return;
  registrarPago(clientePagando, {
    monto: parseFloat(pagoMonto.value),
    metodo: pagoMetodo.value,
    meses: parseInt(pagoMeses.value),
    fecha: pagoFecha.value
  });
};

btnCancelarPago.onclick = () => modalPago.style.display = "none";

// ===============================================
// 8. FACTURA CON MESES ATRASADOS
// ===============================================
async function abrirFacturaCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  const pagos = await getPagosCliente(id);

  let fechaIngreso = cliente.fechaCreacion?.toDate() || new Date(cliente.fechaEntrada.replace(/-/g,'/'));
  let fechaCorteReal = new Date(fechaIngreso);
  for (const p of pagos) fechaCorteReal.setMonth(fechaCorteReal.getMonth() + (p.mesesPagados || 1));

  let mesesAtrasados = 0;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  while (fechaCorteReal < hoy) {
    mesesAtrasados++;
    fechaCorteReal.setMonth(fechaCorteReal.getMonth() + 1);
  }

  const pagoTemporal = { monto: Number(cliente.monto), metodo: "Efectivo", meses: 1, atrasados: mesesAtrasados };
  mostrarFactura(cliente, pagoTemporal);

  // Guardar la factura actual para usar en impresión
  facturaActual = { cliente, pago: pagoTemporal };
}

function mostrarFactura(cliente, pago) {
  facturaContenido.innerHTML = `
  ========================================
            HELADERÍA ROSARY
        Villa González, Santiago
         Tel: +1 (809) 790-4593
  ========================================
          RECIBO DE SERVICIOS
  ----------------------------------------
  Fecha: ${new Date().toLocaleDateString('es-ES')}
  Cliente: ${cliente.nombre}
  Teléfono: ${cliente.telefono || 'No disponible'}
  Servicio: ${cliente.servicio} ${cliente.tipoServicio ? '— ' + cliente.tipoServicio : ''}
  Monto: $${pago.monto.toFixed(2)}
  Meses: ${pago.meses}
  Método: ${pago.metodo}
  ${pago.atrasados > 0 ? `Meses atrasados: ${pago.atrasados}` : ''}
  Próximo Corte: ${cliente.fechaEntrada}
  ----------------------------------------
      ¡Gracias por preferirnos!
  ========================================`;
  modalFactura.style.display = "flex";

  // Re-configurar el botón imprimir para usar la factura actual y la impresión que guardará PDF + imprimirá directo
  btnImprimirPDF.onclick = async () => {
    if (!facturaActual) return alert("No hay factura cargada.");
    await imprimirFacturaDirecta(facturaActual.cliente, facturaActual.pago);
  };
}

btnCerrarFactura.onclick = () => modalFactura.style.display = "none";

// ===============================================
// Nueva función: imprimirFacturaDirecta
// Genera un ticket compacto con logo, imprime directo y guarda PDF
// ===============================================
async function imprimirFacturaDirecta(cliente, pago) {
  try {
    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString("es-DO");
    const horaStr = fecha.toLocaleTimeString("es-DO");

    // Convertir logo a base64 (para evitar errores de carga)
    async function getBase64Logo(path) {
      try {
        const response = await fetch(path);
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        return ""; // si falla, no interrumpe
      }
    }

    const logoBase64 = await getBase64Logo("logo rosary.jpg");

    // HTML del ticket compacto
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factura - ${cliente.nombre}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background: #fff;
          }
          .ticket {
            width: 74mm;
            margin: 0 auto;
            text-align: center;
            line-height: 1.3;
            padding: 4px 0;
          }
          .linea {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          img.logo {
            width: 100px;
            height: auto;
            display: block;
            margin: 0 auto 4px auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin: 0 auto;
          }
          td {
            padding: 2px 0;
            word-wrap: break-word;
          }
          .left { text-align: left; width: 40%; }
          .right { text-align: right; width: 60%; }
          .footer {
            margin-top: 8px;
            font-size: 9pt;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Rosary" class="logo">` : ""}
          <strong>HELADERÍA ROSARY</strong><br>
          Villa González - Santiago<br>
          Tel: +1 (809) 790-4593<br>
          <div class="linea"></div>
          <small>Fecha: ${fechaStr} — Hora: ${horaStr}</small><br>
          <div class="linea"></div>

          <table>
            <tr><td class="left">Cliente:</td><td class="right">${cliente.nombre}</td></tr>
            <tr><td class="left">Tel:</td><td class="right">${cliente.telefono || 'No disponible'}</td></tr>
            <tr><td class="left">Servicio:</td><td class="right">${cliente.servicio}${cliente.tipoServicio ? ' — ' + cliente.tipoServicio : ''}</td></tr>
            <tr><td class="left">Monto:</td><td class="right">RD$ ${pago.monto.toFixed(2)}</td></tr>
            <tr><td class="left">Meses:</td><td class="right">${pago.meses}</td></tr>
            ${pago.atrasados > 0 ? `<tr><td class="left">Atrasados:</td><td class="right">${pago.atrasados}</td></tr>` : ""}
          </table>

          <div class="linea"></div>
          <strong>TOTAL: RD$ ${pago.monto.toFixed(2)}</strong>
          <div class="linea"></div>

          <div class="footer">
            ¡Gracias por preferirnos!<br>
            ¡Vuelva pronto!
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 600);
          };
        </script>
      </body>
      </html>
    `;

    // Imprimir directamente (sin mostrar nada al usuario)
    const printWin = window.open('', '', 'width=400,height=600');
    printWin.document.open();
    printWin.document.write(ticketHTML);
    printWin.document.close();

    // 🧾 Generar copia PDF automática
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: [80, 120] });
      let y = 8;

      // Logo centrado
      if (logoBase64) {
        const logoW = 30;
        const centerX = 40 - (logoW / 2);
        doc.addImage(logoBase64, "JPEG", centerX, y, logoW, 20);
        y += 22;
      }

      // Encabezado
      doc.setFont("Courier", "bold");
      doc.setFontSize(11);
      doc.text("HELADERÍA ROSARY", 40, y, { align: "center" }); y += 6;
      doc.setFont("Courier", "normal");
      doc.setFontSize(8);
      doc.text("Villa González - Santiago", 40, y, { align: "center" }); y += 5;
      doc.text("Tel: +1 (809) 790-4593", 40, y, { align: "center" }); y += 6;
      doc.text("----------------------------------------", 40, y, { align: "center" }); y += 5;
      doc.text(`Fecha: ${fechaStr}  Hora: ${horaStr}`, 40, y, { align: "center" }); y += 6;
      doc.text("----------------------------------------", 40, y, { align: "center" }); y += 6;

      // Texto centrado y compacto
      doc.setFontSize(9);
      const textoCentrado = (texto) => {
        const textoAncho = doc.getTextWidth(texto);
        const x = (80 - textoAncho) / 2;
        doc.text(texto, x, y);
        y += 5;
      };

      textoCentrado(`Cliente: ${cliente.nombre}`);
      textoCentrado(`Tel: ${cliente.telefono || 'No disponible'}`);
      textoCentrado(`Servicio: ${cliente.servicio}${cliente.tipoServicio ? ' — ' + cliente.tipoServicio : ''}`);
      textoCentrado(`Monto: RD$ ${pago.monto.toFixed(2)}`);
      if (pago.atrasados > 0) textoCentrado(`Atrasados: ${pago.atrasados}`);
      textoCentrado("----------------------------------------");
      doc.setFont("Courier", "bold");
      textoCentrado(`TOTAL: RD$ ${pago.monto.toFixed(2)}`);
      doc.setFont("Courier", "normal");
      textoCentrado("¡Gracias por preferirnos!");
      textoCentrado("¡Vuelva pronto!");

      doc.internal.pageSize.height = y + 10;
      const nombreArchivo = `Factura_Rosary_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      doc.save(nombreArchivo);
    }

  } catch (e) {
    console.error("Error en imprimirFacturaDirecta:", e);
    alert("Ocurrió un error al intentar imprimir la factura.");
  }
}


// ===============================================
// 9. ESTADO DE CUENTA FUNCIONAL
// ===============================================
btnEstadoCuenta.onclick = () => modalEstadoCuenta.style.display = "flex";
btnCerrarEstadoCuenta.onclick = () => modalEstadoCuenta.style.display = "none";

btnFiltrarFechas.onclick = async () => {
  if (!fechaDesde.value || !fechaHasta.value)
    return alert("Selecciona un rango de fechas");

  const desde = new Date(fechaDesde.value.replace(/-/g, '/'));
  const hasta = new Date(fechaHasta.value.replace(/-/g, '/'));
  desde.setHours(0, 0, 0, 0);
  hasta.setHours(23, 59, 59, 999);

  await cargarClientes();
  estadoCuentaLista.innerHTML = "";
  let total = 0;

  const hoy = new Date();

  for (const cliente of clientes) {
    const fechaCorte = new Date(cliente.fechaEntrada.replace(/-/g, '/'));
    const monto = Number(cliente.monto);

    // Verifica si la fecha de corte está en el rango seleccionado
    if (fechaCorte >= desde && fechaCorte <= hasta) {
      // Calculamos diferencia de meses entre hoy y la fecha de corte
      const diffMeses =
        (hoy.getFullYear() - fechaCorte.getFullYear()) * 12 +
        (hoy.getMonth() - fechaCorte.getMonth());

      let estado = "";
      if (hoy < fechaCorte) {
        // Todavía no llegó el vencimiento
        const diasRestantes = Math.ceil(
          (fechaCorte - hoy) / (1000 * 60 * 60 * 24)
        );
        estado = `🟢 Al día (${diasRestantes} días restantes)`;
      } else if (diffMeses === 0) {
        // Vence este mes
        estado = "🟡 Pago vence este mes";
      } else if (diffMeses > 0) {
        // Vencido
        estado = `🔴 ${diffMeses} mes(es) vencido(s)`;
      }

      // Calcula si tiene pagos pendientes (basado en historial)
      let mesesPagados = 0;
      if (cliente.pagos && Array.isArray(cliente.pagos)) {
        mesesPagados = cliente.pagos.reduce(
          (acc, p) => acc + (p.mesesPagados || 1),
          0
        );
      }

      const mesesPendientes = diffMeses - mesesPagados;
      if (mesesPendientes > 0) {
        estado = `🟡 ${mesesPendientes} mes(es) pendiente(s) de pago`;
      } else if (mesesPendientes === 0 && diffMeses > 0) {
        estado = "🟢 Pagos al día";
      }

      estadoCuentaLista.innerHTML += `
        <div class="estado-cuenta-item">
          <p><strong>${cliente.nombre}</strong> — ${cliente.servicio}</p>
          <p>Monto mensual: $${monto.toFixed(2)}</p>
          <p>Próximo corte: ${fechaCorte.toLocaleDateString('es-ES')}</p>
          <p>Estado: ${estado}</p>
          <hr>
        </div>
      `;
      total += monto;
    }
  }

  totalCobrar.textContent = `💰 Total a cobrar: $${total.toFixed(2)}`;
};

// ===============================================
// 10. AGREGAR CLIENTE
// ===============================================
btnAgregar.onclick = () => {
  if (!nombre.value || !monto.value) return alert("Nombre y monto son obligatorios.");
  agregarCliente({
    nombre: nombre.value,
    correo: correo.value,
    telefono: telefono.value,
    fechaEntrada: fechaEntrada.value || new Date().toISOString().split("T")[0],
    monto: parseFloat(monto.value),
    servicio: servicio.value,
    tipoServicio: tipoServicioSelect ? tipoServicioSelect.value : undefined
  });
};

function limpiar() {
  nombre.value = correo.value = telefono.value = monto.value = "";
  fechaEntrada.value = "";
  servicio.value = "Netflix";
  if (tipoServicioSelect) tipoServicioSelect.value = "Televisión";
}

// ===============================================
// 11. BUSCADOR CLIENTES
// ===============================================
document.getElementById("btn-buscar").onclick = () => {
  const term = document.getElementById("buscador-input").value.toLowerCase();
  render(clientes.filter(c => c.nombre.toLowerCase().includes(term) || c.servicio.toLowerCase().includes(term) || (c.tipoServicio || '').toLowerCase().includes(term)));
};

// ===============================================
// 12. INICIALIZAR
// ===============================================
window.onload = cargarClientes;
