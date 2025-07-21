
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProviderSimple } from "@/hooks/useAuthSimple";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <AuthProviderSimple>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AuthProviderSimple>
);

export default App;
