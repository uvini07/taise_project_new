import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";

// As páginas são carregadas sob demanda. Começa a baixar a da rota aberta
// já agora, em paralelo com o React (o lazy() reaproveita o mesmo módulo).
const path = window.location.pathname;
if (path === "/") import("./revela/pages/RevelaHome.jsx");
else if (path === "/tarufino") import("./pages/public/Home.jsx");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
