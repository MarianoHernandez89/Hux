const productosDiv = document.getElementById('productos');
const listaCarrito = document.getElementById('lista-carrito');
const totalDiv = document.getElementById('total');
const btnVaciar = document.getElementById('vaciar-carrito');

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
    mostrarProductos();
  } catch (error) {
    productosDiv.textContent = 'Error al cargar productos: ' + error.message;
  }
}

// Mostrar productos
function mostrarProductos() {
  productosDiv.innerHTML = '';
  productos.forEach(p => {
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

// Inicializamos la página
cargarProductos();
mostrarCarrito();

// Para que las funciones estén accesibles desde los botones inline
window.agregarAlCarrito = agregarAlCarrito;

