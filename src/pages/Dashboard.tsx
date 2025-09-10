import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  LogOut,
  User
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">StoreManager Pro</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span>{user?.user_metadata?.full_name || user?.email || 'المستخدم'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك في متجر الأمانة</p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,240 ج.م</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 ml-1" />
                +12.5%
              </span>
              من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                45 منتج جديد
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبيعات اليومية</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 ml-1" />
                +8.2%
              </span>
              من الأمس
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                23 عميل جديد
              </Badge>
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
            <Button className="h-20 flex flex-col space-y-2">
              <Package className="h-6 w-6" />
              <span>إضافة منتج</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <ShoppingCart className="h-6 w-6" />
              <span>بيع منتج</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>التقارير</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>العملاء</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تنبيهات مهمة</CardTitle>
            <CardDescription>عناصر تحتاج لانتباهك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">منتجات قاربت على النفاد</p>
                <p className="text-xs text-muted-foreground">12 منتج متبقي أقل من 10 قطع</p>
              </div>
              <Button size="sm" variant="outline">عرض</Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">منتجات نفدت من المخزون</p>
                <p className="text-xs text-muted-foreground">5 منتجات غير متوفرة</p>
              </div>
              <Button size="sm" variant="outline">عرض</Button>
            </div>

            <div className="flex items-center space-x-4">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">منتجات بطيئة الحركة</p>
                <p className="text-xs text-muted-foreground">8 منتجات لم تُباع هذا الشهر</p>
              </div>
              <Button size="sm" variant="outline">عرض</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>آخر العمليات في متجرك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">تم بيع منتج: شامبو هيد آند شولدرز</p>
                <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
              </div>
              <Badge variant="secondary">45 ج.م</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">تم إضافة منتج جديد: صابون ديتول</p>
                <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
              </div>
              <Badge variant="outline">جديد</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">تحديث مخزون: أرز العلالي 5 كيلو</p>
                <p className="text-xs text-muted-foreground">منذ 30 دقيقة</p>
              </div>
              <Badge variant="secondary">+50 قطعة</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;