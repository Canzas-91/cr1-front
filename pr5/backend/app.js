const express = require("express");
const cors = require("cors");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// Массив товаров
let products = [
  {
    id: 1,
    name: "Stone Island Jacket",
    category: "Outerwear",
    description: "Куртка в стиле casual",
    price: 42000,
    stock: 5,
    image: "/images/img2.jpeg"
  },
  {
    id: 2,
    name: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg"
  },
  {
    id: 3,
    name: "Casual Pants",
    category: "Pants",
    description: "Повседневные брюки",
    price: 19000,
    stock: 10,
    image: "/images/img3.jpg"
  },
  {
    id: 4,
    name: "CP Company свитшот",
    category: "Hoodies",
    description: "Свитшот с логотипом CP Company",
    price: 12000,
    stock: 10,
    image: "/images/img4.jpg"
  },
  {
    id: 5,
    name: "Свитшот Stone Island",
    category: "Hoodies",
    description: "Свитшот с логотипом Stone Island",
    price: 19000,
    stock: 20,
    image: "/images/img5.jpg"
  },
  {
    id: 6,
    name: "Кепка Stone Island",
    category: "Hats",
    description: "Кепка с логотипом Stone Island",
    price: 19000,
    stock: 10,
    image: "/images/img6.jpg"
  },
  {
    id: 7,
    name: "Шорты Ma.strum",
    category: "Pants",
    description: "Повседневные Шорты Ma.strum",
    price: 5000,
    stock: 10,
    image: "/images/img7.jpg"
  },
  {
    id: 8,
    name: "Куртка CP Company",
    category: "Outerwear",
    description: "Куртка с логотипом CP Company",
    price: 25000,
    stock: 10,
    image: "/images/img8.jpg"
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required: [name, category, price, stock]
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         image:
 *           type: string
 *           description: Ссылка на изображение товара
 */

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Products API",
      version: "1.0.0",
      description: "REST API для управления товарами",
    },
    servers: [{ url: `http://localhost:${port}` }],
  },
  apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// GET /api/products — получить все товары
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

// POST /api/products — создать товар
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock, image } = req.body;

  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({ error: "name, category, price и stock обязательны" });
  }

  const newProduct = {
    id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name: name.trim(),
    category: category.trim(),
    description: description ? description.trim() : "",
    price: Number(price),
    stock: Number(stock),
    image: image || ""
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH /api/products/:id — обновить товар
/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Товар обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.patch("/api/products/:id", (req, res) => {
  const productId = Number(req.params.id);
  const product = products.find(p => p.id === productId);

  if (!product) return res.status(404).json({ error: "Product not found" });

  const { name, category, description, price, stock, image } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (image !== undefined) product.image = image;

  res.json(product);
});

// DELETE /api/products/:id — удалить товар
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар удалён
 */
app.delete("/api/products/:id", (req, res) => {
  const productId = Number(req.params.id);
  const exists = products.some(p => p.id === productId);

  if (!exists) return res.status(404).json({ error: "Product not found" });

  products = products.filter(p => p.id !== productId);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
});