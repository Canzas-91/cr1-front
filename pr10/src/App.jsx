import { useEffect, useState } from "react";
import api from "./api";

const emptyRegisterForm = {
  email: "",
  first_name: "",
  last_name: "",
  password: ""
};

const emptyLoginForm = {
  email: "",
  password: ""
};

const emptyProductForm = {
  title: "",
  category: "",
  description: "",
  price: ""
};

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(Number(price) || 0);
}

export default function App() {
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    price: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  async function loadMe() {
    try {
      const response = await api.get("/api/auth/me");
      setUser(response.data);
    } catch {
      setUser(null);
    }
  }

  async function loadProducts() {
    try {
      const response = await api.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка загрузки товаров", "error");
    }
  }

  useEffect(() => {
    loadProducts();
    loadMe();
  }, []);

  function handleRegisterChange(e) {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value
    });
  }

  function handleLoginChange(e) {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  }

  function handleProductChange(e) {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  }

  function handleEditChange(e) {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/api/auth/register", registerForm);
      showMessage(`Пользователь ${response.data.email} зарегистрирован`, "success");
      setRegisterForm(emptyRegisterForm);
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка регистрации", "error");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/api/auth/login", loginForm);

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      showMessage("Вход выполнен", "success");
      setLoginForm(emptyLoginForm);
      await loadMe();
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка входа", "error");
    }
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    showMessage("Вы вышли из аккаунта", "info");
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/api/products", {
        ...productForm,
        price: Number(productForm.price)
      });

      showMessage("Товар создан", "success");
      setProductForm(emptyProductForm);
      await loadProducts();
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка создания товара", "error");
    }
  }

  async function handleGetProductById() {
    setMessage("");
    setSelectedProduct(null);

    try {
      const response = await api.get(`/api/products/${selectedId}`);
      setSelectedProduct(response.data);
      setEditForm({
        title: response.data.title,
        category: response.data.category,
        description: response.data.description,
        price: response.data.price
      });
      showMessage("Товар найден", "success");
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка получения товара", "error");
    }
  }

  async function handleUpdateProduct() {
    setMessage("");

    try {
      const response = await api.put(`/api/products/${selectedId}`, {
        ...editForm,
        price: Number(editForm.price)
      });

      setSelectedProduct(response.data);
      showMessage("Товар обновлён", "success");
      await loadProducts();
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка обновления товара", "error");
    }
  }

  async function handleDeleteProduct() {
    setMessage("");

    try {
      await api.delete(`/api/products/${selectedId}`);
      setSelectedProduct(null);
      setSelectedId("");
      setEditForm({
        title: "",
        category: "",
        description: "",
        price: ""
      });
      showMessage("Товар удалён", "success");
      await loadProducts();
    } catch (error) {
      showMessage(error.response?.data?.error || "Ошибка удаления товара", "error");
    }
  }

  return (
    <div className="container">

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <section className="auth-layout">
        <section className="card auth-card auth-card-primary">
          <div className="card-head">
            <span className="section-kicker">Новый аккаунт</span>
            <h2>Регистрация</h2>
            <p>Создай пользователя, чтобы потом сразу войти и работать с товарами.</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={registerForm.email}
                onChange={handleRegisterChange}
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>Имя</span>
                <input
                  name="first_name"
                  placeholder="Александр"
                  value={registerForm.first_name}
                  onChange={handleRegisterChange}
                />
              </label>

              <label className="field">
                <span>Фамилия</span>
                <input
                  name="last_name"
                  placeholder="Немов"
                  value={registerForm.last_name}
                  onChange={handleRegisterChange}
                />
              </label>
            </div>

            <label className="field">
              <span>Пароль</span>
              <input
                name="password"
                type="password"
                placeholder="Минимум 6 символов"
                value={registerForm.password}
                onChange={handleRegisterChange}
              />
            </label>

            <button type="submit" className="button-primary">
              Зарегистрироваться
            </button>
          </form>
        </section>

        <section className="card auth-card auth-card-secondary">
          <div className="card-head">
            <span className="section-kicker">Уже есть аккаунт</span>
            <h2>Вход</h2>
            <p>Авторизуйся, чтобы создавать, редактировать и удалять товары.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form compact-form">
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={handleLoginChange}
              />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input
                name="password"
                type="password"
                placeholder="Введите пароль"
                value={loginForm.password}
                onChange={handleLoginChange}
              />
            </label>

            <button type="submit">Войти</button>
          </form>

          <div className="user-box profile-box">
            <h3>Текущий пользователь</h3>
            {user ? (
              <>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Имя:</strong> {user.first_name}</p>
                <p><strong>Фамилия:</strong> {user.last_name}</p>
                <button onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <p>Пользователь пока не авторизован.</p>
            )}
          </div>
        </section>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Создать товар</h2>
          <form onSubmit={handleCreateProduct}>
            <input
              name="title"
              placeholder="Название"
              value={productForm.title}
              onChange={handleProductChange}
            />
            <input
              name="category"
              placeholder="Категория"
              value={productForm.category}
              onChange={handleProductChange}
            />
            <input
              name="description"
              placeholder="Описание"
              value={productForm.description}
              onChange={handleProductChange}
            />
            <input
              name="price"
              type="number"
              placeholder="Цена"
              value={productForm.price}
              onChange={handleProductChange}
            />
            <button type="submit">Создать</button>
          </form>
        </section>

        <section className="card">
          <h2>Товар по ID</h2>
          <div className="row">
            <input
              placeholder="Введите ID товара"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            />
            <button onClick={handleGetProductById}>Получить</button>
          </div>

          {selectedProduct && (
            <div className="product-box">
              <p><strong>ID:</strong> {selectedProduct.id}</p>
              <p><strong>Название:</strong> {selectedProduct.title}</p>
              <p><strong>Категория:</strong> {selectedProduct.category}</p>
              <p><strong>Описание:</strong> {selectedProduct.description}</p>
              <p><strong>Цена:</strong> {selectedProduct.price}</p>

              <h3>Обновить товар</h3>
              <input
                name="title"
                placeholder="Название"
                value={editForm.title}
                onChange={handleEditChange}
              />
              <input
                name="category"
                placeholder="Категория"
                value={editForm.category}
                onChange={handleEditChange}
              />
              <input
                name="description"
                placeholder="Описание"
                value={editForm.description}
                onChange={handleEditChange}
              />
              <input
                name="price"
                type="number"
                placeholder="Цена"
                value={editForm.price}
                onChange={handleEditChange}
              />

              <div className="actions">
                <button onClick={handleUpdateProduct}>Обновить</button>
                <button className="danger" onClick={handleDeleteProduct}>
                  Удалить
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Список товаров</h2>
          </div>
          <button onClick={loadProducts}>Обновить список</button>
        </div>

        {products.length === 0 ? (
          <p>Товаров пока нет</p>
        ) : (
          <div className="product-list">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-card-top">
                  <span className="product-category">{product.category}</span>
                  <span className="product-stock">
                    В наличии: {product.stock ?? "не указано"}
                  </span>
                </div>

                <div className="product-visual">
                  {product.image ? (
                    <img
                      src={`http://localhost:3000${product.image}`}
                      alt={product.title || product.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.classList.add("product-visual-fallback");
                      }}
                    />
                  ) : (
                    <div className="product-visual-placeholder">Нет фото</div>
                  )}
                </div>

                <div className="product-body">
                  <p className="product-id">ID: {product.id}</p>
                  <h3>{product.title || product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">{formatPrice(product.price)} ₽</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
