import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function CookiePolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo variant="horizontal" size="md" />
          </button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth?mode=login")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">Last updated - 1st January 2026</p>

        <div className="space-y-8 text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
          <p>
            This Cookie Policy explains how Oplus ("Oplus", "we", "our", or "us") uses cookies and similar technologies when you visit our website or use our services (collectively, the "Services").
          </p>
          <p>
            This Policy should be read together with our{" "}
            <a href="/privacy" className="text-purple-600 hover:text-purple-500 font-medium">Privacy Policy</a> and{" "}
            <a href="/terms" className="text-purple-600 hover:text-purple-500 font-medium">Terms & Conditions</a>.
          </p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">1. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files stored on your device (computer, mobile phone, or tablet) when you visit a website. Cookies help websites function efficiently, remember user preferences, and improve overall user experience.
            </p>
            <p className="mb-2">Cookies may be:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Session cookies</strong> (deleted when you close your browser)</li>
              <li><strong>Persistent cookies</strong> (remain for a set period or until deleted)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">2. Types of Cookies We Use</h2>
            
            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2 mt-4">2.1 Strictly Necessary Cookies</h3>
            <p className="mb-2">These cookies are essential for the operation of our Services and cannot be switched off. They are used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Enable core functionality</li>
              <li>Maintain secure sessions</li>
              <li>Prevent fraudulent activity</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">2.2 Performance & Analytics Cookies</h3>
            <p className="mb-2">These cookies help us understand how users interact with our Services. They allow us to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Analyze page visits and scroll behavior</li>
              <li>Measure performance and usage trends</li>
              <li>Improve features, layout, and speed</li>
            </ul>
            <p className="mb-4 text-sm italic">All data collected is aggregated and anonymized where possible.</p>

            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">2.3 Functional Cookies</h3>
            <p className="mb-2">These cookies allow the Services to remember choices you make, such as:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Language or region preferences</li>
              <li>Login state</li>
              <li>Personalized settings</li>
            </ul>
            <p className="mb-4">They enhance functionality but are not strictly required.</p>

            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">2.4 Advertising & Monetization Cookies (If Applicable)</h3>
            <p className="mb-2">If enabled, these cookies may be used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Display relevant advertisements</li>
              <li>Measure ad performance</li>
              <li>Prevent repetitive ads</li>
            </ul>
            <p>Advertising cookies do not directly store personally identifiable information.</p>
          </section>


          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">3. Third-Party Cookies</h2>
            <p className="mb-2">Some cookies may be placed by third-party service providers, such as:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Analytics platforms</li>
              <li>Infrastructure or hosting partners</li>
              <li>Payment or monetization services (where applicable)</li>
            </ul>
            <p>These third parties process information in accordance with their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">4. How You Can Manage Cookies</h2>
            <p className="mb-4 font-medium text-gray-800 dark:text-gray-300">You have control over how cookies are used.</p>
            <p className="mb-2">You may:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Configure your browser to block or delete cookies</li>
              <li>Receive alerts when cookies are being used</li>
              <li>Disable non-essential cookies through browser settings</li>
            </ul>
            <p className="text-sm italic">Please note that disabling certain cookies may affect the functionality of the Services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">5. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, law, or our practices. Any updates will be posted on this page with a revised effective date.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">6. Contact Us</h2>
            <p className="mb-4">If you have questions about this Cookie Policy, you can contact us at:</p>
            <p className="mb-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:playgenofficial@gmail.com" className="text-purple-600 hover:text-purple-500 font-medium">
                playgenofficial@gmail.com
              </a>
            </p>
            <p>
              <strong>Social:</strong>{" "}
              <a href="https://instagram.com/oplus.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-500 font-medium">
                @oplus.ai
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] dark:bg-[#0a0a0a] text-white py-6">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo variant="horizontal" size="sm" forceWhite />
          </div>
          <p className="text-gray-400 text-sm">© 2026 Oplus · All Rights Reserved</p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-gray-600">·</span>
            <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
