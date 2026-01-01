import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">Last updated - 1st January 2026</p>

        <div className="space-y-8 text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
          <p>
            Oplus ("Oplus", "we", "our", or "us") values the trust you place in us and is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard information when you access or use our website, applications, and services (collectively, the "Services").
          </p>
          <p>
            By using Oplus, you agree to the collection and use of information in accordance with this Privacy Policy.
          </p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">1. Information We Collect</h2>
            <p className="mb-4">We collect information to provide, operate, and improve our Services.</p>
            
            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">1.1 Information You Provide to Us</h3>
            <p className="mb-2">We may collect information that you voluntarily provide, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Name, username, or profile details</li>
              <li>Email address and contact information</li>
              <li>Content you create, upload, or share (including prompts, games, comments, messages)</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">1.2 Information Collected Automatically</h3>
            <p className="mb-2">When you use our Services, we automatically collect certain information, such as:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Device information (device type, operating system, browser type)</li>
              <li>Log data (IP address, timestamps, pages viewed, interactions)</li>
              <li>Usage data (scroll activity, feature usage, session duration)</li>
              <li>Approximate location (city or country level)</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">1.3 Cookies and Similar Technologies</h3>
            <p className="mb-2">We use cookies, pixels, and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Enable core functionality</li>
              <li>Understand usage patterns</li>
              <li>Improve performance and user experience</li>
            </ul>
            <p>You may manage cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">2. How We Use Information</h2>
            <p className="mb-2">We use the information we collect for purposes including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Providing and maintaining the Services</li>
              <li>Enabling AI-powered game creation and social interactions</li>
              <li>Personalizing content, feeds, and recommendations</li>
              <li>Monitoring, analyzing, and improving performance and reliability</li>
              <li>Ensuring safety, security, and fraud prevention</li>
              <li>Communicating with users regarding updates, features, or support</li>
            </ul>
          </section>


          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">3. AI-Powered Features</h2>
            <p className="mb-2">Oplus uses artificial intelligence technologies to enable features such as game generation and content personalization.</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>User inputs may be processed by automated systems to generate outputs</li>
              <li>AI-generated content is produced algorithmically and may vary in accuracy</li>
              <li>User data is not used to train public or third-party AI models without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">4. Sharing of Information</h2>
            <p className="mb-4 font-medium text-gray-800 dark:text-gray-300">We do not sell personal information.</p>
            <p className="mb-2">We may share information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>With service providers and infrastructure partners who support our operations</li>
              <li>With analytics, security, or payment partners (where applicable)</li>
              <li>To comply with legal obligations or lawful requests</li>
              <li>To protect the rights, safety, and property of Oplus, users, or others</li>
            </ul>
            <p>All third parties are required to handle information in accordance with applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">5. Data Retention</h2>
            <p className="mb-2">We retain personal information only for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Fulfill the purposes outlined in this Policy</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">6. Data Security</h2>
            <p className="mb-4">
              We implement reasonable administrative, technical, and organizational measures to safeguard information against unauthorized access, loss, misuse, or alteration.
            </p>
            <p>
              However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">7. Children's Information</h2>
            <p>
              Oplus does not knowingly collect personal information from individuals under the age of 13. If we become aware that such information has been collected, we will take appropriate steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">8. Your Choices and Rights</h2>
            <p className="mb-2">Depending on applicable law, you may have rights to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Access, update, or delete your personal information</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Object to or restrict certain processing activities</li>
            </ul>
            <p>Requests may be submitted using the contact information below.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">9. Third-Party Services</h2>
            <p>
              Our Services may include links to third-party websites or services. Oplus is not responsible for the privacy practices or content of those third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Updates will be posted on this page with a revised effective date. Continued use of the Services constitutes acceptance of the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">11. Contact Us</h2>
            <p className="mb-4">
              If you have a query, concern, or complaint in relation to the collection or usage of your personal data under this Privacy Policy, please contact us at{" "}
              <a href="mailto:playgenofficial@gmail.com" className="text-purple-600 hover:text-purple-500 font-medium">
                playgenofficial@gmail.com
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
