const express = require('express');
const app = express();
const port = 3000;

// Middleware для работы с JSON
app.use(express.json());

// Список товаров (временное хранилище)
let products = [
  {
    id: 1,
    title: 'Stone Island Jacket',
    price: 42000,
    image: 'item1.jpg'
  },
  {
    id: 2,
    title: 'CP Company Hoodie',
    price: 28000,
    image: 'item2.jpg'
  },
  {
    id: 3,
    title: 'Casual Pants',
    price: 19000,
    image: 'item3.jpg'
  }
];

// Главная страница
app.get('/', (req, res) => {
  res.send('Casual Store API');
});

// ===== CRUD =====

// Получить все товары
app.get('/products', (req, res) => {
  res.json(products);
});

// Получить товар по id
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  res.json(product);
});

// Добавить товар
app.post('/products', (req, res) => {
  const { title, price, image } = req.body;

  const newProduct = {
    id: Date.now(),
    title,
    price,
    image
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Обновить товар
app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  const { title, price, image } = req.body;

  if (title !== undefined) product.title = title;
  if (price !== undefined) product.price = price;
  if (image !== undefined) product.image = image;

  res.json(product);
});

// Удалить товар
app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id != req.params.id);
  res.send('OK');
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});