import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Successful" };

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your subscription is now active. Enjoy all the premium features!
        </p>
        <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
