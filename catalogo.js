// Variables de estado
let productosMemory = [];
let productosFiltrados = [];
let estadoFiltro = 'todos';
let paginaActual = 1;
const productosPorPagina = 12;
let vistaActual = 'grid'; // 'grid' o 'list'
let productoEnEdicion = null;
let productoStockAjuste = null;
let tipoAjuste = 'add'; // 'add' o 'remove'
const etiquetasDisponibles = ['collar', 'anillo', 'pulsera', 'aretes', 'mujer', 'hombre', 'antiestrés'];
const etiquetasSeleccionadas = new Set();

async function obtenerProductos() {
    try {
        const response = await fetch('obtenerProductos.php');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    filtrarProductos();
});

// Generar Chips para Etiquetas
const contenedorChips = document.getElementById('contenedor-chips');

// Generar chips dinámicamente
etiquetasDisponibles.forEach(tag => {
    const chip = document.createElement('span');
    chip.innerText = tag;
    chip.className = "tag cursor-pointer px-3 py-1 rounded-full border border-gray-300 text-sm text-gray-600 transition-colors";

    chip.onclick = () => {
        if (etiquetasSeleccionadas.has(tag)) {
            etiquetasSeleccionadas.delete(tag);
            chip.classList.remove('bg-indigo-500', 'text-white', 'border-indigo-500');
            filtrarProductos();
        } else {
            etiquetasSeleccionadas.add(tag);
            chip.classList.add('bg-indigo-500', 'text-white', 'border-indigo-500');
            filtrarProductos();
        }
    };

    contenedorChips.appendChild(chip);
});

// Filtrar productos
const buscarProductosForm = document.getElementById('buscar-productos');
const searchNombreInput = document.getElementById('searchNombre');
const searchModeloInput = document.getElementById('searchModelo');
const filterCategoriaInput = document.getElementById('filterCategoria');
const sortByInput = document.getElementById('sortBy');

buscarProductosForm.onsubmit = (e) => {
    e.preventDefault();
    filtrarProductos();
}

async function filtrarProductos() {
    const nombre = searchNombreInput.value.toLowerCase();
    const modelo = searchModeloInput.value.toLowerCase();
    const categoria = filterCategoriaInput.value;
    const [sortBy, sortDir] = sortByInput.value ? sortByInput.value.split("-") : ['created_at', 'DESC'];
    const etiquetas = [...etiquetasSeleccionadas].join(',');

    const filtros = {
        nombre,
        categoria,
        modelo,
        etiquetas,
        sortBy,
        sortDir,
        limit: productosPorPagina,
    };

    // Convertimos el objeto a query string (ej: ?nombre=joya&categoria=anillos)
    const params = new URLSearchParams(filtros).toString();

    const response = await fetch(`filtrarProductos.php?${params}`);
    if (!response.ok) return mostrarToast('Error al filtrar productos', 'error');

    const productos = await response.json();
    productosMemory = productos;
    // paginaActual = 1;
    renderizarProductos(productos);
    // actualizarPaginacion();
    actualizarTextoTotal(productos);
}

function actualizarTextoTotal(productos) {
    const texto = productos.length === 1 ? '1 producto encontrado' : `${productos.length} productos encontrados`;
    document.getElementById('totalProductosText').textContent = texto;
}

// Renderizar productos
function renderizarProductos(productos) {
    const container = document.getElementById('productosContainer');
    container.replaceChildren();
    const emptyState = document.getElementById('emptyState');

    if (productos.length === 0) return emptyState.classList.remove('hidden');

    emptyState.classList.add('hidden');

    const cards = productos.map(producto => {

        const { stock, modelo, precio, categoria, url, nombre, etiquetas, id } = producto;

        return `
                <div data-product-id="${id}" class="product-card bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div class="relative h-55 bg-slate-100">
                        <img src="${url}" alt="${nombre}" class="w-full h-full object-cover">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <span class="text-white text-xs font-medium px-2 py-1 bg-black/30 rounded-full">
                                ${formatearCategoria(categoria)}
                            </span>
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-slate-900 mb-1 truncate" title="${nombre}">${nombre}</h3>
                        <p class="text-xs text-slate-500 mb-3">MOD: ${modelo}</p>
                        
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-lg font-bold text-indigo-600">$${Number(precio).toFixed(2)}</span>
                            <span class="stock text-sm text-slate-500">${stock} unidades</span>
                        </div>

                        <div class="flex flex-wrap gap-1 mb-4">
                            ${etiquetas.slice(0, 3).map(tag => `
                                <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">#${tag}</span>
                            `).join('')}
                            ${etiquetas.length > 3 ? `<span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">+${etiquetas.length - 3}</span>` : ''}
                        </div>

                        <div class="grid grid-cols-3 gap-2 h-12">
                            <button onclick="abrirEditModal(${id})" class="flex items-center justify-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors" title="Editar">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="abrirStockModal(${id}, 'add')" class="flex items-center justify-center px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors" title="Aumentar Stock">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                            <button onclick="abrirStockModal(${id}, 'remove')" class="flex items-center justify-center px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors" title="Disminuir Stock">
                                <i data-lucide="minus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
    }).join('');

    container.insertAdjacentHTML('beforeend', cards);

    lucide.createIcons();
    // actualizarInfoPaginacion(inicio, fin);
}

function formatearCategoria(cat) {
    const categorias = {
        'joyeria': 'Joyería',
        'accesorios': 'Accesorios',
        'juguetes': 'Juguetes',
        'regalos': 'Regalos',
        'ropa': 'Ropa',
        'otro': 'Otro'
    };
    return categorias[cat] || cat;
}

