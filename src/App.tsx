import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Maintenance from "./pages/Maintenance";
// import Index from "./pages/Index";
// import Collections from "./pages/Collections";
// import ProductDetail from "./pages/ProductDetail";
// import Cart from "./pages/Cart";
// import Checkout from "./pages/Checkout";
// import Auth from "./pages/Auth";
// import Orders from "./pages/Orders";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import AdminProducts from "./pages/admin/AdminProducts";
// import AdminCollections from "./pages/admin/AdminCollections";
// import AdminOrders from "./pages/admin/AdminOrders";
// import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// MAINTENANCE MODE: Set to false to restore normal site
const MAINTENANCE_MODE = true;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {MAINTENANCE_MODE ? (
              <Routes>
                <Route path="*" element={<Maintenance />} />
              </Routes>
            ) : (
              <Routes>
                {/* Restore these routes when maintenance is over */}
                <Route path="*" element={<Maintenance />} />
              </Routes>
            )}
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
