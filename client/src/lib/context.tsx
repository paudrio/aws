import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type OrderStatus = "pending" | "completed" | "cancelled";

export interface CategoryItem {
  id: string;
  name: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  whatsappNumber?: string;
  isMonthly?: boolean;
  inStock?: boolean;
  showCheckmarks?: boolean;
  showBinance?: boolean;
  showBanrural?: boolean;
  showBac?: boolean;
  showBi?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  price: number;
  date: string;
  status: OrderStatus;
}

export interface Settings {
  whatsappNumber: string;
  backgroundImage: string;
  storeName: string;
  heroStreamUrl?: string;
  heroAudioEnabled?: string;
  [key: string]: any;
}

interface AppContextType {
  products: Product[];
  orders: Order[];
  settings: Settings;
  categories: CategoryItem[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => void;
  updateCredentials: (currentPassword: string, newUsername?: string, newPassword?: string) => Promise<boolean>;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addOrder: (order: Omit<Order, "id" | "date" | "status">) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateSetting: (key: string, value: string) => void;
  addCategory: (c: Omit<CategoryItem, "id">) => void;
  deleteCategory: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_auth") === "true";
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 1000 * 30,
    refetchOnMount: false,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  // Fetch settings
  const { data: settingsData = {} } = useQuery<Record<string, string>>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return {};
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const settings: Settings = {
    whatsappNumber: settingsData.whatsappNumber || "50237871216",
    backgroundImage: settingsData.backgroundImage || "",
    storeName: settingsData.storeName || "PAUDRONIX GT",
    heroStreamUrl: settingsData.heroStreamUrl || "",
    heroAudioEnabled: settingsData.heroAudioEnabled || "",
    ...settingsData,
  };

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, "id">) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Failed to add product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Producto agregado", description: "El producto está ahora disponible." });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Producto actualizado" });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Producto eliminado" });
    },
  });

  // Add order mutation
  const addOrderMutation = useMutation({
    mutationFn: async (order: Omit<Order, "id" | "date" | "status">) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to add order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Orden actualizada" });
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Configuración guardada" });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<CategoryItem, "id">) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error("Failed to add category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoría agregada" });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoría eliminada" });
    },
  });

  const login = async (u: string, p: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        toast({ title: "Bienvenido Admin", description: "Has iniciado sesión correctamente." });
        return true;
      }
      toast({ variant: "destructive", title: "Error", description: data.error || "Credenciales incorrectas." });
      return false;
    } catch (e) {
      console.error("Login error:", e);
      toast({ variant: "destructive", title: "Error", description: "Error de conexión." });
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("paudronix_auth");
    toast({ title: "Sesión cerrada" });
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["settings"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const updateCredentials = async (currentPassword: string, newUsername?: string, newPassword?: string) => {
    try {
      const res = await fetch("/api/auth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      });
      if (res.ok) {
        toast({ title: "Credenciales actualizadas", description: "Los cambios se guardaron correctamente." });
        return true;
      }
      const data = await res.json();
      toast({ variant: "destructive", title: "Error", description: data.error || "No se pudo actualizar." });
      return false;
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Error de conexión." });
      return false;
    }
  };

  return (
    <AppContext.Provider value={{ 
      products, 
      orders, 
      settings,
      categories,
      isLoading: productsLoading,
      isAuthenticated, 
      login, 
      logout,
      refreshData,
      updateCredentials,
      addProduct: (p) => addProductMutation.mutate(p),
      updateProduct: (id, data) => updateProductMutation.mutate({ id, data }),
      deleteProduct: (id) => deleteProductMutation.mutate(id),
      addOrder: (o) => addOrderMutation.mutate(o),
      updateOrderStatus: (id, status) => updateOrderStatusMutation.mutate({ id, status }),
      updateSetting: (key, value) => updateSettingMutation.mutate({ key, value }),
      addCategory: (c) => addCategoryMutation.mutate(c),
      deleteCategory: (id) => deleteCategoryMutation.mutate(id)
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
