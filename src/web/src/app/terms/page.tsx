import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            Last updated: November 2024
          </p>

          <h2 className="text-xl font-semibold mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing or using MyUglyRocks, you agree to be bound by these Terms
            of Service. If you do not agree to these terms, please do not use our
            service.
          </p>

          <h2 className="text-xl font-semibold mt-8">2. Description of Service</h2>
          <p>
            MyUglyRocks is a platform for rock tumbling enthusiasts to track their
            cycles, share their results, and connect with the community. We provide
            tools for logging tumbling progress, managing equipment, and sharing
            photos of your work.
          </p>

          <h2 className="text-xl font-semibold mt-8">3. User Accounts</h2>
          <p>To use certain features of our service, you must:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create an account with accurate information</li>
            <li>Maintain the security of your password</li>
            <li>Be responsible for all activity under your account</li>
            <li>Be at least 13 years of age</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">4. User Content</h2>
          <p>When you post content on MyUglyRocks:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You retain ownership of your content</li>
            <li>You grant us a license to display and share your content</li>
            <li>You are responsible for the content you post</li>
            <li>You must not post content that violates others&apos; rights</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post spam, malware, or harmful content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Impersonate others or provide false information</li>
            <li>Attempt to gain unauthorized access to the service</li>
            <li>Use the service for any illegal purpose</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">6. Intellectual Property</h2>
          <p>
            The MyUglyRocks service, including its design, features, and content
            (excluding user-generated content), is owned by us and protected by
            intellectual property laws.
          </p>

          <h2 className="text-xl font-semibold mt-8">7. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these terms.
            You may also delete your account at any time through your account
            settings.
          </p>

          <h2 className="text-xl font-semibold mt-8">8. Disclaimer of Warranties</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties of any kind. We do
            not guarantee that the service will be uninterrupted or error-free.
          </p>

          <h2 className="text-xl font-semibold mt-8">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of
            the service.
          </p>

          <h2 className="text-xl font-semibold mt-8">10. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. Continued use of the service
            after changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-xl font-semibold mt-8">11. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please contact us
            at legal@myuglyrocks.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
