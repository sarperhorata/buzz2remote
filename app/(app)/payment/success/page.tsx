import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Payment Successful" };

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="gradient-primary rounded-full size-16 flex items-center justify-center mx-auto mb-6 shadow-lg animate-scale-in">
          <CheckCircle className="size-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription is now active. Enjoy all the premium features!
        </p>
        <Button asChild className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all">
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="size-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
