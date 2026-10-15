import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/context";
import { CartProvider } from "@/lib/cartContext";
import CartDrawer from "@/components/CartDrawer";
import Layout from "@/components/layout";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import TV from "@/pages/TV";
import Peliculas from "@/pages/Peliculas";
import Juegos from "@/pages/Juegos";
import Pavos from "@/pages/Pavos";
import Noticias from "@/pages/Noticias";
import PanelOpt from "@/pages/PanelOpt";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Regalos from "@/pages/Regalos";
import ProductPage from "@/pages/ProductPage";
import JuegoPage from "@/pages/JuegoPage";
import FortniteItemPage from "@/pages/FortniteItemPage";
import NotFound from "@/pages/not-found";
import PaypalReturn from "@/pages/PaypalReturn";
import { useEffect, useState, Component, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <p className="text-white text-lg font-bold mb-4">Ocurrio un error inesperado</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl"
            >
              Recargar pagina
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SuspendedAlert() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("suspended") === "true") {
      setShow(true);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const handler = () => setShow(true);
    window.addEventListener("user-suspended", handler);
    return () => window.removeEventListener("user-suspended", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-800 px-8 py-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-black tracking-wide">CUENTA SUSPENDIDA</h2>
        </div>
        <div className="px-8 py-6 text-center">
          <p className="text-gray-800 text-base font-semibold mb-3">
            Tu cuenta ha sido suspendida permanentemente.
          </p>
          <p className="text-gray-500 text-sm mb-1">
            No puedes iniciar sesion ni registrarte con esta cuenta.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Si crees que esto es un error, contactanos por WhatsApp.
          </p>
          <button
            onClick={() => {
              setShow(false);
              window.location.href = "/";
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/paypal-return" component={PaypalReturn} />
      <Route path="/paypal-cancel" component={PaypalReturn} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/admin">
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            </Route>
            <Route path="/tv" component={TV} />
            <Route path="/peliculas" component={Peliculas} />
            <Route path="/juegos" component={Juegos} />
            <Route path="/pavos/:id" component={FortniteItemPage} />
            <Route path="/pavos" component={Pavos} />
            <Route path="/noticias" component={Noticias} />
            <Route path="/panel-opt" component={PanelOpt} />
            <Route path="/perfil" component={Profile} />
            <Route path="/regalos" component={Regalos} />
            <Route path="/producto/:id" component={ProductPage} />
            <Route path="/juego/:id" component={JuegoPage} />
            <Route path="/terminos" component={PrivacyPolicy} />
            <Route path="/privacidad" component={PrivacyPolicy} />
            <Route path="/politicas-y-terminos" component={PrivacyPolicy} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <CartProvider>
            <Toaster />
            <SonnerToaster richColors position="top-right" />
            <SuspendedAlert />
            <Router />
            <CartDrawer />
          </CartProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
