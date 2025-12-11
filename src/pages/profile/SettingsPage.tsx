import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import ProfileDetailsTab from "@/components/profile/settings/ProfileDetailsTab";
import SecurityTab from "@/components/profile/settings/SecurityTab";
import NotificationsTab from "@/components/profile/settings/NotificationsTab";
import AdvancedTab from "@/components/profile/settings/AdvancedTab";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Cài đặt tài khoản</h1>
            <p className="text-muted-foreground">
              Quản lý thông tin cá nhân và cài đặt bảo mật của bạn
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-background rounded-lg shadow-sm">
              <TabsList className="grid w-full grid-cols-4 h-auto p-0 bg-transparent border-b">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent"
                >
                  Thông tin cá nhân
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent"
                >
                  Bảo mật
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent"
                >
                  Thông báo
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent"
                >
                  Nâng cao
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="profile" className="mt-0">
                  <ProfileDetailsTab />
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                  <SecurityTab />
                </TabsContent>

                <TabsContent value="notifications" className="mt-0">
                  <NotificationsTab />
                </TabsContent>

                <TabsContent value="advanced" className="mt-0">
                  <AdvancedTab />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SettingsPage;
