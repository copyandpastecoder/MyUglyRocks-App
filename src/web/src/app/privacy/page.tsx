import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            Last updated: November 2024
          </p>

          <h2 className="text-xl font-semibold mt-8">1. Information We Collect</h2>
          <p>
            When you use MyUglyRocks, we collect information you provide directly to us,
            including:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account information (email, username, password)</li>
            <li>Profile information (display name, bio, avatar)</li>
            <li>Cycle and tumbling data you choose to track</li>
            <li>Photos you upload</li>
            <li>Comments and posts in the community gallery</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Send you notifications about your tumbling cycles</li>
            <li>Allow you to participate in the community features</li>
            <li>Respond to your comments and questions</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information
            only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information. However, no method of transmission over the Internet is
            100% secure.
          </p>

          <h2 className="text-xl font-semibold mt-8">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us
            at privacy@myuglyrocks.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
