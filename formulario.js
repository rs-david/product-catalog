// Initialize Lucide Icons
lucide.createIcons();

const defaultImage = 'https://res.cloudinary.com/ddpbhed0r/image/upload/f_auto,q_auto/v1772048916/WhatsApp_Image_2025-08-20_at_12.57.43_PM_jfp2zw.jpg';

// Session Storage Utility
const ss = {
  save: (key, val) => sessionStorage.setItem(key, JSON.stringify(val)),
  get: (key) => JSON.parse(sessionStorage.getItem(key)),
  delete: (key) => sessionStorage.removeItem(key)
};

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

// Verificar si venimos en modo edición desde el catálogo
const deleteBtn = document.querySelector('.delete-product');
window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        const producto = ss.get('productoEnEdicion');
        if (producto) {
            editMode = true;
            editProductId = editId;
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

    // Deshabilitar botones y mostrar estado de guardado
    const actionButtons = productForm.querySelectorAll('.action-buttons button');
    const submitBtn = productForm.querySelector('button[type="submit"]');
    const submitBtnText = submitBtn.querySelector('.text');
    actionButtons.forEach(btn => btn.disabled = true);
    submitBtnText.innerText = "Guardando...";

    const formData = new FormData(productForm);
    formData.delete('imagen'); // eliminar campo imagen del formData ya que se maneja aparte
    const data = Object.fromEntries(formData.entries());
    data.etiquetas = tags;

    if (editMode) {
        data.id = editProductId;

        // Si se subió una nueva imagen, subirla a Cloudinary y obtener la URL.
        if (imagenInput.files.length > 0) {
            const imageUrl = await saveImageToCloudinary(imagenInput.files[0]);
            if (imageUrl.error) return showToast(imageUrl.error, 'error');
            data.url = imageUrl;
        } else {
            data.url = ss.get('productoEnEdicion').url || defaultImage;
        }

        // Enviar datos al backend para actualizar el producto
        const update = await updateProduct(data);
        if (update.error) return showToast(update.error, 'error');

        showToast('Producto actualizado exitosamente');

        // Redirigir al catálogo después de un momento
        setTimeout(() => {
            window.location.href = 'catalogo.html';
        }, 1500);

    } else {
        // Nuevo producto: subir imagen a Cloudinary si se seleccionó una, sino usar imagen por defecto
        if (imagenInput.files.length > 0) {
            const imageUrl = await saveImageToCloudinary(imagenInput.files[0]);
            if (imageUrl.error) return showToast(imageUrl.error, 'error');
            data.url = imageUrl;
        } else {
            data.url = defaultImage;
        }

        const saved = await guardarProducto(data);
        if (saved.error) return showToast(saved.error, 'error');

        showToast('Producto guardado exitosamente');

        setTimeout(() => {
            window.location.href = window.location.pathname;
        }, 1500);
    }

});

async function updateProduct(data) {
    try {
        const response = await fetch('updateProduct.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status !== 'success') throw new Error('Error al actualizar el producto');
    
        return result;
    } catch (error) {
        return { error: error.message };
    }
}

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

        const result = await response.json();

        if (result.status !== 'success') throw new Error('Error al guardar el producto');

        return result;
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
    pageTitle.textContent = 'Nuevo Producto';
    pageSubtitle.textContent = `Completa la información del producto para agregarlo al inventario`;
    btnSubmit.textContent = 'Guardar Producto';
    deleteBtn.classList.add('hidden');
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
