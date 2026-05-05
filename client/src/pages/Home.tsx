import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import UrlBar from '@/components/RequestBuilder/UrlBar';
import ParamsTab from '@/components/RequestBuilder/ParamsTab';
import HeadersTab from '@/components/RequestBuilder/HeadersTab';
import BodyTab from '@/components/RequestBuilder/BodyTab';
import AuthTab from '@/components/RequestBuilder/AuthTab';
import StatusBar from '@/components/ResponseViewer/StatusBar';
import BodyViewer from '@/components/ResponseViewer/BodyViewer';
import HeadersViewer from '@/components/ResponseViewer/HeadersViewer';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Navbar */}
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <span className="font-semibold text-sm tracking-tight">Postman Clone</span>
        <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden p-4 gap-4">
        {/* URL Bar */}
        <UrlBar />

        {/* Request Tabs */}
        <Tabs defaultValue="params">
          <TabsList>
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
          </TabsList>
          <TabsContent value="params"><ParamsTab /></TabsContent>
          <TabsContent value="headers"><HeadersTab /></TabsContent>
          <TabsContent value="body"><BodyTab /></TabsContent>
          <TabsContent value="auth"><AuthTab /></TabsContent>
        </Tabs>

        <Separator />

        {/* Response */}
        <div className="flex flex-col flex-1 overflow-hidden gap-2">
          <StatusBar />
          <Tabs defaultValue="body" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="w-fit">
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
            </TabsList>
            <TabsContent value="body" className="flex-1 overflow-hidden">
              <BodyViewer />
            </TabsContent>
            <TabsContent value="headers" className="overflow-auto">
              <HeadersViewer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
