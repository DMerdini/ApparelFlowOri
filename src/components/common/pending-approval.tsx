'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-provider";
import { Hourglass } from "lucide-react";

export function PendingApproval() {
    const { signOut } = useAuth();
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                         <Hourglass className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Approval Pending</CardTitle>
                    <CardDescription>
                        Your account has been created successfully, but it needs to be approved by an administrator before you can access the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">
                        You will be notified via email once your account is approved. If you have any questions, please contact support.
                    </p>
                    <Button onClick={signOut} className="w-full">
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
