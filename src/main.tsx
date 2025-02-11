import CartView from "./CartView";
import ReactDOM from "react-dom/client";
import Dashboard from "./Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <CartView />,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
  ]
);

const domNode = document.getElementById('root')!;
console.log(domNode)
ReactDOM.createRoot(domNode).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
