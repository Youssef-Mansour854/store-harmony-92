import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SalesData {
  date: string;
  total_amount: number;
  profit: number;
  sales_count: number;
}

interface ProductSales {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
}

const Reports = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user, period]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSalesData(),
        fetchProductSales(),
        fetchTotalStats()
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل التقارير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    const dateFormat = getDateFormat();
    const { data, error } = await supabase
      .from('sales')
      .select('created_at, total_amount, profit')
      .eq('user_id', user?.id)
      .gte('created_at', getStartDate())
      .order('created_at');

    if (error) throw error;

    // Group data by period
    const groupedData = groupDataByPeriod(data || [], dateFormat);
    setSalesData(groupedData);
  };

  const fetchProductSales = async () => {
    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        total_price,
        profit,
        products!inner(name),
        sales!inner(user_id, created_at)
      `)
      .eq('sales.user_id', user?.id)
      .gte('sales.created_at', getStartDate());

    if (error) throw error;

    // Group by product
    const productMap = new Map<string, ProductSales>();
    
    data?.forEach((item: any) => {
      const productName = item.products.name;
      const existing = productMap.get(productName) || {
        product_name: productName,
        total_quantity: 0,
        total_revenue: 0,
        total_profit: 0
      };

      existing.total_quantity += item.quantity;
      existing.total_revenue += item.total_price;
      existing.total_profit += item.profit;

      productMap.set(productName, existing);
    });

    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10);

    setProductSales(sortedProducts);
  };

  const fetchTotalStats = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('total_amount, profit')
      .eq('user_id', user?.id)
      .gte('created_at', getStartDate());

    if (error) throw error;

    const totalRevenue = data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
    const totalProfit = data?.reduce((sum, sale) => sum + sale.profit, 0) || 0;
    const totalSales = data?.length || 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    setTotalStats({
      totalRevenue,
      totalProfit,
      totalSales,
      averageOrderValue
    });
  };

  const getDateFormat = () => {
    switch (period) {
      case 'daily': return 'YYYY-MM-DD';
      case 'weekly': return 'YYYY-[W]WW';
      case 'monthly': return 'YYYY-MM';
      case 'yearly': return 'YYYY';
      default: return 'YYYY-MM-DD';
    }
  };

  const getStartDate = () => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'yearly':
        return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const groupDataByPeriod = (data: any[], format: string) => {
    const grouped = new Map<string, SalesData>();

    data.forEach((sale) => {
      const date = new Date(sale.created_at);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      const existing = grouped.get(key) || {
        date: key,
        total_amount: 0,
        profit: 0,
        sales_count: 0
      };

      existing.total_amount += sale.total_amount;
      existing.profit += sale.profit;
      existing.sales_count += 1;

      grouped.set(key, existing);
    });

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'يومي';
      case 'weekly': return 'أسبوعي';
      case 'monthly': return 'شهري';
      case 'yearly': return 'سنوي';
      default: return 'يومي';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل التقارير...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
            <p className="text-muted-foreground">تحليل أداء متجرك</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">يومي</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="yearly">سنوي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalRevenue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">
                الفترة: {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalStats.totalProfit.toFixed(2)} ج.م
              </div>
              <p className="text-xs text-muted-foreground">
                هامش الربح: {totalStats.totalRevenue > 0 ? ((totalStats.totalProfit / totalStats.totalRevenue) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد المبيعات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                إجمالي الفواتير
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط قيمة الفاتورة</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.averageOrderValue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">
                لكل فاتورة
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاه المبيعات - {getPeriodLabel()}</CardTitle>
              <CardDescription>المبيعات والأرباح عبر الزمن</CardDescription>
            </CardHeader>
            <CardContent>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)} ج.م`,
                        name === 'total_amount' ? 'المبيعات' : 'الربح'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_amount" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="المبيعات"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="الربح"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  لا توجد بيانات للعرض
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
              <CardDescription>المنتجات الأكثر ربحية</CardDescription>
            </CardHeader>
            <CardContent>
              {productSales.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productSales.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="product_name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} ج.م`, 'الإيرادات']}
                    />
                    <Bar dataKey="total_revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  لا توجد بيانات للعرض
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Sales Table */}
        {productSales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل مبيعات المنتجات</CardTitle>
              <CardDescription>أداء جميع المنتجات في الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">المنتج</th>
                      <th className="text-right p-2">الكمية المباعة</th>
                      <th className="text-right p-2">إجمالي الإيرادات</th>
                      <th className="text-right p-2">إجمالي الربح</th>
                      <th className="text-right p-2">هامش الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSales.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{product.product_name}</td>
                        <td className="p-2">{product.total_quantity}</td>
                        <td className="p-2">{product.total_revenue.toFixed(2)} ج.م</td>
                        <td className="p-2 text-green-600">{product.total_profit.toFixed(2)} ج.م</td>
                        <td className="p-2">
                          <Badge variant="secondary">
                            {((product.total_profit / product.total_revenue) * 100).toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Reports;