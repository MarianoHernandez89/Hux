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
    if (!response.ok) {
      throw new Error('Error al cargar el archivo JSON');
    }
    productos = await response.json();
    cargarMarcas();
    mostrarProductos();
  } catch (error) {
    productosDiv.textContent = 'Error al cargar productos: ' + error.message;
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
      <button onclick="agregarAlCarrito(${p.id})">Agregar al carrito</button>
    `;
    productosDiv.appendChild(div);
  });
}

// Agregar producto al carrito
function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const itemCarrito = carrito.find(item => item.id === id
