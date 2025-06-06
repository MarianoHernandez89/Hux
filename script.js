const productosDiv = document.getElementById('productos');
const listaCarrito = document.getElementById('lista-carrito');
const totalDiv = document.getElementById('total');
const btnVaciar = document.getElementById('vaciar-carrito');
const filtroMarca = document.getElementById('filtroMarca');

const modal = document.getElementById('modalProducto');
const cerrarModalBtn = document.getElementById('cerrarModal');
const modalImagen = document.getElementById('modalImagen');
const modalNombre = document.getElementById('modalNombre');
const modalPrecio = document.getElementById('modalPrecio');
const selectTalle = document.getElementById('selectTalle');
const btnAgregarModal = document.getElementById('btnAgregarModal');
const btnEnviarPedido = document.getElementById('btnEnviarPedido');

const iconoCarrito = document.getElementById('iconoCarrito');
const contadorCarrito = document.getElementById('contadorCarrito');

let productos = [];
let carrito = [];

let productoSeleccionado = null;

// Funciones para agregar/remover clase que bloquea scroll al body
function bloquearScroll() {
  document.body.classList.add('modal-open');
}

function desbloquearScroll() {
  // Solo desbloquea si ni modal ni carrito están visibles
  if ((modal.style.display === 'none' || modal.style.display === '') &&
      (document.getElementById('carrito').style.display === 'none' || document.getElementById('carrito').style.display === '')) {
    document.body.classList.remove('modal-open');
  }
}

// Carga productos desde Google Sheets
async function cargarProductos() {
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1Vr9NIBycu6ucBu9urp4GgvZm6WmaRcHFoFBV2N0wgtc/gviz/tq?tqx=out:json');
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    productos = json.table.rows.map(row => {
      const c = row.c;
      return {
        id: parseInt(c[0]?.v),
        nombre: c[1]?.v || '',
        marca: c[2]?.v || '',
        precio: parseFloat(c[3]?.v) || 0,
        imagen: c[4]?.v || '',
        talles: (c[5]?.v || '').split(',').map(t => t.trim())
      };
    });
    cargarMarcas();
    mostrarProductos();
  } catch (error) {
    productosDiv.textContent = 'Error al cargar productos desde la planilla: ' + error.message;
    console.error(error);
  }
}

// Carga marcas únicas en el filtro
function cargarMarcas() {
  const marcas = Array.from(new Set(productos.map(p => p.marca))).sort();
  marcas.forEach(marca => {
    const option = document.createElement('option');
    option.value = marca;
    option.textContent = marca;
    filtroMarca.appendChild(option);
  });
}

