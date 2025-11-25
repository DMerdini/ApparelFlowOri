'use client';
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { FullPageLoader } from "@/components/common/full-page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return <FullPageLoader />;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'SysAdmin')) {
         return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md text-center border-destructive">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">You do not have the necessary permissions to view this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return <>{children}</>;
}
