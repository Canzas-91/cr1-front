const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

// Секреты подписи
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// Временное хранилище данных
const users = [];
const products = [
  {
    id: "product-1",
    title: "Stone Island Jacket",
    category: "Outerwear",
    description: "Куртка в стиле casual",
    price: 42000,
    stock: 5,
    image: "/images/img2.jpeg",
  },
  {
    id: "product-2",
    title: "CP Company Hoodie",
    category: "Hoodies",
    description: "Худи со знаменитой линзой",
    price: 28000,
    stock: 8,
    image: "/images/img1.jpg",
  },
  {
    id: "product-3",
    title: "Casual Pants",
    category: "Pants",
    description: "Повседневные брюки",
    price: 19000,
    stock: 10,
    image: "/images/img3.jpg",
  },
  {
    id: "product-4",
    title: "CP Company свитшот",
    category: "Hoodies",
    description: "Свитшот с логотипом CP Company",
    price: 12000,
    stock: 10,
    image: "/images/img4.jpg",
  },
  {
    id: "product-5",
    title: "Свитшот Stone Island",
    category: "Hoodies",
    description: "Свитшот с логотипом Stone Island",
    price: 19000,
    stock: 20,
    image: "/images/img5.jpg",
  },
  {
    id: "product-6",
    title: "Кепка Stone Island",
    category: "Hats",
    description: "Кепка с логотипом Stone Island",
    price: 19000,
    stock: 10,
    image: "/images/img6.jpg",
  },
  {
    id: "product-7",
    title: "Шорты Ma.strum",
    category: "Pants",
    description: "Повседневные шорты Ma.strum",
    price: 5000,
    stock: 10,
    image: "/images/img7.jpg",
  },
  {
    id: "product-8",
    title: "Куртка CP Company",
    category: "Outerwear",
    description: "Куртка с логотипом CP Company",
    price: 25000,
    stock: 10,
    image: "/images/img8.jpg",
  },
];

// Хранилище refresh-токенов
const refreshTokens = new Set();

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN,
    }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

// ===== AUTH =====

// Регистрация
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        error: "email, first_name, last_name, password are required",
      });
    }

    const exists = users.some((u) => u.email === email);
    if (exists) {
      return res.status(409).json({
        error: "user already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = {
      id: nanoid(),
      email,
      first_name,
      last_name,
      passwordHash,
    };

    users.push(user);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  } catch (error) {
    return res.status(500).json({
      error: "server error",
    });
  }
});

// Логин
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      error: "server error",
    });
  }
});

// Обновление токенов
app.post("/api/auth/refresh", (req, res) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  const refreshToken = token;

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    // Ротация refresh-токена
    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.add(newRefreshToken);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired refresh token",
    });
  }
});

// Текущий пользователь
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

// ===== PRODUCTS =====

// Создать товар
app.post("/api/products", (req, res) => {
  const { title, category, description, price, stock, image } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description, price are required",
    });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price),
    stock: stock === undefined ? 0 : Number(stock),
    image: image || "",
  };

  products.push(newProduct);

  return res.status(201).json(newProduct);
});

// Получить все товары
app.get("/api/products", (req, res) => {
  return res.status(200).json(products);
});

// Получить товар по id — защищённый
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "product not found",
    });
  }

  return res.status(200).json(product);
});

// Обновить товар — защищённый
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "product not found",
    });
  }

  const { title, category, description, price, stock, image } = req.body;

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (image !== undefined) product.image = image;

  return res.status(200).json(product);
});

// Удалить товар — защищённый
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "product not found",
    });
  }

  products.splice(index, 1);

  return res.status(200).json({
    message: "product deleted",
  });
});

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});
