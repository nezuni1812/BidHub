import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import SellingPage from "@/pages/SellingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import GoogleCallbackPage from "@/pages/GoogleCallbackPage";
import ProductDetail from "@/pages/ProductDetail";
import DashboardPage from "@/pages/Dashboard";
import CheckoutPage from "@/pages/CheckoutPage";
import { ChatProvider } from "./contexts/ChatContext";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/Profile";
import PostItemPage from "./pages/PostItem";
import "./globals.css";

export default function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/selling" element={<SellingPage />} />
          <Route path="/seller/post-item" element={<PostItemPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/google/success" element={<GoogleCallbackPage />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>

  );
}
