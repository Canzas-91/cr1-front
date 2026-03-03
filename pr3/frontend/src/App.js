import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialProduct?.name ?? "");
    setDescription(initialProduct?.description ?? "");
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : "");
    setImage(initialProduct?.image ?? "");
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Добавление товара";

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName) return alert("Введите название товара");
    if (!trimmedDesc) return alert("Введите описание товара");
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0)
      return alert("Введите корректную цену");
    if (!Number.isFinite(parsedStock) || parsedStock < 0)
      return alert("Введите корректное количество на складе");
    if (!image.trim()) return alert("Введите ссылку на изображение");

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      description: trimmedDesc,
      price: parsedPrice,
      stock: parsedStock,
      image: image.trim(),
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Stone Island Hoodie"
              autoFocus
            />
          </label>

          <label className="label">
            Описание
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание товара"
              rows={3}
            />
          </label>

          <label className="label">
            Цена (₽)
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Например, 19990"
              inputMode="numeric"
            />
          </label>

          <label className="label">
            В наличии (шт.)
            <input
              className="input"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Например, 10"
              inputMode="numeric"
            />
          </label>

          <label className="label">
            Изображение (URL)
            <input
              className="input"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки товаров");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления товара");
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        // ожидаем, что сервер вернёт созданный объект товара
        const res = await api.post("/products", payload);
        const created = res.data;
        setProducts((prev) => [created, ...prev]);
      } else {
        const res = await api.patch(`/products/${payload.id}`, payload);
        const updated = res.data;
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.id ? updated : p))
        );
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения товара");
    }
  };

  return (
    <div className="container">
      <div className="toolbar">
        <h1 className="title">Casual Clothing Store</h1>
        <button className="btn-add" onClick={openCreate}>+ Добавить товар</button>
      </div>

      {loading ? (
        <div className="empty">Загрузка...</div>
      ) : (
        <div className="products">
          {products.map((p) => (
            <div className="card" key={p.id}>
              <img src={p.image} alt={p.name} />

              <div className="card-content">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <p className="price">{p.price} ₽</p>

                <div className="stock">
                  <p>В наличии: {p.stock}</p>
                  <div className="actionsCol">
                    <button className="btn btn--primary" onClick={() => openEdit(p)}>Редактировать</button>
                    <button className="btn btn--danger" onClick={() => handleDelete(p.id)}>Удалить</button>
                    <button className="btn btn--buy">Купить</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!products.length && <div className="empty">Товаров пока нет</div>}
        </div>
      )}

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}

export default App;