import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import SellingPage from "@/pages/SellingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProductDetail from "@/pages/ProductDetail";
import DashboardPage from "@/pages/Dashboard";
import "./globals.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/selling" element={<SellingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
