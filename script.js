// ================================
// IndexedDB Helpers (DB v2: productos, facturas, recibos)
// ================================
let db;
const DB_NAME = "heladeriaDB";
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains("productos")) {
        db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("facturas")) {
        db.createObjectStore("facturas", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("recibos")) {
        db.createObjectStore("recibos", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

function getStore(storeName, mode = "readonly") {
  if (!db) throw new Error("IndexedDB no está inicializada. Llama a openDB() primero.");
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

// ================================
// CRUD Productos
// ================================
function addProducto(producto) {
  return new Promise((resolve, reject) => {
    const store = getStore("productos", "readwrite");
    const req = store.add(producto);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function updateProducto(id, producto) {
  return new Promise((resolve, reject) => {
    const store = getStore("productos", "readwrite");
    producto.id = id;
    const req = store.put(producto);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function deleteProducto(id) {
  return new Promise((resolve, reject) => {
    const store = getStore("productos", "readwrite");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllProductos() {
  return new Promise((resolve, reject) => {
    const store = getStore("productos");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

// ================================
// CRUD Facturas
// ================================
function addFactura(factura) {
  return new Promise((resolve, reject) => {
    const store = getStore("facturas", "readwrite");
    const req = store.add(factura);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllFacturas() {
  return new Promise((resolve, reject) => {
    const store = getStore("facturas");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

// ================================
// CRUD Recibos
// ================================
function addRecibo(recibo) {
  return new Promise((resolve, reject) => {
    const store = getStore("recibos", "readwrite");
    const req = store.add(recibo);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllRecibos() {
  return new Promise((resolve, reject) => {
    const store = getStore("recibos");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

// ================================
// Referencias DOM (se asume script incluido al final del body)
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
const inputCliente = document.getElementById("factura-cliente");
const btnBorrarCliente = document.getElementById("btn-borrar-cliente");
const metodoBtns = document.querySelectorAll(".btn-metodo");

let metodoSeleccionado = "Efectivo"; // valor por defecto


// ================================
// Estado local
// ================================
let productos = [];
let editId = null;
let productoAEliminar = null;
let productosSeleccionados = [];

// ================================
// Utiles
// ================================
function toBase64(file) {
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = err=>reject(err);
  });
}

// ================================
// Cargar / Mostrar Productos
// ================================
async function cargarProductos() {
  productos = await getAllProductos();
  mostrarProductos(productos);
}

function mostrarProductos(lista) {
  listaProductos.innerHTML = "";
  lista.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("producto");
    div.innerHTML = `
      <img src="${p.imagen || ''}" alt="${p.nombre || ''}">
      <h3>${p.nombre || ''}</h3>
      <p>${p.descripcion || ''}</p>
      <p>RD$ ${Number(p.precio).toFixed(2)}</p>
      <p>Stock: ${p.stock}</p>
      <div>
        <button class="btn-editar">Editar</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    // click general abre facturación (si no se clickea editar/eliminar)
    div.addEventListener("click", e => {
      if (!e.target.classList.contains("btn-editar") && !e.target.classList.contains("btn-eliminar")) {
        abrirFacturacion(p);
      }
    });

    // Editar
    const btnEditar = div.querySelector(".btn-editar");
    btnEditar.addEventListener("click", e => {
      e.stopPropagation();
      editId = p.id;
      document.getElementById("nombre").value = p.nombre || "";
      document.getElementById("descripcion").value = p.descripcion || "";
      document.getElementById("precio").value = p.precio;
      document.getElementById("stock").value = p.stock;
      modalAgregar.style.display = "flex";
    });

    // Eliminar
    const btnEliminar = div.querySelector(".btn-eliminar");
    btnEliminar.addEventListener("click", e => {
      e.stopPropagation();
      productoAEliminar = p;
      modalConfirmar.style.display = "flex";
    });

    listaProductos.appendChild(div);
  });
}

// ================================
// Modal Agregar Producto
// ================================
btnAbrirAgregar.addEventListener("click", () => {
  editId = null;
  document.getElementById("nombre").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("imagen").value = "";
  modalAgregar.style.display = "flex";
});

btnCerrarAgregar.addEventListener("click", () => modalAgregar.style.display = "none");
btnCancelarAgregar.addEventListener("click", () => modalAgregar.style.display = "none");

btnAgregar.addEventListener("click", async () => {
  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const stock = parseInt(document.getElementById("stock").value);
  const file = document.getElementById("imagen").files[0];

  if (!precio || isNaN(precio) || !stock || isNaN(stock)) {
    alert("Debe ingresar precio y stock obligatoriamente");
    return;
  }

  let imagenBase64 = "";
  if (file) {
    imagenBase64 = await toBase64(file);
  }

  const productoData = { nombre, descripcion, precio, stock, imagen: imagenBase64 };

  if (editId) {
    await updateProducto(editId, productoData);
  } else {
    await addProducto(productoData);
  }

  modalAgregar.style.display = "none";
  await cargarProductos();
});

// ================================
// Eliminar Producto
// ================================
btnConfirmarSi.addEventListener("click", async () => {
  if (productoAEliminar) {
    await deleteProducto(productoAEliminar.id);
    productoAEliminar = null;
    await cargarProductos();
  }
  modalConfirmar.style.display = "none";
});

btnConfirmarNo.addEventListener("click", () => {
  productoAEliminar = null;
  modalConfirmar.style.display = "none";
});

// ================================
// Facturación (carrito simple y modal)
// ================================
function abrirFacturacion(producto) {
  productosSeleccionados.push(producto);
  mostrarFactura();
  modalFacturacion.style.display = "flex";
}

function mostrarFactura() {
  const panel = modalFacturacion.querySelector(".fact-panel");
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
      <p><strong>${p.nombre}</strong></p>
      <p>${p.descripcion || ""}</p>
      <p>RD$ ${Number(p.precio).toFixed(2)}</p>
      <button data-index="${i}" class="btn-quitar">❌ Quitar</button>
    `;

    lista.appendChild(item);
  });

  const totalDiv = document.createElement("div");
  totalDiv.classList.add("total");
  totalDiv.textContent = `Total: RD$ ${total.toFixed(2)}`;
  lista.appendChild(totalDiv);

  const btnMas = document.createElement("button");
  btnMas.textContent = "➕ Agregar más productos";
  btnMas.classList.add("btn-mas");
  btnMas.addEventListener("click", () => {
    modalFacturacion.style.display = "none";
  });
  lista.appendChild(btnMas);

  panel.appendChild(lista);

  lista.querySelectorAll(".btn-quitar").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = Number(e.target.dataset.index);
      productosSeleccionados.splice(idx, 1);
      mostrarFactura();
    });
  });
}

btnCerrarFactura.addEventListener("click", () => {
  modalFacturacion.style.display = "none";
});
btnCancelarFactura.addEventListener("click", () => {
  modalFacturacion.style.display = "none";
  productosSeleccionados = [];
});

// Facturar: pedir cliente y método (prompt) — luego guardar factura y crear recibo
btnFacturar.addEventListener("click", async () => {
  if (productosSeleccionados.length === 0) {
    alert("No hay productos seleccionados.");
    return;
  }

  const total = productosSeleccionados.reduce((acc, p) => acc + Number(p.precio), 0);
  const numeroFactura = "FAC-" + Date.now();
  const fechaFactura = new Date().toLocaleString("es-DO");

  // Pedir datos al cajero (prompt simple). Si quieres reemplazar por inputs en modal, lo hacemos.
  const cliente = inputCliente.value.trim() || "Consumidor Final";
  const metodoPago = metodoSeleccionado;


  const facturaObj = {
    numeroFactura,
    fechaFactura,
    productos: productosSeleccionados,
    total,
    cliente,
    metodoPago
  };

  await addFactura(facturaObj);

  // También guardamos un recibo de caja automático para este pago
  const reciboObj = {
    fecha: fechaFactura,
    cliente,
    monto: total,
    concepto: `Pago factura ${numeroFactura}`,
    origenFactura: numeroFactura
  };
  await addRecibo(reciboObj);

  // Imprimir factura
  imprimirFactura(facturaObj);

  // Imprimir también un recibo de caja (ventana separada)
  imprimirRecibo(reciboObj);

  productosSeleccionados = [];
  modalFacturacion.style.display = "none";
});

// ================================
// Recibo de Caja (modal manual)
// ================================
btnRecibo.addEventListener("click", () => {
  // limpiar campos
  document.getElementById("recibo-cliente").value = "";
  document.getElementById("recibo-monto").value = "";
  document.getElementById("recibo-concepto").value = "";
  modalRecibo.style.display = "flex";
});

btnCerrarRecibo.addEventListener("click", () => modalRecibo.style.display = "none");
btnCancelarRecibo.addEventListener("click", () => modalRecibo.style.display = "none");

btnGuardarRecibo.addEventListener("click", async () => {
  const cliente = document.getElementById("recibo-cliente").value.trim();
  const monto = parseFloat(document.getElementById("recibo-monto").value);
  const concepto = document.getElementById("recibo-concepto").value.trim();

  if (!cliente || isNaN(monto)) {
    alert("Debe completar el cliente y el monto.");
    return;
  }

  const recibo = {
    fecha: new Date().toLocaleString("es-DO"),
    cliente,
    monto,
    concepto
  };

  await addRecibo(recibo);
  modalRecibo.style.display = "none";
  alert("✅ Recibo guardado correctamente");
  await cargarHistorial(); // actualizar historial visible
});

// ================================
// Historial (facturas + recibos) — render estilizado
// ================================
async function cargarHistorial() {
  listaFacturasContainer.innerHTML = "";
  listaRecibosContainer.innerHTML = "";

  const facturas = await getAllFacturas();
  const recibos = await getAllRecibos();

  // Encabezados
  listaFacturasContainer.innerHTML = `<h3>📜 Facturas</h3>`;
  listaRecibosContainer.innerHTML = `<h3>💵 Recibos de Caja</h3>`;

  if (!facturas.length) {
    listaFacturasContainer.innerHTML += `<p>No hay facturas registradas.</p>`;
  } else {
    facturas.sort((a,b) => (a.numeroFactura < b.numeroFactura ? 1 : -1)); // recientes arriba
    facturas.forEach(f => {
      const div = document.createElement("div");
      div.classList.add("item-historial");
      const totalFormatted = Number(f.total).toFixed(2);
      div.innerHTML = `
        <div style="flex:1">
          <p><strong>${f.numeroFactura}</strong> <span style="color:#666">- ${f.fechaFactura}</span></p>
          <p style="margin-top:6px"><strong>Cliente:</strong> ${f.cliente || "Consumidor Final"} • <strong>Método:</strong> ${f.metodoPago || "-"}</p>
          <p style="margin-top:6px"><strong>Total:</strong> RD$ ${totalFormatted}</p>
        </div>
        <div class="acciones-historial">
          <button class="btn-ver">Ver</button>
          <button class="btn-recibo">Recibo</button>
        </div>
      `;

      // listeners
      div.querySelector(".btn-ver").addEventListener("click", () => imprimirFactura(f));
      div.querySelector(".btn-recibo").addEventListener("click", () => imprimirRecibo(f));

      listaFacturasContainer.appendChild(div);
    });
  }

  if (!recibos.length) {
    listaRecibosContainer.innerHTML += `<p>No hay recibos registrados.</p>`;
  } else {
    // orden descendente por id o fecha
    recibos.sort((a,b) => (b.id || 0) - (a.id || 0));
    recibos.forEach(r => {
      const div = document.createElement("div");
      div.classList.add("item-historial");
      div.innerHTML = `
        <div style="flex:1">
          <p><strong>Cliente:</strong> ${r.cliente} <span style="color:#666">- ${r.fecha}</span></p>
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
}

// Cerrar / Abrir historial
btnHistorial.addEventListener("click", async () => {
  await cargarHistorial();
  modalHistorial.style.display = "flex";
});
btnCerrarHistorial.addEventListener("click", () => {
  modalHistorial.style.display = "none";
});

// ================================
// Imprimir Factura (obj factura)
// ================================
function imprimirFactura(f) {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>${f.numeroFactura}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
        .factura { width: 320px; border: 3px solid #009688; padding: 15px; box-sizing: border-box; margin:auto; }
        .factura h1 { color: #009688; text-align:center; margin:0 0 8px 0; }
        .factura p { margin: 4px 0; font-size: 0.95rem; }
        .producto-cuadro { width:100%; border-top:1px dashed #ccc; padding:6px 0; }
        .total { text-align:right; font-weight:bold; margin-top:8px; }
      </style>
    </head>
    <body>
      <div class="factura">
        <h1>Heladería Rosary</h1>
        <p>Tel: 809-XXX-XXXX</p>
        <p>Dirección: Santo Domingo, RD</p>
        <hr>
        <p><strong>No. Factura:</strong> ${f.numeroFactura}</p>
        <p><strong>Fecha:</strong> ${f.fechaFactura}</p>
        <p><strong>Cliente:</strong> ${f.cliente || "Consumidor Final"}</p>
        <p><strong>Método:</strong> ${f.metodoPago || "-"}</p>
        <hr>
        ${f.productos.map(p => `
          <div class="producto-cuadro">
            <p><strong>${p.nombre || ''}</strong></p>
            <p>${p.descripcion || ''}</p>
            <p>RD$ ${Number(p.precio).toFixed(2)}</p>
          </div>
        `).join("")}
        <div class="total">Total: RD$ ${Number(f.total).toFixed(2)}</div>
        <hr>
        <p style="text-align:center; font-style:italic;">¡Muchas gracias por su compra!</p>
      </div>
    </body>
    </html>
  `);
  printWindow.print();
  printWindow.close();
}

// ================================
// Imprimir Recibo (detecta factura o recibo)
// ================================
function imprimirRecibo(obj) {
  // Si el objeto tiene numeroFactura => es una factura (crear recibo resumido)
  let isFactura = Boolean(obj && obj.numeroFactura);
  let titulo = isFactura ? `Recibo - ${obj.numeroFactura}` : `Recibo de Caja`;
  let cliente = isFactura ? (obj.cliente || "Consumidor Final") : (obj.cliente || "");
  let fecha = isFactura ? (obj.fechaFactura || "") : (obj.fecha || "");
  let monto = isFactura ? Number(obj.total).toFixed(2) : Number(obj.monto).toFixed(2);
  let metodo = isFactura ? (obj.metodoPago || "") : "";
  let concepto = isFactura ? `Pago factura ${obj.numeroFactura}` : (obj.concepto || "");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>${titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .recibo { width: 320px; border: 2px solid #000; padding: 12px; margin:auto; box-sizing:border-box; }
        h2 { text-align:center; margin:0 0 8px 0; }
        p { margin: 6px 0; font-size: 14px; }
        .firmas { margin-top: 16px; }
        .firmas div { margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="recibo">
        <h2>Recibo de Caja</h2>
        ${isFactura ? `<p><strong>No. Factura:</strong> ${obj.numeroFactura}</p>` : ""}
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        ${metodo ? `<p><strong>Método de pago:</strong> ${metodo}</p>` : ""}
        ${concepto ? `<p><strong>Concepto:</strong> ${concepto}</p>` : ""}
        <hr>
        <p><strong>Monto recibido:</strong> RD$ ${monto}</p>
        <div class="firmas">
          <div>Firma Cajero: ____________________</div>
          <div>Firma Cliente: ___________________</div>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.print();
  printWindow.close();
}

// ================================
// Buscador productos
// ================================
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();
  const filtrados = productos.filter(p => (p.nombre || "").toLowerCase().includes(texto));
  mostrarProductos(filtrados);
});

// ================================
// Inicializar DB y cargar datos al inicio
// ================================
openDB()
  .then(async () => {
    await cargarProductos();
    // cargarHistorial no necesariamente al inicio pero lo dejamos listo
    // await cargarHistorial();
  })
  .catch(err => {
    console.error("Error abriendo IndexedDB:", err);
    alert("Error al inicializar la base de datos. Revisa la consola.");
  });

// Nota: los estilos del historial y botones deben agregarse en style.css
// (usa .item-historial, .acciones-historial, .btn-ver, .btn-recibo, #btn-cerrar-historial, etc.)
