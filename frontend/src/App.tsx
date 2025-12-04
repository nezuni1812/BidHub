import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import SellingPage from "@/pages/SellingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProductDetail from "@/pages/ProductDetail";
import DashboardPage from "@/pages/Dashboard";
import CheckoutPage from "@/pages/CheckoutPage";
import { ChatProvider } from "./contexts/ChatContext";
import ChatPage from "./pages/ChatPage";
import "./globals.css";

export default function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/selling" element={<SellingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>

  );
}
