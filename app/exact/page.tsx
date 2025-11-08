"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Settings, 
  BarChart3, 
  Bell, 
  Mail, 
  ShoppingCart, 
  DollarSign, 
  Bookmark, 
  Wallet,
  CreditCard,
  Eye,
  Sun,
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";

// Exact data from the image
const weeklyIncomeData = [
  { day: "MO", value: 3000 },
  { day: "TU", value: 4000 },
  { day: "WE", value: 5000 },
  { day: "TH", value: 4500 },
  { day: "FR", value: 4000 },
  { day: "SA", value: 5500 },
  { day: "SU", value: 6000 },
];

const earningBarData = [
  { name: "Jan", bottom: 3000, top: 1000 },
  { name: "Feb", bottom: 2000, top: 1000 },
  { name: "Mar", bottom: 3500, top: 1500 },
  { name: "Apr", bottom: 3000, top: 1500 },
  { name: "May", bottom: 4000, top: 2000 },
  { name: "Jun", bottom: 3500, top: 2000 },
  { name: "Jul", bottom: 4500, top: 2500 },
  { name: "Aug", bottom: 4000, top: 2500 },
];

export default function ExactDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-4 flex justify-start">
        <Button asChild variant="outline" className="mb-2">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
      {/* Header - Exact Match */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Type to search..." 
            className="pl-10 w-full border-gray-200 bg-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/settings">
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <BarChart3 className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">U</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Top Row - 5 Metric Cards - Exact Layout */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Sales Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Sales</CardTitle>
            <div className="h-8 w-8 rounded-md bg-orange-100 flex items-center justify-center">
              <Mail className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$13.4k</div>
            <div className="flex items-center text-xs text-green-600 mt-1 mb-3">
              <TrendingUp className="h-3 w-3 mr-1" />
              +38%
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-7 border-gray-200 text-gray-600">
              Last 6 months
            </Button>
          </CardContent>
        </Card>

        {/* Total Orders Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Orders</CardTitle>
            <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">155K</div>
            <div className="flex items-center text-xs text-green-600 mt-1 mb-3">
              <TrendingUp className="h-3 w-3 mr-1" />
              +22%
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-7 border-gray-200 text-gray-600">
              Last 4 months
            </Button>
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Profit</CardTitle>
            <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$89.34k</div>
            <div className="flex items-center text-xs text-red-600 mt-1 mb-3">
              <TrendingDown className="h-3 w-3 mr-1" />
              -16%
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-7 border-gray-200 text-gray-600">
              Last One year
            </Button>
          </CardContent>
        </Card>

        {/* Bookmarks Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Bookmarks</CardTitle>
            <div className="h-8 w-8 rounded-md bg-orange-100 flex items-center justify-center">
              <Bookmark className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$1,200</div>
            <div className="flex items-center text-xs text-green-600 mt-1 mb-3">
              <TrendingUp className="h-3 w-3 mr-1" />
              +38%
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-7 border-gray-200 text-gray-600">
              Last 6 months
            </Button>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="mb-2 text-xs bg-gray-100 text-gray-600 border-0">Daily customers</Badge>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">42.4k</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  +9.2%
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="28" cy="20" r="10" stroke="#9ca3af" strokeWidth="2" fill="none"/>
                  <path d="M14 42 C14 34 20 28 28 28 C36 28 42 34 42 42" stroke="#9ca3af" strokeWidth="2" fill="none"/>
                  <circle cx="23" cy="18" r="2" fill="#9ca3af"/>
                  <circle cx="33" cy="18" r="2" fill="#9ca3af"/>
                  <path d="M25 22 Q28 25 31 22" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - 3 Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Total Income Chart */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Total Income</CardTitle>
            <CardDescription className="text-xs text-gray-500">Weekly report overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyIncomeData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradientExact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                  domain={[0, 6000]} 
                  ticks={[1000, 2000, 3000, 4000, 5000, 6000]}
                  tickFormatter={(value) => `$${value / 1000}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#14b8a6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#incomeGradientExact)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Report</CardTitle>
            <CardDescription className="text-xs text-gray-500">Weekly activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">$5,550</div>
                  <div className="text-xs text-gray-500">Income</div>
                </div>
              </div>
              <div className="text-sm font-medium text-green-600">+2.34K</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">$3,520</div>
                  <div className="text-xs text-gray-500">Expense</div>
                </div>
              </div>
              <div className="text-sm font-medium text-red-600">-1.4K</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">$2,350</div>
                  <div className="text-xs text-gray-500">Profit</div>
                </div>
              </div>
              <div className="text-sm font-medium text-green-600">+3.22K</div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Campaign State */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Monthly campaign state</CardTitle>
            <CardDescription className="text-xs text-gray-500">7.58k Social Visitors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Emails</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">14,250</span>
                <span className="text-xs text-gray-500">0.3%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Opened</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">4,523</span>
                <span className="text-xs text-gray-500">3.1%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Sun className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Clicked</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">1,250</span>
                <span className="text-xs text-gray-500">1.3%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Subscribed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">750</span>
                <span className="text-xs text-gray-500">9.8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Errors</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">20</span>
                <span className="text-xs text-gray-500">1.5%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <X className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Unsubscribed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">86</span>
                <span className="text-xs text-gray-500">0.6%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - 3 Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Total Earning */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Total earning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl font-bold text-gray-900">87%</div>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                +38%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={earningBarData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="bottom" stackId="a" fill="#1e40af" radius={[0, 0, 0, 0]} />
                <Bar dataKey="top" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-5 space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Total revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Successful payments</span>
                  <span className="text-sm text-green-600 font-medium">+$250</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Total sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Refund</span>
                  <span className="text-sm text-green-600 font-medium">+$80</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Plan */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">For Business Shark</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Here, I focus on a range of items and features that we use in life without them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-900 mb-3">Choose a plan to get started</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="branding" className="border-gray-300" />
                    <label htmlFor="branding" className="text-sm text-gray-700 cursor-pointer">Branding</label>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">$60</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="marketing" defaultChecked className="border-gray-300" />
                    <label htmlFor="marketing" className="text-sm text-gray-700 cursor-pointer">Marketing</label>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">$120</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="web" className="border-gray-300" />
                    <label htmlFor="web" className="text-sm text-gray-700 cursor-pointer">Web Development</label>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">$250</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="app" className="border-gray-300" />
                    <label htmlFor="app" className="text-sm text-gray-700 cursor-pointer">App Development</label>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">$320</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Taxes</span>
                <span className="font-semibold text-gray-900">$32</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-gray-900">Total amount</span>
                <span className="text-2xl font-bold text-gray-900">$152</span>
              </div>
            </div>
            <Button className="w-full mt-5 bg-gray-800 hover:bg-gray-900 text-white h-10 font-medium">
              Pay now
            </Button>
          </CardContent>
        </Card>

        {/* Vehicles Condition */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Vehicles Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Excellent</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500">12% increase</span>
                    <span className="text-xs text-green-600 font-medium">+25%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-green-500 transition-all rounded-full"
                    style={{ width: "55%" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Good</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500">24 vehicles</span>
                    <span className="text-xs text-green-600 font-medium">+30%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-blue-400 transition-all rounded-full"
                    style={{ width: "20%" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Average</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500">182 Tasks</span>
                    <span className="text-xs text-red-600 font-medium">-15%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-blue-600 transition-all rounded-full"
                    style={{ width: "12%" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Bad</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500">9 vehicles</span>
                    <span className="text-xs text-green-600 font-medium">+35%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-orange-500 transition-all rounded-full"
                    style={{ width: "7%" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Not Working</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500">3 vehicles</span>
                    <span className="text-xs text-red-600 font-medium">-2%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-red-500 transition-all rounded-full"
                    style={{ width: "4%" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Scraped</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500">2 vehicles</span>
                    <span className="text-xs text-green-600 font-medium">+1%</span>
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-purple-500 transition-all rounded-full"
                    style={{ width: "2%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

