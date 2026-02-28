export type DateFilter = {
  from: string | null;
  to: string | null;
};

export type Metrics = {
  totalAppointments: number;
  bookedAppointments: number;
  cancelledAppointments: number;
  completedAppointmentsCount: number;
  noShowAppointments: number;
  revenue: number;
  averageCheck: number;
  conversionToCompleted: number;
  repeatClientsCount: number;
  uniqueClientsCount: number;
  newClientsCount: number;
};

export type StatusKey = "booked" | "completed" | "cancelled" | "no_show";

export type StatusSummaryItem = {
  key: StatusKey;
  value: number;
};

export type AppointmentsByDayPoint = {
  dateKey: string;
  label: string;
  appointments: number;
  completed: number;
};

export type RevenueByServicePoint = {
  service: string;
  revenue: number;
};

export type CategorySummaryRow = {
  category: string;
  totalAppointments: number;
  completedAppointments: number;
  revenue: number;
  revenueShare: number;
};

export type RevenueLossMetrics = {
  plannedRevenue: number;
  actualRevenue: number;
  lostRevenue: number;
  cancelledLossRevenue: number;
  noShowLossRevenue: number;
  planCompletionRate: number;
  lossRate: number;
  lostAppointmentsCount: number;
  pricedLostAppointmentsCount: number;
  unpricedLostAppointmentsCount: number;
};
