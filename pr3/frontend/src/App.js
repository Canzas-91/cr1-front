import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then(res => setProducts(res.data));
  }, []);

  return (
    <div className="container">
      <h1 className="title">Casual Clothing Store</h1>

      <div className="products">
        {products.map(p => (
          <div className="card" key={p.id}>
            <img src={p.image} alt={p.name} />

            <div className="card-content">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <p className="price">{p.price} ₽</p>
              <p>В наличии: {p.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;