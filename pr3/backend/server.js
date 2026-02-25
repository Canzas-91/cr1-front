const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));

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
    name: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg"
  },
  {
    id: 5,
    name: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg"
  },
  {
    id: 6,
    name: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg"
  },
  {
    id: 7,
    name: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg"
  },
  {
    id: 8,
    name: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg"
  }
  
];

// GET all
app.get("/api/products", (req, res) => {
  res.json(products);
});

// POST
app.post("/api/products", (req, res) => {
  const product = { id: nanoid(6), ...req.body };
  products.push(product);
  res.status(201).json(product);
});

// PATCH
app.patch("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  Object.assign(product, req.body);
  res.json(product);
});

// DELETE
app.delete("/api/products/:id", (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`API http://localhost:${port}`);
});