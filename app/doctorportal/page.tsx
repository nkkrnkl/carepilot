"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Settings, 
  BarChart3, 
  Bell, 
  Calendar,
  Users,
  DollarSign,
  Stethoscope,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ClipboardList,
  Pill,
  TrendingUp,
  TrendingDown,
  UserCheck,
  MessageSquare,
  LogOut
} from "lucide-react";
import { AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";

const weeklyVisitsData = [
  { day: "Mon", visits: 18 },
  { day: "Tue", visits: 24 },
  { day: "Wed", visits: 22 },
  { day: "Thu", visits: 28 },
  { day: "Fri", visits: 20 },
  { day: "Sat", visits: 12 },
  { day: "Sun", visits: 8 },
];

const monthlyRevenueData = [
  { name: "Jan", revenue: 45000, expenses: 12000 },
  { name: "Feb", revenue: 52000, expenses: 13000 },
  { name: "Mar", revenue: 48000, expenses: 12500 },
  { name: "Apr", revenue: 61000, expenses: 14000 },
  { name: "May", revenue: 55000, expenses: 13500 },
  { name: "Jun", revenue: 67000, expenses: 15000 },
  { name: "Jul", revenue: 59000, expenses: 14500 },
  { name: "Aug", revenue: 72000, expenses: 16000 },
];

const patientStatusData = [
  { label: "Active Patients", value: 68, count: "1,245 total", change: "+12%", color: "bg-green-500" },
  { label: "New Patients", value: 18, count: "23 this month", change: "+8%", color: "bg-blue-400" },
  { label: "Follow-ups", value: 42, count: "156 scheduled", change: "-5%", color: "bg-blue-600" },
  { label: "Pending Reviews", value: 15, count: "34 lab results", change: "+22%", color: "bg-orange-500" },
  { label: "Urgent Cases", value: 8, count: "12 patients", change: "-3%", color: "bg-red-500" },
  { label: "Discharged", value: 5, count: "9 this week", change: "+2%", color: "bg-purple-500" },
];

const todayAppointments = [
  { time: "9:00 AM", patient: "Sarah Johnson", type: "Follow-up", status: "Confirmed" },
  { time: "9:30 AM", patient: "Michael Chen", type: "New Patient", status: "Confirmed" },
  { time: "10:15 AM", patient: "Emily Rodriguez", type: "Consultation", status: "Waiting" },
  { time: "11:00 AM", patient: "David Thompson", type: "Follow-up", status: "Confirmed" },
  { time: "2:00 PM", patient: "Lisa Anderson", type: "Lab Review", status: "Pending" },
  { time: "3:30 PM", patient: "Robert Wilson", type: "Follow-up", status: "Confirmed" },
];

export default function DoctorsDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Dr. Smith</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search patients, charts, notes..." 
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          <Avatar>
            <AvatarFallback className="bg-blue-600 text-white">DS</AvatarFallback>
          </Avatar>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2 from yesterday
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              View Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Active Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% this month
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              View Patients
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$72k</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% vs last month
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              View Reports
            </Button>
          </CardContent>
        </Card>

        {/* Pending Lab Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              12 urgent
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
              Review Now
            </Button>
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2 text-xs">Pending</Badge>
                <div className="text-2xl font-bold">8</div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  To approve
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Pill className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Visits Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Patient Visits</CardTitle>
            <CardDescription>Patient visit trends over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyVisitsData}>
                <defs>
                  <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: number) => [`${value} visits`, 'Visits']}
                />
                <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#visitsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.slice(0, 5).map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-semibold text-sm">{appointment.time}</div>
                    <div className="text-xs text-gray-500">{appointment.patient}</div>
                    <div className="text-xs text-gray-400">{appointment.type}</div>
                  </div>
                </div>
                <Badge variant={appointment.status === 'Confirmed' ? 'default' : appointment.status === 'Waiting' ? 'secondary' : 'outline'}>
                  {appointment.status}
                </Badge>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2">
              View Full Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue vs expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl font-bold">$72k</div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +15%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
                <Bar dataKey="expenses" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="revenue" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Revenue</span>
                </div>
                <span className="text-sm text-green-600 font-medium">$72,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Expenses</span>
                </div>
                <span className="text-sm text-red-600 font-medium">$16,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Status</CardTitle>
            <CardDescription>Practice overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientStatusData.map((status, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{status.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{status.count}</span>
                      <span className={`text-xs ${status.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {status.change}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${status.color} transition-all rounded-full`}
                      style={{ width: `${status.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Stethoscope className="h-4 w-4 mr-2" />
              New Patient Visit
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Review Lab Results
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Pill className="h-4 w-4 mr-2" />
              Write Prescription
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Patient Message
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              View Charts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
