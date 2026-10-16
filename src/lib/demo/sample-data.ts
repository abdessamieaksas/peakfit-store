import type { OrderStatus } from "@/features/orders/domain/status";

export type DemoOrder = {
  id: string;
  customer: string;
  phone: string;
  city: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: string;
};

export const DEMO_ORDERS: DemoOrder[] = [
  { id: "PF-DEMO-1048", customer: "Nora El Amrani", phone: "+212 6•• •• 01 48", city: "Rabat", date: "Aujourd’hui · 10:24", total: 690, status: "NEW", items: "Ensemble Velocity · Lavande / M" },
  { id: "PF-DEMO-1047", customer: "Yassine Berrada", phone: "+212 6•• •• 01 47", city: "Casablanca", date: "Aujourd’hui · 09:12", total: 420, status: "CONTACTED", items: "T-shirt compression · Noir / L" },
  { id: "PF-DEMO-1046", customer: "Salma Idrissi", phone: "+212 6•• •• 01 46", city: "Tanger", date: "Hier · 18:36", total: 890, status: "CONFIRMED", items: "Combinaison running · Noir / S" },
  { id: "PF-DEMO-1045", customer: "Adam Chraïbi", phone: "+212 6•• •• 01 45", city: "Marrakech", date: "Hier · 15:08", total: 340, status: "PREPARING", items: "T-shirt compression · Blanc / M" },
  { id: "PF-DEMO-1044", customer: "Imane Alaoui", phone: "+212 6•• •• 01 44", city: "Fès", date: "12 oct. · 11:52", total: 690, status: "DELIVERED", items: "Ensemble Velocity · Noir / S" },
];

export const DEMO_PRODUCTS = [
  { name: "Ensemble Velocity", variant: "Lavande · S", stock: 2, price: 690 },
  { name: "T-shirt Compression Core", variant: "Noir · M", stock: 7, price: 340 },
  { name: "Combinaison Sprint", variant: "Noir · L", stock: 0, price: 890 },
];
