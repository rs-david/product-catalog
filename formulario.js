// Initialize Lucide icons
lucide.createIcons();

// Tags Management
const tagInput = document.getElementById('tagInput');
const tagsContainer = document.getElementById('tagsContainer');
const etiquetasInput = document.getElementById('etiquetas'); // Campo oculto para enviar las etiquetas al backend
let tags = [];

tagInput.addEventListener('keydown', function (e) {
    // Add Tag
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = this.value.trim();
        if (tag && !tags.includes(tag)) {
            addTag(tag);
            this.value = '';
        }
    }
    // Remove Last Tag on Backspace
    if (e.key === 'Backspace' && !this.value && tags.length > 0) {
        removeTag(tags.length - 1);
    }
});

function addTag(tag) {
    tags.push(tag);
    renderTags();
    updateEtiquetasInput();
}

function removeTag(index) {
    tags.splice(index, 1);
    renderTags();
    updateEtiquetasInput();
}

function renderTags() {
    tagsContainer.replaceChildren();

    const fragment = document.createDocumentFragment();
    tags.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium';
        tagElement.innerHTML = `
            <span>${tag}</span>
            <button type="button" onclick="removeTag(${index})" class="hover:text-indigo-900 focus:outline-none">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        fragment.append(tagElement);
    });

    tagsContainer.append(fragment);
    lucide.createIcons();
}

function updateEtiquetasInput() {
    etiquetasInput.value = tags.join(',');
}

// Image Preview
const imagenInput = document.getElementById('imagen');
const imagePreview = document.getElementById('imagePreview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const previewImg = imagePreview.querySelector('img');

imagenInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 1 * 1024 * 1024) {
            showToast('La imagen debe ser menor a 1MB', 'error');
            this.value = '';
            return;
        }

        // Mostrar preview de la imagen
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Margin Calculation
const costoInput = document.getElementById('costo');
const precioInput = document.getElementById('precio');
const margenPorcentaje = document.getElementById('margenPorcentaje');
const margenCantidad = document.getElementById('margenCantidad');

function calcularMargen() {
    const costo = parseFloat(costoInput.value) || 0;
    const precio = parseFloat(precioInput.value) || 0;

    if (costo > 0 && precio > 0) {
        const ganancia = precio - costo;
        const margen = (ganancia / costo) * 100;

        margenPorcentaje.textContent = margen.toFixed(1) + '%';
        margenCantidad.textContent = '$' + ganancia.toFixed(2);

        if (margen < 0) {
            margenPorcentaje.className = 'text-lg font-bold text-red-600';
            margenCantidad.className = 'text-sm font-medium text-red-600';
        } else if (margen < 20) {
            margenPorcentaje.className = 'text-lg font-bold text-amber-600';
            margenCantidad.className = 'text-sm font-medium text-amber-600';
        } else {
            margenPorcentaje.className = 'text-lg font-bold text-emerald-600';
            margenCantidad.className = 'text-sm font-medium text-emerald-600';
        }
    } else {
        margenPorcentaje.textContent = '0%';
        margenCantidad.textContent = '$0.00';
        margenPorcentaje.className = 'text-lg font-bold text-slate-400';
        margenCantidad.className = 'text-sm font-medium text-slate-400';
    }
}

costoInput.addEventListener('input', calcularMargen);
precioInput.addEventListener('input', calcularMargen);

// Modo edición
let editMode = false;
let editProductId = null;
let currentProduct = [];

// Verificar si venimos en modo edición desde el catálogo
const deleteBtn = document.querySelector('.delete-product');
window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        // Simular carga de producto (en producción vendría de la API/localStorage)
        const productos = JSON.parse(localStorage.getItem('productos') || '[]');
        const producto = productos.find(p => p.id == editId);

        if (producto) {
            editMode = true;
            editProductId = editId;
            currentProduct = producto;
            deleteBtn.classList.remove('hidden');
            cargarProductoEnFormulario(producto);
        }
    }
});

const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const btnSubmit = document.getElementById('btnSubmitText');
function cargarProductoEnFormulario(producto) {
    pageTitle.textContent = 'Editar Producto';
    pageSubtitle.textContent = `Modificando: ${producto.nombre}`;
    btnSubmit.textContent = 'Actualizar Producto';

    // Cargar campos
    document.getElementById('nombre').value = producto.nombre || '';
    document.getElementById('categoria').value = producto.categoria || '';
    document.getElementById('descripcion').value = producto.descripcion || '';
    document.getElementById('costo').value = producto.costo || '';
    document.getElementById('precio').value = producto.precio || '';
    document.getElementById('stock').value = producto.stock || '';

    // Cargar tags
    if (producto.etiquetas) {
        tags = Array.isArray(producto.etiquetas) ? producto.etiquetas : producto.etiquetas.split(',');
        renderTags();
    }

    // Cargar imagen preview si existe
    if (producto.url) {
        previewImg.src = producto.url;
        imagePreview.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');
    }

    calcularMargen();
}

// Form Submission
const productForm = document.getElementById('productForm');
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(productForm);
    formData.delete('imagen'); // eliminar campo imagen del formData ya que se maneja aparte
    const data = Object.fromEntries(formData.entries());
    data.etiquetas = tags;

    if (editMode) {
        data.id = editProductId;

        if (imagenInput.files.length > 0) {
            const imageUrl = await saveImageToCloudinary(imagenInput.files[0]);
            if (imageUrl.error) return showToast(imageUrl.error, 'error');
            data.url = imageUrl;
        } else {
            data.url = currentProduct.url; // mantener imagen actual si no se sube una nueva
        }

        const response = await fetch('updateProduct.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const resultado = await response.json();

        if (resultado.status === 'success') {
            showToast('Producto actualizado con éxito');
        } else {
            showToast('Error: ' + resultado.mensaje);
        }

        // Redirigir al catálogo después de un momento
        setTimeout(() => {
            window.location.href = 'catalogo.html';
        }, 1500);
    } else {
        const imageUrl = await saveImageToCloudinary(imagenInput.files[0]);
        if (imageUrl.error) return showToast(imageUrl.error, 'error');
        data.url = imageUrl;

        const resultado = await guardarProducto(data);
        if (resultado.error) return showToast(resultado.error, 'error');

        showToast('Producto guardado exitosamente');
        productForm.reset();
        resetForm();
    }
});

async function saveImageToCloudinary(file) {
    try {
        const CLOUD_NAME = "ddpbhed0r";
        const UPLOAD_PRESET = "my_preset";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Error al subir la imagen");

        const data = await response.json();
        const url = data.secure_url; // url de la imagen subida
        return url.replace('upload/', 'upload/f_auto,q_auto/'); // optimizar imagen

    } catch (error) {
        return { error: error.message };
    }
}

async function guardarProducto(data) {
    try {
        const response = await fetch('guardar_producto.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }

}

async function eliminarProducto() {
    // 1. Confirmación de seguridad
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch('eliminarProducto.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editProductId })
        });

        const resultado = await response.json();

        if (resultado.status === 'success') {
            showToast('Producto eliminado correctamente');
            setTimeout(() => {
                cancelarEdicion(); // Redirigir al catálogo
            }, 1500);
        } else {
            showToast('Error al eliminar: ' + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error en la petición:', error);
        showToast('Error al eliminar el producto');
    }
}

function cancelarEdicion() {
    window.location.href = 'catalogo.html';
}

function resetForm() {
    tags = [];
    renderTags();
    imagePreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    previewImg.src = '';
    calcularMargen();
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('.icon');

    toastMessage.textContent = message;

    if (type === 'error') {
        icon.className = 'icon w-5 h-5 text-red-400'; // arreglar color
        icon.dataset.lucide = 'alert-circle';
    } else {
        icon.className = 'icon w-5 h-5 text-emerald-400';
        icon.dataset.lucide = 'check-circle';
    }

    lucide.createIcons();

    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3500);
}

// Drag and drop para imagen
const dropZone = document.querySelector('.custom-file-input');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('bg-indigo-50', 'border-indigo-400');
}

function unhighlight(e) {
    dropZone.classList.remove('bg-indigo-50', 'border-indigo-400');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        imagenInput.files = files;
        const event = new Event('change');
        imagenInput.dispatchEvent(event);
    }
}