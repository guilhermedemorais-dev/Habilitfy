export type AdminUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  kycStatus?: "pending" | "approved" | "rejected" | null;
  phone?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  isBlocked?: boolean;
  blockedReason?: string | null;
  adminNotes?: string | null;
  createdAt?: string | null;
};

export type AdminInstructor = {
  id: string;
  userId: string;
  status: "approved" | "pending" | "rejected";
  vehicleModel?: string | null;
  vehicleYear?: string | null;
  vehicleType?: string | null;
  credentialNumber?: string | null;
  createdAt?: string | null;
  user?: AdminUser | null;
};

export type AdminBookingRow = {
  booking: {
    id: string;
    status: string;
    totalPrice: string;
    date?: string | null;
    createdAt?: string | null;
  };
  student: AdminUser | null;
  instructor: {
    id: string;
    userId: string;
  } | null;
  instructorUser: AdminUser | null;
};

export type AdminDashboardStats = {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  walletBalance: number;
};

export type AdminFinanceSummary = {
  totalTransacted: number;
  totalProcessing: number;
  totalWalletBalance: number;
  pendingWithdrawals: number;
  pendingWithdrawalsCount: number;
  totalRefunded: number;
  failedTransactionsCount: number;
  pendingTransactionsCount: number;
};

export type AdminTransactionRow = {
  transaction: {
    id: string;
    bookingId?: string | null;
    type: string;
    status: string;
    amountGross: string;
    amountNet: string;
    gateway?: string | null;
    paymentId?: string | null;
    createdAt?: string | null;
  };
  fromUser: AdminUser | null;
  toUser: AdminUser | null;
  booking: {
    id: string;
  } | null;
};

export type AdminWalletRow = {
  id: string;
  userId: string;
  balance: string;
  currency?: string | null;
  updatedAt?: string | null;
  user?: AdminUser | null;
};

export type AdminWalletEntryRow = {
  entry: {
    id: string;
    walletId: string;
    userId: string;
    type: string;
    amount: string;
    description?: string | null;
    bookingId?: string | null;
    transactionId?: string | null;
    createdAt?: string | null;
  };
  user: AdminUser | null;
  booking: { id: string } | null;
  transaction: { id: string; type?: string | null } | null;
};

export type AdminWithdrawalRow = {
  withdrawal: {
    id: string;
    userId: string;
    amount: string;
    status: string;
    destinationType?: string | null;
    destinationKey?: string | null;
    requestedAt?: string | null;
    processedAt?: string | null;
    processedByUserId?: string | null;
    notes?: string | null;
  };
  user: AdminUser | null;
  processedBy: AdminUser | null;
};

export type AdminIntegrationField = {
  key: string;
  label?: string | null;
  type: "text" | "secret" | "url" | "number" | "boolean";
  value?: string | null;
  required?: boolean;
  placeholder?: string | null;
  hasValue?: boolean;
};

export type AdminIntegration = {
  id: string;
  name: string;
  slug: string;
  category: string;
  status?: "active" | "inactive" | null;
  environment?: "development" | "production" | null;
  isDefault?: boolean | null;
  fields?: AdminIntegrationField[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminSettings = {
  id: string;
  platformFeePercent?: string | null;
  platformFeeType?: "percentage" | "fixed" | null;
  cancellationFeePercent?: string | null;
  cancellationInstructorSharePercent?: string | null;
};

export type AdminFinanceSeriesPoint = {
  period: string;
  total: number;
  count: number;
};

export type AdminGeoPoint = {
  lat: number;
  lng: number;
  count: number;
  label?: string | null;
};

export type AdminGeoSummary = {
  instructors: AdminGeoPoint[];
  students: AdminGeoPoint[];
  states: string[];
  cities: string[];
  totals: {
    instructorsTotal: number;
    instructorsWithLocation: number;
    studentsTotal: number;
    studentsWithLocation: number;
  };
};
