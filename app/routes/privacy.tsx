import { Link } from "react-router";
import { ThemeToggle } from "~/components/nav/theme-toggle";
import { PageWrapper } from "~/components/provider/page-wrapper";
import Logo from "~/components/ui/logo";
import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy | TSA InternHub" },
    { name: "description", content: "Privacy policy for TSA InternHub." },
  ];
}

export default function Privacy() {
  return (
    <>
      <div className="fixed top-0 w-full bg-darkWhite dark:bg-accent z-30 border-b">
        <div className="container mx-auto py-2 px-4 flex justify-between">
          <Link to="/auth/login" className="flex items-center gap-2">
            <Logo classname="relative z-20" size={30} />
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <PageWrapper className="min-h-dvh">
        <div className="max-w-3xl mx-auto px-4 py-24">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: July 16, 2026
            </p>

            <h2>1. Introduction</h2>
            <p>
              TSA LABS ("we," "our," or "us") operates TSA InternHub ("the
              Platform"). This Privacy Policy explains how we collect, use,
              disclose, and protect your personal information.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li>
                <strong>Account Information:</strong> Name, email address,
                password, and profile details when you register.
              </li>
              <li>
                <strong>Profile Information:</strong> Avatar, bio, skills, and
                other details you choose to add to your profile.
              </li>
              <li>
                <strong>Content:</strong> Project submissions, task responses,
                messages, support tickets, and other content you upload or
                create on the Platform.
              </li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li>
                <strong>Usage Data:</strong> Page views, features accessed, time
                spent, and interaction patterns collected via Vercel Analytics.
              </li>
              <li>
                <strong>Device Data:</strong> Browser type, operating system, IP
                address, and device type.
              </li>
              <li>
                <strong>Cookies:</strong> We use essential cookies for
                authentication and session management. Analytics cookies are
                used by Vercel to understand usage patterns.
              </li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Operate, maintain, and improve the Platform.</li>
              <li>Authenticate your identity and authorize access.</li>
              <li>
                Facilitate internship program management (task assignment,
                grading, communication).
              </li>
              <li>
                Send administrative emails (password resets, notifications,
                updates).
              </li>
              <li>Analyze usage trends to improve user experience.</li>
              <li>Ensure platform security and prevent abuse.</li>
            </ul>

            <h2>4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share your data
              with:
            </p>
            <ul>
              <li>
                <strong>Service Providers:</strong> Third-party services we rely
                on to operate the Platform, including Vercel (hosting and
                analytics), Cloudinary (media storage), and MongoDB (database).
                These providers are contractually bound to protect your data.
              </li>
              <li>
                <strong>Program Administrators:</strong> Intern supervisors and
                administrators within your organization who need access to
                evaluate your work and manage the program.
              </li>
              <li>
                <strong>Legal Obligations:</strong> If required by law or to
                protect the rights and safety of the Platform or its users.
              </li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide the Platform's services. When you
              delete your account, we permanently delete your personal data
              within a reasonable timeframe, except where retention is required
              by law.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your data, including encryption in transit and at rest,
              access controls, and regular security audits. However, no method
              of transmission or storage is completely secure.
            </p>

            <h2>7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Delete your personal data (via account deletion).</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Export your data in a portable format.</li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@tsa-internhub.com" className="underline">
                support@tsa-internhub.com
              </a>
              .
            </p>

            <h2>8. Third-Party Links</h2>
            <p>
              The Platform may contain links to external websites. We are not
              responsible for the privacy practices of those sites. We encourage
              you to review their privacy policies.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              The Platform is not intended for individuals under the age of 13.
              We do not knowingly collect personal information from children.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be communicated via email or through the Platform.
              Your continued use after changes take effect constitutes
              acceptance of the updated policy.
            </p>

            <h2>11. Contact</h2>
            <p>
              If you have questions or concerns about this Privacy Policy,
              please contact us at{" "}
              <a href="mailto:support@tsa-internhub.com" className="underline">
                support@tsa-internhub.com
              </a>
              .
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TSA LABS. All rights reserved.
            </p>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
