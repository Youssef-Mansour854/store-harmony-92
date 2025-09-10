import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, BarChart3, Users, ShoppingCart, FileText, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">StoreManager Pro</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
            <Link to="/register">
              <Button>إنشاء حساب جديد</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            الحل الأمثل لإدارة المتاجر والمستودعات
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            أدر متجرك بـ
            <span className="text-primary"> ذكاء وسهولة</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            نظام متكامل لإدارة المنتجات والمبيعات والمخزون مع تقارير تفصيلية وباركود للمنتجات
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                ابدأ الآن مجاناً
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              شاهد العرض التوضيحي
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">مميزات النظام</h2>
            <p className="text-muted-foreground text-lg">
              كل ما تحتاجه لإدارة متجرك في مكان واحد
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-primary mb-4" />
                <CardTitle>إدارة المنتجات</CardTitle>
                <CardDescription>
                  إضافة وتعديل المنتجات مع أسعار الشراء والبيع وإنشاء باركود لكل منتج
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>نظام المبيعات</CardTitle>
                <CardDescription>
                  تسجيل المبيعات سواء منتج واحد أو فاتورة كاملة مع إمكانية حفظ بيانات العملاء
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>التقارير والإحصائيات</CardTitle>
                <CardDescription>
                  تقارير شاملة برسوم بيانية يومية وأسبوعية وشهرية وسنوية
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle>استيراد البيانات</CardTitle>
                <CardDescription>
                  استيراد المنتجات والبيانات من ملفات Excel بسهولة ويسر
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>حماية البيانات</CardTitle>
                <CardDescription>
                  حماية عالية لبيانات متجرك مع نسخ احتياطية آمنة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>سرعة في الأداء</CardTitle>
                <CardDescription>
                  واجهة سريعة وسهلة الاستخدام توفر الوقت والجهد
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">جاهز لتطوير متجرك؟</h2>
          <p className="text-muted-foreground text-lg mb-8">
            ابدأ الآن واكتشف الفرق مع نظام إدارة المتاجر الأكثر تطوراً
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8">
              ابدأ رحلتك الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-semibold">StoreManager Pro</span>
          </div>
          <p className="text-muted-foreground text-sm">
            جميع الحقوق محفوظة © 2024 - نظام إدارة المتاجر والمستودعات
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;