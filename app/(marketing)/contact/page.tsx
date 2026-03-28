import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Contact Us</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Have questions or feedback? We&apos;d love to hear from you.
      </p>
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h2>
          <p className="text-blue-600">support@buzz2remote.com</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Social Media</h2>
          <p className="text-gray-600 dark:text-gray-400">Follow us on Twitter and LinkedIn for updates.</p>
        </div>
      </div>
    </div>
  );
}
