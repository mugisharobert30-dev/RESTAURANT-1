export type Role =
  | "customer"
  | "superadmin"
  | "admin"
  | "manager"
  | "waiter"
  | "kitchen"
  | "cashier"
  | "delivery";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  active: boolean;
}

export interface CustomizationOption {
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url?: string;
  ingredients: string[];
  allergens: string[];
  prep_time_min: number;
  available: boolean;
  featured: boolean;
  popular: boolean;
  spicy_level: 0 | 1 | 2 | 3;
  is_vegetarian: boolean;
  is_vegan: boolean;
  portion_info: string;
  calories?: number;
  rating_avg: number;
  rating_count: number;
  times_ordered: number;
  customization_groups: CustomizationGroup[];
  created_at: string;
}

export interface OrderItemLine {
  id?: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  options: string[];
  special_instructions?: string;
}

export type OrderStatus =
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "mtn_momo" | "airtel_money" | "card" | "cash_on_delivery" | "pay_at_counter";

export type OrderType = "dine_in" | "takeaway" | "delivery";

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  type: OrderType;
  table_label?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  items: OrderItemLine[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax: number;
  total: number;
  coupon_code?: string;
  delivery_address?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Reservation {
  id: string;
  reservation_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time_slot: string;
  party_size: number;
  area: TableArea;
  occasion?: string;
  special_requests?: string;
  status: ReservationStatus;
  created_at: string;
}

export type TableArea = "main_hall" | "terrace" | "garden" | "private";

export interface RestaurantTable {
  id: string;
  label: string;
  area: TableArea;
  seats: number;
  qr_token: string;
  active: boolean;
}

export interface Review {
  id: string;
  menu_item_id?: string;
  order_id?: string;
  customer_name: string;
  rating: number;
  food_rating?: number;
  service_rating?: number;
  delivery_rating?: number;
  comment: string;
  response?: string;
  hidden: boolean;
  featured: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  type: "seasonal" | "first_order" | "birthday" | "happy_hour";
  active: boolean;
  starts_at: string;
  ends_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  supplier: string;
  cost_per_unit: number;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  item_name: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  note: string;
  created_by: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  target: "customer" | "admin";
  user_id?: string;
  title: string;
  body: string;
  kind: "order" | "reservation" | "payment" | "inventory" | "review" | "message" | "table_request" | "promo";
  read: boolean;
  link?: string;
  created_at: string;
}

export interface DeliveryAddress {
  id: string;
  customer_id: string;
  label: string;
  address_line: string;
  district: string;
  phone: string;
  is_default: boolean;
}

export interface Favorite {
  customer_id: string;
  menu_item_id: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  group: "food" | "interior" | "events" | "team";
  gradient: [string, string];
  icon: string;
  image_url?: string;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  address: string;
  district: string;
  phone: string;
  phone_secondary: string;
  email: string;
  whatsapp: string;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  delivery_fee: number;
  delivery_zones: string[];
  tax_rate: number;
  tax_included: boolean;
  currency: string;
  reservation_slot_minutes: number;
  max_party_online: number;
  socials: { instagram: string; facebook: string; tiktok: string; whatsapp: string };
  wifi_password: string;
  auto_cleanup?: AutoCleanupConfig;
  auto_reset?: AutoResetConfig;
}

export type CleanupTarget =
  | "orders"
  | "reservations"
  | "reviews"
  | "notifications"
  | "auditLogs"
  | "movements"
  | "contactMessages";

export interface CleanupTargetInfo {
  key: CleanupTarget;
  label: string;
  rule: string;
}

export const CLEANUP_TARGETS: CleanupTargetInfo[] = [
  { key: "orders", label: "Old orders", rule: "Completed or cancelled only" },
  { key: "reservations", label: "Old reservations", rule: "Completed, cancelled or no-show only" },
  { key: "reviews", label: "Customer reviews", rule: "All past the selected age" },
  { key: "notifications", label: "Notifications", rule: "Read ones only" },
  { key: "auditLogs", label: "Audit logs", rule: "All past the selected age" },
  { key: "movements", label: "Stock movements", rule: "All past the selected age" },
  { key: "contactMessages", label: "Handled messages", rule: "Marked handled only" },
];

export interface AutoCleanupConfig {
  enabled: boolean;
  older_than_days: number;
  targets: CleanupTarget[];
}

export type ResetTarget = CleanupTarget | "coupons" | "promotions";

export interface ResetTargetInfo {
  key: ResetTarget;
  label: string;
}

export const RESET_TARGETS: ResetTargetInfo[] = [
  { key: "orders", label: "Orders (any status)" },
  { key: "reservations", label: "Reservations (any status)" },
  { key: "reviews", label: "Customer reviews" },
  { key: "notifications", label: "All notifications" },
  { key: "auditLogs", label: "Audit logs" },
  { key: "movements", label: "Stock movement history" },
  { key: "contactMessages", label: "Contact messages" },
  { key: "coupons", label: "Coupons" },
  { key: "promotions", label: "Promotions" },
];

export interface AutoResetConfig {
  enabled: boolean;
  older_than_days: number;
  targets: ResetTarget[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Order received",
  confirmed: "Payment confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export const TABLE_AREA_LABELS: Record<TableArea, string> = {
  main_hall: "Main Hall",
  terrace: "Terrace",
  garden: "Garden",
  private: "Private Room",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  superadmin: "Super Admin",
  admin: "Administrator",
  manager: "Manager",
  waiter: "Waiter",
  kitchen: "Kitchen staff",
  cashier: "Cashier",
  delivery: "Delivery staff",
};

export const STAFF_ROLES: Role[] = ["superadmin", "admin", "manager", "waiter", "kitchen", "cashier", "delivery"];

export function orderFlowFor(type: OrderType): OrderStatus[] {
  if (type === "delivery")
    return ["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"];
  return ["received", "confirmed", "preparing", "ready", "completed"];
}
