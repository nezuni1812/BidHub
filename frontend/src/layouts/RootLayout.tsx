import type React from "react";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="font-sans antialiased">
      {children}
      <Toaster />
    </div>
  );
};