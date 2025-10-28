// inventario.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
    getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBuKs7Nr9oDi1BTkuLm2acYdJv3XWxCQN8",
  authDomain: "sistema-anthony-26b3a.firebaseapp.com",
  projectId: "sistema-anthony-26b3a",
  storageBucket: "sistema-anthony-26b3a.firebasestorage.app",
  messagingSenderId: "529902521245",
  appId: "1:529902521245:web:e6326ce36eb31497fa3d74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const inventarioCol = collection(db, "inventario");

// SELECTORES UI
const form = document.getElementById("formProducto");
const codigoInput = document.getElementById("codigoBarra");
const nombreInput = document.getElementById("nombreProducto");
const precioInput = document.getElementById("precioProducto");
const costoInput = document.getElementById("costoProducto");
const imagenInput = document.getElementById("imagenProducto");
const previewImg = document.getElementById("previewImg");
const previewText = document.getElementById("previewText");
const toast = document.getElementById("toast");
const limpiarBtn = document.getElementById("limpiarForm");
const grid = document.getElementById("gridProductos");
const totalProductosEl = document.getElementById("totalProductos");
const productosBajosEl = document.getElementById("productosBajos");

// ESTADO
let editingId = null;
let lastSnapshotUnsub = null;

// ----------------------
// HELPERS
// ----------------------
function showToast(msg, timeout=3000){
    toast.textContent = msg;
    toast.style.display = "block";
    toast.style.opacity = "1";
    setTimeout(()=> {
        toast.style.opacity = "0";
        setTimeout(()=> toast.style.display="none",220);
    }, timeout);
}

function resetForm(){
    form.reset();
    previewImg.style.display = "none";
    previewImg.src = "";
    previewText.textContent = "Sin imagen";
    editingId = null;
    codigoInput.focus();
}

function escapeHtml(s){
    if(!s) return "";
    return String(s).replace(/[&<>"'`=\/]/g, function (c) {
        return ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;','/':'&#x2F;','`':'&#x60','=':'&#x3D;'}[c]);
    });
}

// ----------------------
// VISTA PREVIA DE IMAGEN
// ----------------------
imagenInput.addEventListener("change", () => {
    const file = imagenInput.files[0];
    if(!file){
        previewImg.style.display = "none";
        previewText.textContent = "Sin imagen";
        return;
    }
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.style.display = "block";
    previewText.textContent = file.name;
});

// LIMPIAR FORM
limpiarBtn.addEventListener("click", (e)=>{
    e.preventDefault();
    resetForm();
});

// ----------------------
// SUBIR IMAGEN A STORAGE
// ----------------------
async function subirImagen(file, codigo){
    if(!file) return null;
    try{
        const path = `productos/${codigo}-${Date.now()}-${file.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        return { url, path };
    }catch(err){
        console.error("Error al subir imagen:", err);
        showToast("Error al subir imagen. Revisa la consola.", 5000);
        return null;
    }
}

// ----------------------
// GUARDAR PRODUCTO
// ----------------------
form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const codigo = codigoInput.value.trim();
    const nombre = nombreInput.value.trim();
    const precio = Number(precioInput.value) || 0;
    const costo = Number(costoInput.value) || 0;
    const imagenFile = imagenInput.files[0] || null;

    if(!codigo || !nombre){
        showToast("Completa código y nombre");
        return;
    }

    try{
        showToast("Guardando...",1200);

        let imagenUrl = "";
        if(imagenFile){
            const res = await subirImagen(imagenFile, codigo);
            imagenUrl = res ? res.url : "";
        }

        if(editingId){
            const docRef = doc(db, "inventario", editingId);
            const payload = { codigo, nombre, precio, costo, updatedAt: serverTimestamp() };
            if(imagenUrl) payload.imagen = imagenUrl;
            await updateDoc(docRef, payload);
            showToast("Producto actualizado");
            resetForm();
            return;
        }

        await addDoc(inventarioCol, {
            codigo, nombre, precio, costo, imagen: imagenUrl,
            createdAt: serverTimestamp()
        });
        showToast("Producto agregado correctamente");
        resetForm();

    }catch(err){
        console.error("Error al guardar producto:", err);
        showToast("Error al guardar producto.");
    }
});

// ----------------------
// CREAR CARD
// ----------------------
function crearCard(id, data){
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = id;
    card.innerHTML = `
        <div class="imgwrap">
            <img src="${data.imagen || 'https://via.placeholder.com/400x300?text=Sin+imagen'}" alt="${data.nombre}">
        </div>
        <div class="meta">
            <div>
                <div class="title">${escapeHtml(data.nombre)}</div>
                <div class="muted">Código: ${escapeHtml(data.codigo)}</div>
            </div>
            <div style="text-align:right">
                <div class="price">$${Number(data.precio).toFixed(2)}</div>
                <div class="muted" style="font-size:12px">Costo $${Number(data.costo).toFixed(2)}</div>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <div class="muted" style="font-size:12px">ID: ${id.slice(0,7)}</div>
            <div style="display:flex;gap:8px">
                <button class="btnEditar" title="Editar"><span class="material-icons">edit</span></button>
                <button class="btnEliminar" title="Eliminar"><span class="material-icons">delete</span></button>
            </div>
        </div>
    `;

    card.querySelector(".btnEditar").addEventListener("click", ()=>{
        editingId = id;
        codigoInput.value = data.codigo || "";
        nombreInput.value = data.nombre || "";
        precioInput.value = data.precio || "";
        costoInput.value = data.costo || "";
        if(data.imagen){
            previewImg.src = data.imagen;
            previewImg.style.display = "block";
            previewText.textContent = "Imagen actual";
        }else{
            previewImg.style.display = "none";
            previewText.textContent = "Sin imagen";
        }
        codigoInput.focus();
        window.scrollTo({top:0, behavior:"smooth"});
    });

    card.querySelector(".btnEliminar").addEventListener("click", async ()=>{
        if(!confirm(`Eliminar "${data.nombre}"? Esta acción no puede deshacerse.`)) return;
        try{
            await deleteDoc(doc(db, "inventario", id));
            showToast("Producto eliminado");
        }catch(err){
            console.error(err);
            showToast("Error al eliminar producto");
        }
    });

    return card;
}

// ----------------------
// ESCUCHAR INVENTARIO EN TIEMPO REAL
// ----------------------
function escucharInventario(){
    if(lastSnapshotUnsub) lastSnapshotUnsub();
    const q = query(inventarioCol);

    lastSnapshotUnsub = onSnapshot(q, snapshot=>{
        grid.innerHTML = "";
        let total = 0, bajos = 0;

        snapshot.forEach(docSnap=>{
            total++;
            const data = docSnap.data();
            const card = crearCard(docSnap.id, data);
            grid.appendChild(card);

            if(typeof data.stock === "number" && data.stock < 5) bajos++;
        });

        totalProductosEl.textContent = total;
        productosBajosEl.textContent = bajos;
    }, err=>{
        console.error("Error al escuchar inventario:", err);
        showToast("Error al cargar inventario");
    });
}

// ----------------------
// INICIALIZAR
// ----------------------
document.addEventListener("DOMContentLoaded", ()=>{
    escucharInventario();
    showToast("Módulo de inventario activo",1500);
    codigoInput.focus();
});
