import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/jobs" className="hover:text-blue-600">Browse Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-blue-600">Companies</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
              <li><Link href="/salary-guide" className="hover:text-blue-600">Salary Guide</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/remote-tips" className="hover:text-blue-600">Remote Tips</Link></li>
              <li><Link href="/career-tips" className="hover:text-blue-600">Career Tips</Link></li>
              <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/terms" className="hover:text-blue-600">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li>
              <li><Link href="/cookies" className="hover:text-blue-600">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Buzz2Remote. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
