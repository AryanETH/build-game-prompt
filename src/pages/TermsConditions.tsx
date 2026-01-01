import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function TermsConditions() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">Last updated - 1st January 2026</p>

        <div className="space-y-8 text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
          <p>
            These Terms & Conditions ("Terms") govern your access to and use of Oplus, including its website, applications, and related services (collectively, the "Services"). By accessing or using Oplus, you agree to be bound by these Terms.
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-300">
            If you do not agree to these Terms, you may not use the Services.
          </p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">1. Eligibility</h2>
            <p className="mb-2">To use Oplus, you must:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Be at least 13 years of age</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
            </ul>
            <p>If you are using Oplus on behalf of an organization, you represent that you are authorized to accept these Terms on its behalf.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">2. Account Registration</h2>
            <p className="mb-2">Some features may require creating an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            <p>Oplus is not responsible for losses resulting from unauthorized account use.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">3. Use of Services</h2>
            <p className="mb-2">You agree to use the Services only for lawful purposes and in compliance with these Terms. You must not:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe intellectual property or proprietary rights</li>
              <li>Upload malicious code or disrupt platform security</li>
              <li>Abuse, harass, or harm other users</li>
              <li>Attempt to reverse engineer or exploit the platform</li>
            </ul>
            <p>We reserve the right to suspend or terminate access for violations.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">4. User-Generated Content</h2>
            <p className="mb-4 font-medium text-gray-800 dark:text-gray-300">You retain ownership of the content you create or upload ("User Content").</p>
            <p className="mb-4">
              By submitting User Content, you grant Oplus a non-exclusive, worldwide, royalty-free license to host, store, display, distribute, and process such content for the purpose of operating and improving the Services.
            </p>
            <p>You represent that you have all necessary rights to the content you submit.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">5. AI-Generated Content</h2>
            <p className="mb-2">Oplus provides AI-powered tools for game creation and content generation.</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>AI-generated outputs are produced automatically and may not be accurate</li>
              <li>Oplus does not guarantee originality, performance, or outcomes</li>
              <li>Users are responsible for reviewing and using AI-generated content appropriately</li>
            </ul>
          </section>


          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">6. Intellectual Property</h2>
            <p className="mb-4">
              All content, software, designs, logos, and trademarks on Oplus (excluding User Content) are the property of Oplus or its licensors and are protected by applicable laws.
            </p>
            <p>You may not copy, modify, distribute, or create derivative works without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">7. Payments and Virtual Items (If Applicable)</h2>
            <p className="mb-2">Oplus may offer paid features, subscriptions, or virtual items (such as coins).</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All payments are final unless otherwise required by law</li>
              <li>Virtual items have no real-world monetary value</li>
              <li>Oplus reserves the right to modify or discontinue paid offerings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">8. Third-Party Services</h2>
            <p className="mb-4">The Services may integrate or link to third-party platforms or services.</p>
            <p>Oplus is not responsible for third-party content, services, or practices. Your use of such services is governed by their respective terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">9. Termination</h2>
            <p className="mb-2">We may suspend or terminate your access to the Services:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>For violation of these Terms</li>
              <li>For security or legal reasons</li>
              <li>At our discretion, with or without notice</li>
            </ul>
            <p>You may stop using the Services at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">10. Disclaimer of Warranties</h2>
            <p className="mb-4">
              The Services are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis.
            </p>
            <p>Oplus disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">11. Limitation of Liability</h2>
            <p className="mb-2">To the maximum extent permitted by law, Oplus shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>Errors or interruptions in service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">12. Indemnification</h2>
            <p className="mb-2">You agree to indemnify and hold harmless Oplus from any claims, damages, or liabilities arising out of:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your use of the Services</li>
              <li>Your User Content</li>
              <li>Your violation of these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">14. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at{" "}
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
