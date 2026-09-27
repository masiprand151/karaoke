import React, { useEffect, useRef, useState } from "react";
import useToast from "../hooks/useToast";
import api from "../utils/api";
import { BsDash, BsPlus, BsX } from "react-icons/bs";
import formatCurrency from "../utils/formatRupiah";
import { useNavigate } from "react-router-dom";

export default function OrderProduct({ transactionId }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const clickTimer = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const getProducts = async (q = "") => {
    try {
      const res = await api.get(`/product?search=${q}`);
      console.log(res);
      setProducts(res.data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProducts(search);
  }, [search]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * Number(item.price),
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          subtotal: Number(product.price),
        },
      ];
    });
  };

  const decreaseCart = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
                subtotal: (item.quantity - 1) * item.price,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const increaseCart = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.price,
            }
          : item,
      ),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const cartQty = cart.reduce((total, item) => total + item.quantity, 0);

  const handleProductClick = (product) => {
    if (clickTimer.current) {
      // CLICK KEDUA → DOUBLE CLICK
      clearTimeout(clickTimer.current);
      clickTimer.current = null;

      addToCart(product);
      return;
    }

    // CLICK PERTAMA → tunggu sebentar
    clickTimer.current = setTimeout(() => {
      toast.info("Double click to add to cart");
      clickTimer.current = null;
    }, 250);
  };

  const handleOrder = async () => {
    try {
      console.log(transactionId);

      const res = await api.post("/product/order", {
        transactionId: transactionId,
        items: cart,
      });
      toast.success(res.message);
      navigate(-1);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="row">
      <div className="col-6">
        <div className="card">
          <div className="card-header">
            <div className="input-group input-group-sm">
              <input
                className="form-control form-control-sm"
                type="search"
                placeholder="Search"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm input-group-text"
                onClick={() => getProducts(search)}
              >
                Search
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <div
              style={{
                height: 589,
                overflowY: "auto",
              }}
            >
              <table className="table table-hover mb-0">
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Price</th>
                    <th scope="col">Stock</th>
                  </tr>
                </thead>

                <tbody>
                  {products?.map((product, i) => (
                    <tr
                      key={product.id}
                      style={{
                        cursor: "pointer",
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      <th scope="row">{i + 1}</th>
                      <td>{product?.name}</td>
                      <td>{formatCurrency(product?.price, "IDR")}</td>
                      <td>{product?.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-header">
            <h6>Cart</h6>
          </div>

          <div
            className="card-body"
            style={{
              height: 543,
              overflowY: "auto",
            }}
          >
            {cart.length === 0 ? (
              <div className="text-center text-muted">Cart masih kosong</div>
            ) : (
              <table className="table table-hover mb-0">
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Price</th>
                    <th scope="col">qty</th>
                    <th scope="col">subtotal</th>
                    <th scope="col"></th>
                  </tr>
                </thead>

                <tbody>
                  {cart?.map((item, i) => (
                    <tr key={item.id}>
                      <th scope="row">{i + 1}</th>
                      <td>{item?.name}</td>
                      <td>{formatCurrency(item?.price, "IDR")}</td>
                      <td>{item?.quantity}</td>
                      <td>{formatCurrency(item?.subtotal, "IDR")}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => decreaseCart(item.id)}
                        >
                          <BsDash />
                        </button>

                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => increaseCart(item.id)}
                        >
                          <BsPlus />
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <BsX />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card-footer d-flex justify-content-between">
            <button className="btn btn-sm btn-primary" onClick={handleOrder}>
              Order
            </button>
            <strong>Total</strong>
            <strong>{formatCurrency(cartTotal, "IDR")}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
