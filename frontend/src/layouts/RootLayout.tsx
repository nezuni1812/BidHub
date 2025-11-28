import type React from "react";
import "../globals.css";

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="font-sans antialiased">
      {children}
    </div>
  );
};