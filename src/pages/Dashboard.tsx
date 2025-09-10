import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  lowStockProducts: any[];
  recentSales: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    lowStockProducts: [],
    recentSales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [productsData, salesData, lowStockData, recentSalesData] = await Promise.all([
        // Total products
        supabase
          .from('products')
          .select('id')
          .eq('user_id', user?.id),
        
        // Sales stats (last 30 days)
        supabase
          .from('sales')
          .select('total_amount, profit')
          .eq('user_id', user?.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Low stock products
        supabase
          .from('products')
          .select('id, name, quantity, min_quantity')
          .eq('user_id', user?.id)
          .lte('quantity', 10)
          .order('quantity', { ascending: true })
          .limit(5),
        
        // Recent sales
        supabase
          .from('sales')
          .select('id, invoice_number, total_amount, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const totalProducts = productsData.data?.length || 0;
      const totalSales = salesData.data?.length || 0;
      const totalRevenue = salesData.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const totalProfit = salesData.data?.reduce((sum, sale) => sum + sale.profit, 0) || 0;
      const lowStockProducts = lowStockData.data || [];
      const recentSales = recentSalesData.data || [];

      setStats({
        totalProducts,
        totalSales,
        totalRevenue,
        totalProfit,
        lowStockProducts,
        recentSales
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل بيانات لوحة التحكم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك في متجرك</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} ج.م</div>
                  <p className="text-xs text-muted-foreground">
                    آخر 30 يوم
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد المنتجات</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    إجمالي المنتجات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد المبيعات</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">
                    آخر 30 يوم
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalProfit.toFixed(2)} ج.م</div>
                  <p className="text-xs text-muted-foreground">
                    آخر 30 يوم
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>الإجراءات السريعة</CardTitle>
                  <CardDescription>العمليات الأكثر استخداماً</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Link to="/products/add">
                    <Button className="h-20 flex flex-col space-y-2 w-full">
                      <Package className="h-6 w-6" />
                      <span>إضافة منتج</span>
                    </Button>
                  </Link>
                  <Link to="/sales">
                    <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                      <ShoppingCart className="h-6 w-6" />
                      <span>بيع منتج</span>
                    </Button>
                  </Link>
                  <Link to="/reports">
                    <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                      <BarChart3 className="h-6 w-6" />
                      <span>التقارير</span>
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                      <Package className="h-6 w-6" />
                      <span>المنتجات</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تنبيهات مهمة</CardTitle>
                  <CardDescription>منتجات تحتاج لانتباهك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.lowStockProducts.length > 0 ? (
                    stats.lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center space-x-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            متبقي {product.quantity} قطعة فقط
                          </p>
                        </div>
                        <Badge variant="destructive">{product.quantity}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">لا توجد تنبيهات</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>آخر المبيعات</CardTitle>
                <CardDescription>أحدث العمليات في متجرك</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentSales.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">فاتورة {sale.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sale.created_at).toLocaleString('ar-EG')}
                          </p>
                        </div>
                        <Badge variant="secondary">{sale.total_amount} ج.م</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد مبيعات حتى الآن</p>
                    <Link to="/sales">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 ml-2" />
                        ابدأ أول عملية بيع
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;