// Paginación (Checar Despues)
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const numbers = document.getElementById('paginationNumbers');

    btnPrev.disabled = paginaActual === 1;
    btnNext.disabled = paginaActual === totalPaginas || totalPaginas === 0;

    let html = '';
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
            const active = i === paginaActual ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300';
            html += `<button onclick="irPagina(${i})" class="w-8 h-8 rounded-lg text-sm font-medium ${active}">${i}</button>`;
        } else if (i === paginaActual - 2 || i === paginaActual + 2) {
            html += `<span class="px-2 text-slate-400">...</span>`;
        }
    }
    numbers.innerHTML = html;
}

function actualizarInfoPaginacion(inicio, fin) {
    document.getElementById('showingStart').textContent = productosFiltrados.length > 0 ? inicio + 1 : 0;
    document.getElementById('showingEnd').textContent = Math.min(fin, productosFiltrados.length);
    document.getElementById('showingTotal').textContent = productosFiltrados.length;
}

function cambiarPagina(direccion) {
    paginaActual += direccion;
    renderizarProductos();
    actualizarPaginacion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function irPagina(pagina) {
    paginaActual = pagina;
    renderizarProductos();
    actualizarPaginacion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Filtros
function limpiarFiltros() {
    buscarProductosForm.reset();
    contenedorChips.querySelectorAll('.tag').forEach(chip => chip.classList.remove('bg-indigo-500', 'text-white', 'border-indigo-500'));
    etiquetasSeleccionadas.clear();
    sortByInput.value = 'created_at-desc';
    filtrarProductos();
}

const ss = {
  save: (key, val) => sessionStorage.setItem(key, JSON.stringify(val)),
  get: (key) => JSON.parse(sessionStorage.getItem(key)),
  delete: (key) => sessionStorage.removeItem(key)
};

// Redirección a formulario de edición completo
function abrirEditModal(id) {
    // Guardar en localStorage temporalmente para persistencia entre páginas
    const producto = productosMemory.find(p => Number(p.id) === Number(id));
    if (producto) {
        ss.save('productoEnEdicion', producto);
    }
    // Redirigir al formulario con parámetro de edición
    window.location.href = `index.html?edit=${id}`;
}

// Stock Modal
const stockModal = document.getElementById('stockModal');
const smProductName = stockModal.querySelector('#stockProductName');
const smCurrentStock = stockModal.querySelector('#currentStock');
const smActionType = stockModal.querySelector('#stockActionType');
const smAdjustAmount = stockModal.querySelector('#stockAdjustAmount');

function abrirStockModal(id, tipo) {
    productoStockAjuste = productosMemory.find(p => p.id === id);
    if (!productoStockAjuste) return;

    tipoAjuste = tipo;
    smProductName.textContent = productoStockAjuste.nombre;
    smCurrentStock.textContent = productoStockAjuste.stock;
    smActionType.textContent = tipo === 'add' ? 'AÑADIR' : 'DISMINUIR';
    smActionType.className = tipo === 'add' ? 'text-emerald-600' : 'text-amber-600';
    smAdjustAmount.value = 1;

    stockModal.classList.remove('hidden');
    stockModal.classList.add('flex');
}

function cerrarStockModal() {
    stockModal.classList.add('hidden');
    stockModal.classList.remove('flex');
    productoStockAjuste = null;
}

// Entender Después
function adjustStockInput(delta) {
    const input = smAdjustAmount;
    const newValue = Number(input.value) + delta;
    if (newValue >= 1) input.value = newValue;
}

async function actualizarStock(idProducto, cantidad) {
    const datos = {
        id: idProducto,
        cambio: cantidad // Ejemplo: -1 para una venta, 5 para reposición
    };

    try {
        const response = await fetch('updateStock.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (resultado.status === 'success') {
            return resultado.nuevo_stock;
        } else {
            return { error: resultado.mensaje || 'Error desconocido al actualizar stock' };
        }
    } catch (error) {
        console.error('Error en la petición:', error);
        return { error: 'Error de red al actualizar stock' };
    }
}

async function confirmarAjusteStock() {
    if (!productoStockAjuste) return;

    const cantidad = tipoAjuste === 'add' ? parseInt(smAdjustAmount.value) : -parseInt(smAdjustAmount.value);

    const newStock = await actualizarStock(productoStockAjuste.id, cantidad);

    if (newStock && !newStock.error) {
        mostrarToast(`Stock actualizado: ${newStock} unidades`);
        const card = document.querySelector(`.product-card[data-product-id="${productoStockAjuste.id}"]`);
        if (card) {
            const stockSpan = card.querySelector('.stock');
            stockSpan.textContent = `${newStock} unidades`;
        }

        productosMemory.find(p => Number(p.id) === Number(productoStockAjuste.id)).stock = newStock;
    } else {
        mostrarToast(`Error al actualizar stock: ${newStock.error}`, 'error');
    }
    cerrarStockModal();
}

// Toast notification
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    const icon = tipo === 'success' ? 'check-circle' : 'alert-circle';
    const color = tipo === 'success' ? 'emerald' : 'red';

    toast.className = `fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 transform translate-y-0 transition-all duration-300`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 text-${color}-400"></i>
        <span class="font-medium">${mensaje}</span>
    `;

    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Cerrar modales con ESC
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cerrarStockModal();
    }
});