// Muestra productos filtrados por marca
function mostrarProductos() {
  productosDiv.innerHTML = '';
  const marcaSeleccionada = filtroMarca.value;

  const productosFiltrados = marcaSeleccionada === 'todas'
    ? productos
    : productos.filter(p => p.marca === marcaSeleccionada);

  if (productosFiltrados.length === 0) {
    productosDiv.textContent = 'No hay productos para esta marca.';
    return;
  }

  productosFiltrados.forEach(p => {
    const div = document.createElement('div');
    div.className = 'producto';
    div.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}" style="cursor:pointer;" onclick="abrirModal(${p.id})" />
      <h3>${p.nombre}</h3>
      <p>Precio: $${p.precio}</p>
    `;
    productosDiv.appendChild(div);
  });
}

// Abrir modal con info del producto
function abrirModal(id) {
  productoSeleccionado = productos.find(p => p.id === id);
  if (!productoSeleccionado) return;

  // Si carrito está abierto, cerrarlo para evitar scroll conflictivo
  cerrarCarrito();

  modalImagen.src = productoSeleccionado.imagen;
  modalImagen.alt = productoSeleccionado.nombre;
  modalNombre.textContent = productoSeleccionado.nombre;
  modalPrecio.textContent = `Precio: $${productoSeleccionado.precio}`;

  selectTalle.innerHTML = '';
  productoSeleccionado.talles.forEach(talle => {
    const option = document.createElement('option');
    option.value = talle;
    option.textContent = talle;
    selectTalle.appendChild(option);
  });

  modal.style.display = 'block';
  bloquearScroll();
}

// Cerrar modal
cerrarModalBtn.onclick = () => {
  modal.style.display = 'none';
  desbloquearScroll();
}

// Cerrar modal al hacer click fuera del contenido
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
    desbloquearScroll();
  }
}

// Agregar producto al carrito desde modal
btnAgregarModal.onclick = () => {
  if (!productoSeleccionado) return;

  const talleElegido = selectTalle.value;

  const itemExistente = carrito.find(item => item.id === productoSeleccionado.id && item.talle === talleElegido);

  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    carrito.push({
      ...productoSeleccionado,
      cantidad: 1,
      talle: talleElegido
    });
  }
  mostrarCarrito();

  modal.style.display = 'none';
  desbloquearScroll();
}

// Mostrar carrito y actualizar contador
function mostrarCarrito() {
  listaCarrito.innerHTML = '';
  let total = 0;
  carrito.forEach(item => {
    total += item.precio * item.cantidad;
    const li = document.createElement('li');
    li.textContent = `${item.nombre} (Talle: ${item.talle}) x${item.cantidad} - $${item.precio * item.cantidad}`;
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'X';
    btnEliminar.onclick = () => {
      eliminarDelCarrito(item.id, item.talle);
    };
    li.appendChild(btnEliminar);
    listaCarrito.appendChild(li);
  });
  totalDiv.textContent = `Total: $${total}`;
  actualizarContadorCarrito();

  const carritoDiv = document.getElementById('carrito');
  if (carrito.length === 0) {
    carritoDiv.style.display = 'none';
    desbloquearScroll();
  } else {
    carritoDiv.style.display = 'block';
    bloquearScroll();
  }
}

// Eliminar producto del carrito
function eliminarDelCarrito(id, talle) {
  carrito = carrito.filter(item => !(item.id === id && item.talle === talle));
  mostrarCarrito();
}

// Vaciar carrito
btnVaciar.addEventListener('click', () => {
  carrito = [];
  mostrarCarrito();
});

// Filtro marca
filtroMarca.addEventListener('change', mostrarProductos);

// Enviar pedido por WhatsApp
btnEnviarPedido.addEventListener('click', () => {
  if (carrito.length === 0) {
    alert('El carrito está vacío.');
    return;
  }

  let mensaje = 'Hola, quiero hacer el siguiente pedido:%0A%0A';

  carrito.forEach(item => {
    mensaje += `- ${item.nombre} (Talle: ${item.talle}) x${item.cantidad} - $${item.precio * item.cantidad}%0A`;
  });

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  mensaje += `%0ATotal: $${total}`;

  const numeroWhatsApp = '5492213502642';

  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;
  window.open(urlWhatsApp, '_blank');
});

// Actualizar contador carrito
function actualizarContadorCarrito() {
  const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contadorCarrito.textContent = totalCantidad;
  contadorCarrito.style.display = totalCantidad > 0 ? 'inline-block' : 'none';
}

// Funciones para abrir/cerrar carrito con scroll bloqueado
function abrirCarrito() {
  // Si modal está abierto, cerrarlo para evitar conflicto
  modal.style.display = 'none';
  modalSeleccionado = null;
  desbloquearScroll();

  const carritoDiv = document.getElementById('carrito');
  if (carrito.length === 0) return; // No abrir si vacío
  carritoDiv.style.display = 'block';
  bloquearScroll();
}

function cerrarCarrito() {
  const carritoDiv = document.getElementById('carrito');
  carritoDiv.style.display = 'none';
  desbloquearScroll();
}

// Toggle carrito al click en icono
iconoCarrito.addEventListener('click', () => {
  const carritoDiv = document.getElementById('carrito');
  if (carritoDiv.style.display === 'none' || carritoDiv.style.display === '') {
    abrirCarrito();
  } else {
    cerrarCarrito();
  }
});

// Inicialización
cargarProductos();
mostrarCarrito();

window.abrirModal = abrirModal;
