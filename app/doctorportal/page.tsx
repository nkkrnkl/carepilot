"use client";

import { useState, useEffect } from "react";
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search,
  Grid3x3,
  BarChart3,
  Bell,
  Settings,
  Mail,
  Calendar,
  DollarSign,
  Bookmark,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  AlertTriangle,
  X,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";

interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  monthlyRevenue: number;
  pendingReviews: number;
  activePatients: number;
  revenueChange: number;
  appointmentsChange: number;
  revenueChangePercent: number;
  appointmentsChangePercent: number;
  reviewsChange: number;
  patientsChange: number;
}

const weeklyIncomeData = [
  { day: "MO", income: 2000 },
  { day: "TU", income: 3000 },
  { day: "WE", income: 5500 },
  { day: "TH", income: 4000 },
  { day: "FR", income: 3500 },
  { day: "SA", income: 5000 },
  { day: "SU", income: 2500 },
];

const monthlyEarningsData = [
  { month: "Jan", sales: 4000, revenue: 2000 },
  { month: "Feb", sales: 5000, revenue: 2500 },
  { month: "Mar", sales: 4500, revenue: 2200 },
  { month: "Apr", sales: 6000, revenue: 3000 },
  { month: "May", sales: 5500, revenue: 2800 },
  { month: "Jun", sales: 7000, revenue: 3500 },
  { month: "Jul", sales: 6500, revenue: 3200 },
  { month: "Aug", sales: 7200, revenue: 3600 },
];

