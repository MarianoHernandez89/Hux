const productosDiv = document.getElementById('productos');
const listaCarrito = document.getElementById('lista-carrito');
const totalDiv = document.getElementById('total');
const btnVaciar = document.getElementById('vaciar-carrito');
const filtroMarca = document.getElementById('filtroMarca');

let productos = [];
let carrito = [];

// Carga el JSON con fetch
async function cargarProductos() {
  try {
    const response = await fetch('catalogo.json');
    console.log('Response:', response);
    if (!response.ok) {
      throw new Error('Error al cargar el archivo JSON');
    }
    productos = await response.json();
    console.log('Productos cargados:', productos);
    cargarMarcas();
    mostrarProductos();
  } catch (error) {
    productosDiv.textContent = 'Error al cargar productos: ' + error.message;
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

  // Filtrar productos por marca (si no es "todas")
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
      <img src="${p.imagen}" alt="${p.nombre}" />
      <h3>${p.nombre}</h3>
      <p>Precio: $${p.precio}</p>
      <button onclick="agregarAlCarrito('${p.id}')">Agregar al carrito</button>
    `;
    productosDiv.appendChild(div);
  });
}

// Agregar producto al carrito
function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const itemCarrito = carrito.find(item => item.id === id);
  if (itemCarrito) {
    itemCarrito.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  mostrarCarrito();
}

// Mostrar carrito
function mostrarCarrito() {
  listaCarrito.innerHTML = '';
  let total = 0;
  carrito.forEach(item => {
    total += item.precio * item.cantidad;
    const li = document.createElement('li');
    li.textContent = `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}`;
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'X';
    btnEliminar.onclick = () => {
      eliminarDelCarrito(item.id);
    };
    li.appendChild(btnEliminar);
    listaCarrito.appendChild(li);
  });
  totalDiv.textContent = `Total: $${total}`;
}

// Eliminar producto del carrito
function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  mostrarCarrito();
}

// Vaciar carrito
btnVaciar.addEventListener('click', () => {
  carrito = [];
  mostrarCarrito();
});

// Evento para cambiar filtro de marcas
filtroMarca.addEventListener('change', mostrarProductos);

// Inicializamos la página
cargarProductos();
mostrarCarrito();

// Para que las funciones estén accesibles desde los botones inline
window.agregarAlCarrito = agregarAlCarrito;
