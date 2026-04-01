const express = require("express");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");

const app = express();
const PORT = 3000;

app.use(express.json());

// Временное хранилище данных
const users = [];
const products = [];

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// ===== AUTH =====

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        error: "email, first_name, last_name, password are required"
      });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "user already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: nanoid(),
      email,
      first_name,
      last_name,
      password: hashedPassword
    };

    users.push(newUser);

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name
    });
  } catch (error) {
    return res.status(500).json({ error: "server error" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required"
      });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const isAuthenticated = await verifyPassword(password, user.password);

    if (!isAuthenticated) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    return res.status(200).json({ login: true });
  } catch (error) {
    return res.status(500).json({ error: "server error" });
  }
});

// ===== PRODUCTS =====

// POST /api/products
app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description, price are required"
    });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price)
  };

  products.push(newProduct);
  return res.status(201).json(newProduct);
});

// GET /api/products
app.get("/api/products", (req, res) => {
  return res.status(200).json(products);
});

// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  return res.status(200).json(product);
});

// PUT /api/products/:id
app.put("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  const { title, category, description, price } = req.body;

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  return res.status(200).json(product);
});

// DELETE /api/products/:id
app.delete("/api/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "product not found" });
  }

  products.splice(index, 1);
  return res.status(200).json({ message: "product deleted" });
});

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});