export default function DoctorsDashboard() {
  const { user } = useUser();
  const [doctorName, setDoctorName] = useState<string>("Doctor");
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    pendingReviews: 0,
    activePatients: 0,
    revenueChange: 0,
    appointmentsChange: 0,
    revenueChangePercent: 0,
    appointmentsChangePercent: 0,
    reviewsChange: 0,
    patientsChange: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const emailName = user.email?.split("@")[0] || "Doctor";
        setDoctorName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const allAppointmentsResponse = await fetch('/api/appointments');
        const allAppointmentsData = await allAppointmentsResponse.json();
        
        if (allAppointmentsData.success && allAppointmentsData.appointments) {
          const appointments = allAppointmentsData.appointments;
          
          const thisMonthApps = appointments.filter((apt: any) => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= startOfMonth && aptDate < startOfNextMonth;
          });

          const lastMonthApps = appointments.filter((apt: any) => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= startOfLastMonth && aptDate < startOfMonth;
          });

          const uniquePatients = new Set(appointments.map((apt: any) => apt.userEmailAddress));
          const monthlyRevenue = thisMonthApps.reduce((sum: number, apt: any) => {
            return sum + (apt.estimatedCost || 150);
          }, 0);

          const lastMonthRevenue = lastMonthApps.reduce((sum: number, apt: any) => {
            return sum + (apt.estimatedCost || 150);
          }, 0);

          const revenueChange = monthlyRevenue - lastMonthRevenue;
          const revenueChangePercent = lastMonthRevenue > 0 
            ? ((revenueChange / lastMonthRevenue) * 100)
            : 0;

          const appointmentsChange = thisMonthApps.length - lastMonthApps.length;
          const appointmentsChangePercent = lastMonthApps.length > 0
            ? ((appointmentsChange / lastMonthApps.length) * 100)
            : 0;

          setStats({
            totalPatients: uniquePatients.size || 1245,
            totalAppointments: appointments.length || 15500,
            monthlyRevenue: monthlyRevenue || 89340,
            pendingReviews: 34,
            activePatients: uniquePatients.size || 42400,
            revenueChange,
            appointmentsChange,
            revenueChangePercent,
            appointmentsChangePercent,
            reviewsChange: 12,
            patientsChange: 9.2,
          });
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Set default values
        setStats({
          totalPatients: 1245,
          totalAppointments: 15500,
          monthlyRevenue: 89340,
          pendingReviews: 34,
          activePatients: 42400,
          revenueChange: 38,
          appointmentsChange: 22,
          revenueChangePercent: 38,
          appointmentsChangePercent: 22,
          reviewsChange: 38,
          patientsChange: 9.2,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.email]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Type to search..." 
            className="pl-10 w-full border-gray-200 bg-white"
          />
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-2">
            <Link href="/exact" className="text-sm text-gray-600 hover:text-gray-900">View Exact Match Page</Link>
            <span className="text-gray-300">|</span>
            <Link href="/overview" className="text-sm text-gray-600 hover:text-gray-900">Overview</Link>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Grid3x3 className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <BarChart3 className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
              {doctorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button asChild variant="ghost" size="sm" className="ml-2">
            <a href="/auth/logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </a>
          </Button>
        </div>
      </div>

      {/* First Row - Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Patients */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : formatNumber(stats.totalPatients)}</div>
            <div className={`flex items-center text-xs mt-1 ${stats.patientsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.patientsChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(stats.patientsChange).toFixed(1)}%
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              Last 6 months
            </Button>
          </CardContent>
        </Card>

        {/* Total Appointments */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : formatNumber(stats.totalAppointments)}</div>
            <div className={`flex items-center text-xs mt-1 ${stats.appointmentsChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.appointmentsChangePercent >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(stats.appointmentsChangePercent).toFixed(0)}%
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              Last 4 months
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : formatCurrency(stats.monthlyRevenue)}</div>
            <div className={`flex items-center text-xs mt-1 ${stats.revenueChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueChangePercent >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(stats.revenueChangePercent).toFixed(0)}%
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              Last One year
            </Button>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
            <Bookmark className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : formatCurrency(stats.pendingReviews * 35)}</div>
            <div className={`flex items-center text-xs mt-1 ${stats.reviewsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.reviewsChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(stats.reviewsChange).toFixed(0)}%
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              Last 6 months
            </Button>
          </CardContent>
        </Card>

        {/* Active Patients */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Patients</CardTitle>
            <CardDescription className="text-xs">Daily patients</CardDescription>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : formatNumber(stats.activePatients)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.patientsChange.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Charts and Reports */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Total Income Chart */}
        <Card className="lg:col-span-2 bg-white">
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
            <CardDescription>Weekly report overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyIncomeData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Income']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#incomeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Card */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Report</CardTitle>
            <CardDescription>Weekly activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">Income</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">$5,550</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.34K
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">Expense</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">$3,520</div>
                <div className="flex items-center text-xs text-red-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -1.4K
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm font-medium">Profit</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">$2,350</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3.22K
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Campaign State */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Monthly campaign state</CardTitle>
            <CardDescription>7.58k Social Visitors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>Emails</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">14,250</span>
                <span className="text-xs text-gray-500">(0.3%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <span>Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">4,523</span>
                <span className="text-xs text-gray-500">(3.1%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-gray-400" />
                <span>Clicked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">1,250</span>
                <span className="text-xs text-gray-500">(1.3%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-400" />
                <span>Subscribed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">750</span>
                <span className="text-xs text-gray-500">(9.8%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <span>Errors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">20</span>
                <span className="text-xs text-gray-500">(1.5%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-gray-400" />
                <span>Unsubscribed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">86</span>
                <span className="text-xs text-gray-500">(0.6%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Earnings, Business Plan, Condition */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Total Earning */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Total earning</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">87%</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+38%</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={monthlyEarningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  iconType="square"
                />
                <Bar dataKey="sales" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="revenue" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-orange-500 rounded"></div>
                <span className="text-gray-600">$ Total revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">$ Total sales</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Successful payments</span>
                <span className="font-semibold text-green-600">+$250</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Refund</span>
                <span className="font-semibold text-red-600">+$80</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Plan Card */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>For Business Shark</CardTitle>
            <CardDescription className="text-xs">
              Here, I focus on a range of items and features that we use in life without them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm font-medium mb-3">Choose a plan to get started</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Branding</span>
                  </div>
                  <span className="text-sm font-semibold">$60</span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded bg-blue-50">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked className="rounded" readOnly />
                    <span className="text-sm font-medium">Marketing</span>
                  </div>
                  <span className="text-sm font-semibold">$120</span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Web Development</span>
                  </div>
                  <span className="text-sm font-semibold">$250</span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">App Development</span>
                  </div>
                  <span className="text-sm font-semibold">$320</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxes</span>
                <span className="font-semibold">$32</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total amount</span>
                <span className="text-2xl font-bold">$152</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Pay now
            </Button>
          </CardContent>
        </Card>

        {/* Patients Condition */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Patients Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Excellent</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600">12% increase</span>
                  <span className="text-xs text-green-600 font-semibold">+25%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Good</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">24 patients</span>
                  <span className="text-xs text-green-600 font-semibold">+30%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Average</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">182 Tasks</span>
                  <span className="text-xs text-red-600 font-semibold">-15%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Bad</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">9 patients</span>
                  <span className="text-xs text-green-600 font-semibold">+35%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Not Working</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">3 patients</span>
                  <span className="text-xs text-red-600 font-semibold">-2%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Scraped</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">2 patients</span>
                  <span className="text-xs text-green-600 font-semibold">+1%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
