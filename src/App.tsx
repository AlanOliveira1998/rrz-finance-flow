
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InvoicesProvider } from "@/hooks/useInvoices";
import { ClientsProvider } from "@/hooks/useClients";
import { ProjectsProvider } from "@/hooks/useProjects";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <AuthProvider>
    <ClientsProvider>
      <ProjectsProvider>
        <InvoicesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </InvoicesProvider>
      </ProjectsProvider>
    </ClientsProvider>
  </AuthProvider>
);

export default App;
