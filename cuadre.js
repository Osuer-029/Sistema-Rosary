// --- Configuraciones e Importaciones de Firebase (Usando tus datos) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// Tu configuración de la aplicación web
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
const db = getFirestore(app);

// ¡¡¡CLAVE!!! Usamos la colección de tu proyecto: "transacciones_financieras"
const MOVIMIENTOS_COLLECTION = "transacciones_financieras"; 
const movimientosRef = collection(db, MOVIMIENTOS_COLLECTION);
// --- FIN Configuración Firebase ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtención de Elementos del DOM
    const form = document.getElementById('formulario-transaccion');
    const listaMovimientos = document.getElementById('lista-movimientos');
    const valorTotalSpan = document.getElementById('valor-total');
    
    // Matriz local para almacenar temporalmente los movimientos cargados
    let movimientos = []; 
    
    // 2. Función para Actualizar el Balance
    const actualizarBalance = () => {
        let balance = 0;
        
        // Suma/Resta todos los montos para obtener el total
        movimientos.forEach(mov => {
            // Utilizamos el campo 'monto' y 'type' de tu estructura de datos
            const monto = parseFloat(mov.monto); 
            if (mov.type === 'ingreso') {
                balance += monto;
            } else if (mov.type === 'gasto') {
                balance -= monto;
            }
        });

        valorTotalSpan.textContent = `$${balance.toFixed(2)}`;
        valorTotalSpan.style.color = balance >= 0 ? '#28a745' : '#dc3545';
    };

    // 3. Función para Renderizar la Lista de Movimientos en el HTML
    const renderizarListaHTML = () => {
        listaMovimientos.innerHTML = ''; 
        
        movimientos.forEach((mov) => {
            const listItem = document.createElement('li');
            listItem.classList.add('movimiento-item');
            
            // Usamos el campo 'type' para el signo y el color
            const signo = mov.type === 'ingreso' ? '+' : '-';
            const claseMonto = mov.type === 'ingreso' ? 'ingreso-monto' : 'gasto-monto';
            
            // Usamos el campo 'concept' para la descripción
            listItem.innerHTML = `
                <span>${mov.concept || mov.descripcion || 'Sin concepto'}</span> 
                <span class="${claseMonto}">${signo} $${parseFloat(mov.monto).toFixed(2)}</span>
                <button onclick="eliminarMovimiento('${mov.id}')" class="btn-eliminar">X</button>
            `;
            
            listaMovimientos.appendChild(listItem);
        });
        
        actualizarBalance();
    };

    // 4. Listener en Tiempo Real con Firebase (onSnapshot)
    const escucharMovimientos = () => {
        // Consultamos la colección 'transacciones_financieras'
        const q = query(movimientosRef);

        onSnapshot(q, (snapshot) => {
            movimientos = []; // Resetear la lista
            
            snapshot.forEach((doc) => {
                // Guardamos los datos usando la estructura de tu proyecto
                movimientos.push({ ...doc.data(), id: doc.id }); 
            });

            console.log("Datos de 'transacciones_financieras' actualizados desde Firestore.");
            renderizarListaHTML(); 
        }, (error) => {
            console.error("Error al escuchar movimientos en Firestore:", error);
        });
    };
    
    // 5. Función para Manejar el Envío del Formulario (Guardar en Firebase)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // El formulario usa 'tipo-operacion' y 'descripcion' y 'monto'
        const tipo = document.getElementById('tipo-operacion').value;
        const concept = document.getElementById('descripcion').value; // Usamos 'concept' para la clave de Firebase
        const monto = parseFloat(document.getElementById('monto').value);

        if (!tipo || !concept || isNaN(monto) || monto <= 0) {
            console.error('Por favor, rellena todos los campos correctamente.');
            return;
        }

        // Creamos el objeto con la estructura de tu base de datos
        const nuevoMovimiento = {
            type: tipo, // 'ingreso' o 'gasto'
            concept: concept,
            monto: monto, 
            date: new Date().toISOString().slice(0, 10), // Formato 'YYYY-MM-DD'
            timestamp: new Date()
            // Podrías añadir 'origin': 'CuadreApp' si quieres diferenciarlo de tu proyecto principal
        };
        
        addDoc(movimientosRef, nuevoMovimiento)
            .then(() => {
                console.log("Movimiento agregado a Firestore exitosamente.");
                form.reset();
                document.getElementById('tipo-operacion').value = "";
            })
            .catch((error) => {
                console.error("Error al agregar documento: ", error);
            });
    });
    
    // 6. Función de Eliminar (Eliminar desde Firebase)
    window.eliminarMovimiento = (docId) => {
        const docRef = doc(db, MOVIMIENTOS_COLLECTION, docId); 
        
        deleteDoc(docRef)
            .then(() => {
                console.log(`Documento con ID ${docId} eliminado de Firestore.`);
            })
            .catch((error) => {
                console.error("Error al eliminar documento: ", error);
            });
    };

    // Iniciar la escucha de movimientos de Firebase al cargar la página
    escucharMovimientos();
});
