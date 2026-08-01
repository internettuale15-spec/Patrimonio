import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Entrate from "@/pages/Entrate";
import Spese from "@/pages/Spese";
import Casa from "@/pages/Casa";
import Investimenti from "@/pages/Investimenti";
import Patrimonio from "@/pages/Patrimonio";
import Obiettivi from "@/pages/Obiettivi";
import Budget from "@/pages/Budget";
import Calendario from "@/pages/Calendario";
import Report from "@/pages/Report";
import Previsioni from "@/pages/Previsioni";
import Impostazioni from "@/pages/Impostazioni";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const { init, hasSession, profile, loading } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Caricamento...
      </div>
    );
  }

  if (!hasSession) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (!profile) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="entrate" element={<Entrate />} />
          <Route path="spese" element={<Spese />} />
          <Route path="casa" element={<Casa />} />
          <Route path="investimenti" element={<Investimenti />} />
          <Route path="patrimonio" element={<Patrimonio />} />
          <Route path="obiettivi" element={<Obiettivi />} />
          <Route path="budget" element={<Budget />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="report" element={<Report />} />
          <Route path="previsioni" element={<Previsioni />} />
          <Route path="impostazioni" element={<Impostazioni />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
