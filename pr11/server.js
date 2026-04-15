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

// ===== СЕКРЕТЫ И ВРЕМЯ ЖИЗНИ =====
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// ===== ХРАНИЛИЩА =====
const users = [];
const products = [];
const refreshTokens = new Set();

// ===== РОЛИ =====
const ROLES = {
  USER: "user",
  SELLER: "seller",
  ADMIN: "admin"
};

function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

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
      role: user.role
    },
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    blocked: user.blocked
  };
}

function findUserById(id) {
  return users.find((u) => u.id === id);
}

function findProductById(id) {
  return products.find((p) => p.id === id);
}

// ===== MIDDLEWARE =====
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header"
    });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden"
      });
    }
    next();
  };
}

// ===== AUTH =====

// Регистрация — Гость
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        error: "email, first_name, last_name, password are required"
      });
    }

    if (users.some((u) => u.email === email)) {
      return res.status(409).json({
        error: "user already exists"
      });
    }

    const userRole = role || ROLES.USER;

    if (!isValidRole(userRole)) {
      return res.status(400).json({
        error: "invalid role"
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = {
      id: nanoid(),
      email,
      first_name,
      last_name,
      passwordHash,
      role: userRole,
      blocked: false
    };

    users.push(newUser);

    return res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    return res.status(500).json({
      error: "server error"
    });
  }
});

// Логин — Гость
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
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    if (user.blocked) {
      return res.status(403).json({
        error: "User is blocked"
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken
    });
  } catch (error) {
    return res.status(500).json({
      error: "server error"
    });
  }
});

// Refresh — Гость
app.post("/api/auth/refresh", (req, res) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header"
    });
  }

  const refreshToken = token;

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      error: "Invalid refresh token"
    });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({
        error: "User not found"
      });
    }

    if (user.blocked) {
      refreshTokens.delete(refreshToken);
      return res.status(403).json({
        error: "User is blocked"
      });
    }

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.add(newRefreshToken);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired refresh token"
    });
  }
});

// Текущий пользователь — Пользователь
app.get(
  "/api/auth/me",
  authMiddleware,
  roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]),
  (req, res) => {
    const user = findUserById(req.user.sub);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (user.blocked) {
      return res.status(403).json({
        error: "User is blocked"
      });
    }

    return res.status(200).json(sanitizeUser(user));
  }
);

// ===== USERS =====

// Список пользователей — Администратор
app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    return res.status(200).json(users.map(sanitizeUser));
  }
);

// Пользователь по id — Администратор
app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    const user = findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "user not found"
      });
    }

    return res.status(200).json(sanitizeUser(user));
  }
);

// Обновить пользователя — Администратор
app.put(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    const user = findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "user not found"
      });
    }

    const { first_name, last_name, role, blocked } = req.body;

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;

    if (role !== undefined) {
      if (!isValidRole(role)) {
        return res.status(400).json({
          error: "invalid role"
        });
      }
      user.role = role;
    }

    if (blocked !== undefined) {
      user.blocked = Boolean(blocked);
    }

    return res.status(200).json(sanitizeUser(user));
  }
);

// Заблокировать пользователя — Администратор
app.delete(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    const user = findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "user not found"
      });
    }

    user.blocked = true;

    return res.status(200).json({
      message: "user blocked",
      user: sanitizeUser(user)
    });
  }
);

// ===== PRODUCTS =====

// Создать товар — Продавец
app.post(
  "/api/products",
  authMiddleware,
  roleMiddleware([ROLES.SELLER, ROLES.ADMIN]),
  (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
      return res.status(400).json({
        error: "title, category, description, price are required"
      });
    }

    const product = {
      id: nanoid(),
      title,
      category,
      description,
      price: Number(price)
    };

    products.push(product);

    return res.status(201).json(product);
  }
);

// Список товаров — Пользователь
app.get(
  "/api/products",
  authMiddleware,
  roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]),
  (req, res) => {
    return res.status(200).json(products);
  }
);

// Товар по id — Пользователь
app.get(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]),
  (req, res) => {
    const product = findProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: "product not found"
      });
    }

    return res.status(200).json(product);
  }
);

// Обновить товар — Продавец
app.put(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware([ROLES.SELLER, ROLES.ADMIN]),
  (req, res) => {
    const product = findProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: "product not found"
      });
    }

    const { title, category, description, price } = req.body;

    if (title !== undefined) product.title = title;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);

    return res.status(200).json(product);
  }
);

// Удалить товар — Администратор
app.delete(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        error: "product not found"
      });
    }

    products.splice(index, 1);

    return res.status(200).json({
      message: "product deleted"
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});