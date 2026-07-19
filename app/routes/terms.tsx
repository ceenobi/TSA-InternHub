import { Link } from "react-router";
import { ThemeToggle } from "~/components/nav/theme-toggle";
import { PageWrapper } from "~/components/provider/page-wrapper";
import Logo from "~/components/ui/logo";
import type { Route } from "./+types/terms";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms and Conditions | TSA InternHub" },
    { name: "description", content: "Terms and conditions governing the use of TSA InternHub." },
  ];
}

export default function Terms() {
  return (
    <PageWrapper className="min-h-dvh">
      <div className="fixed w-full z-30 top-0 py-2 px-4 flex justify-between bg-mainWhite/80 dark:bg-background/80 backdrop-blur-sm">
        <Link to="/auth/login" className="flex items-center gap-2">
          <Logo classname="relative z-20" size={30} />
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-24">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1>Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 16, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using TSA InternHub ("the Platform"), you agree to be bound by these
            Terms and Conditions. If you do not agree, you may not use the Platform.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            TSA InternHub is a management platform that facilitates internship program administration,
            including but not limited to project tracking, task management, communication, and
            performance evaluation. The Platform is operated by TSA LABS.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            You must create an account to use the Platform. You agree to provide accurate, current,
            and complete information and to keep your credentials confidential. You are responsible
            for all activity under your account.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose or in violation of any applicable law.</li>
            <li>Attempt to gain unauthorized access to any part of the Platform or its systems.</li>
            <li>Interfere with the proper functioning of the Platform, including introducing malware.</li>
            <li>Impersonate any person or entity or misrepresent your affiliation.</li>
            <li>Upload or share content that is illegal, harmful, discriminatory, or harassing.</li>
          </ul>

          <h2>5. User Content</h2>
          <p>
            You retain ownership of content you submit to the Platform. By submitting content, you
            grant TSA LABS a non-exclusive, worldwide, royalty-free license to use, store, and
            display that content solely for the purpose of operating and improving the Platform.
          </p>

          <h2>6. Privacy</h2>
          <p>
            Your use of the Platform is subject to our{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>, which explains how we
            collect, use, and protect your personal data.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Platform, its code, design, and branding are owned by TSA LABS. You may not copy,
            modify, distribute, or reverse-engineer any part of the Platform without prior written
            consent.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            TSA LABS provides the Platform on an "as is" basis. To the fullest extent permitted by
            law, TSA LABS disclaims all warranties, express or implied. In no event shall TSA LABS
            be liable for any indirect, incidental, or consequential damages arising from your use
            of the Platform.
          </p>

          <h2>9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to the Platform at any time,
            with or without notice, for conduct that violates these Terms or is otherwise harmful
            to the Platform or its users.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated via
            email or through the Platform. Continued use after changes take effect constitutes
            acceptance of the new Terms.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of the jurisdiction in which TSA LABS operates,
            without regard to its conflict of law provisions.
          </p>

          <h2>12. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <a href="mailto:support@internhub.com" className="underline">support@internhub.com</a>.
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TSA LABS. All rights reserved.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
