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
const btnEnviarPedido = document.getElementById('btnEnviarPedido');  // NUEVO botón

// Nuevo ícono carrito y contador
const iconoCarrito = document.getElementById('iconoCarrito');
const contadorCarrito = document.getElementById('contadorCarrito');

let productos = [];
let carrito = [];

let productoSeleccionado = null; // Para el modal

// Carga el JSON con fetch
async function cargarProductos() {
  const sheetID = '1Vr9NIBycu6ucBu9urp4GgvZm6WmaRcHFoFBV2N0wgtc';
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // Limpiar el formato extraño del JSON de Google
    const jsonData = JSON.parse(text.substring(47).slice(0, -2));
    const rows = jsonData.table.rows;

    productos = rows.map((row, index) => {
      return {
        id: parseInt(row.c[0]?.v || index + 1),
        nombre: row.c[1]?.v || '',
        marca: row.c[2]?.v || '',
        precio: parseFloat(row.c[3]?.v || 0),
        imagen: row.c[4]?.v || '',
        talles: (row.c[5]?.v || '').split(',').map(t => t.trim())
      };
    });

    cargarMarcas();
    mostrarProductos();

  } catch (error) {
    productosDiv.textContent = 'Error al cargar productos desde la planilla: ' + error.message;
    console.error(error);
  }
}

// Carga las marcas en el select, sin repetir
function cargarMarcas() {
  const marcas = Array.from(new Set(productos.map(p => p.marca))).sort();
  marcas.forEach(marca => {
    const option = document.createElement('option');
    option.value = marca;
    option.textContent = marca;
    filtroMarca.appendChild(option);
  });
}

// Mostrar productos filtrando por marca seleccionada
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
    // Aquí la imagen tiene onclick para abrir modal
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

  modalImagen.src = productoSeleccionado.imagen;
  modalImagen.alt = productoSeleccionado.nombre;
  modalNombre.textContent = productoSeleccionado.nombre;
  modalPrecio.textContent = `Precio: $${productoSeleccionado.precio}`;

  // Cargar talles en select
  selectTalle.innerHTML = '';
  productoSeleccionado.talles.forEach(talle => {
    const option = document.createElement('option');
    option.value = talle;
    option.textContent = talle;
    selectTalle.appendChild(option);
  });

  modal.style.display = 'block';
}

// Cerrar modal
cerrarModalBtn.onclick = () => {
  modal.style.display = 'none';
}

// Cerrar modal al hacer click fuera del contenido
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

// Agregar producto al carrito desde modal con talle seleccionado
btnAgregarModal.onclick = () => {
  if (!productoSeleccionado) return;

  const talleElegido = selectTalle.value;

  // Chequear si ya existe el producto con ese talle en el carrito
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
}

// Mostrar carrito con talles y actualizar contador
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

  // Si carrito está vacío, ocultarlo automáticamente
  if (carrito.length === 0) {
    document.getElementById('carrito').style.display = 'none';
  }
}

// Eliminar producto del carrito (por id y talle)
function eliminarDelCarrito(id, talle) {
  carrito = carrito.filter(item => !(item.id === id && item.talle === talle));
  mostrarCarrito();
}

// Vaciar carrito
btnVaciar.addEventListener('click', () => {
  carrito = [];
  mostrarCarrito();
});

// Filtro marca cambia la vista
filtroMarca.addEventListener('change', mostrarProductos);

// Enviar pedido por WhatsApp
btnEnviarPedido.addEventListener('click', () => {
  if (carrito.length === 0) {
    alert('El carrito está vacío.');
    return;
  }

  let mensaje = 'Hola, quiero hacer el siguiente pedido:%0A%0A'; // %0A es salto de línea en URL encoding

  carrito.forEach(item => {
    mensaje += `- ${item.nombre} (Talle: ${item.talle}) x${item.cantidad} - $${item.precio * item.cantidad}%0A`;
  });

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  mensaje += `%0ATotal: $${total}`;

  // Número de WhatsApp (sin + ni espacios, ejemplo: 5491122233344)
  const numeroWhatsApp = '5492213502642';

  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;
  window.open(urlWhatsApp, '_blank');
});

// Actualizar contador en el ícono del carrito
function actualizarContadorCarrito() {
  const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contadorCarrito.textContent = totalCantidad;
  contadorCarrito.style.display = totalCantidad > 0 ? 'inline-block' : 'none';
}

// Mostrar/ocultar carrito al hacer click en el ícono
iconoCarrito.addEventListener('click', () => {
  if (carrito.length === 0) return; // No mostrar si carrito vacío
  const carritoDiv = document.getElementById('carrito');
  if (carritoDiv.style.display === 'none' || carritoDiv.style.display === '') {
    carritoDiv.style.display = 'block';
  } else {
    carritoDiv.style.display = 'none';
  }
});

// Inicializamos la página
cargarProductos();
mostrarCarrito();

// Para que la función abrirModal esté accesible en onclick inline
window.abrirModal = abrirModal;
