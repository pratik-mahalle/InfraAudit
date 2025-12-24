import React from 'react';
import { Helmet } from 'react-helmet';
import { Shield, CheckCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'May 15, 2025';

  return (
    <>
      <Helmet>
        <title>Privacy Policy | InfrAudit</title>
        <meta name="description" content="Learn how InfrAudit collects, uses, and protects your personal information and data in compliance with global privacy regulations." />
      </Helmet>

      <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            At InfrAudit, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you use our multi-cloud infrastructure monitoring platform. 
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access the platform.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Contents</h2>
          <ul className="space-y-2">
            <li>
              <a href="#information-collection" className="text-blue-600 hover:underline">1. Information We Collect</a>
            </li>
            <li>
              <a href="#use-of-information" className="text-blue-600 hover:underline">2. How We Use Your Information</a>
            </li>
            <li>
              <a href="#disclosure-of-information" className="text-blue-600 hover:underline">3. Disclosure of Your Information</a>
            </li>
            <li>
              <a href="#security" className="text-blue-600 hover:underline">4. Security of Your Information</a>
            </li>
            <li>
              <a href="#third-party-websites" className="text-blue-600 hover:underline">5. Third-Party Websites</a>
            </li>
            <li>
              <a href="#data-retention" className="text-blue-600 hover:underline">6. Data Retention</a>
            </li>
            <li>
              <a href="#childrens-privacy" className="text-blue-600 hover:underline">7. Children's Privacy</a>
            </li>
            <li>
              <a href="#international-data-transfers" className="text-blue-600 hover:underline">8. International Data Transfers</a>
            </li>
            <li>
              <a href="#your-rights" className="text-blue-600 hover:underline">9. Your Privacy Rights</a>
            </li>
            <li>
              <a href="#policy-changes" className="text-blue-600 hover:underline">10. Changes to This Privacy Policy</a>
            </li>
            <li>
              <a href="#contact-us" className="text-blue-600 hover:underline">11. Contact Us</a>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-10">
          <section id="information-collection">
            <h2 className="text-2xl font-bold">1. Information We Collect</h2>
            <h3 className="text-xl font-semibold mt-4">Personal Information</h3>
            <p>
              We may collect personal information that you voluntarily provide to us when you register for the platform,
              express interest in obtaining information about us or our products and services, participate in activities 
              on the platform, or otherwise contact us. The personal information we collect may include:
            </p>
            <ul>
              <li>Name and contact information (such as email address, phone number, etc.)</li>
              <li>Billing information and transaction data</li>
              <li>Account credentials</li>
              <li>Employer and job title</li>
              <li>Preferences and feedback</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Cloud Infrastructure Data</h3>
            <p>
              To provide our core services, we collect and process data about your cloud infrastructure when you connect 
              your cloud providers to our platform. This includes:
            </p>
            <ul>
              <li>Cloud resource metadata (resource IDs, types, names, etc.)</li>
              <li>Resource usage metrics and logs</li>
              <li>Configuration settings and changes</li>
              <li>Billing and cost information</li>
            </ul>
            <p>
              We do not collect or process the actual data stored within your cloud resources.
            </p>

            <h3 className="text-xl font-semibold mt-4">Automatically Collected Information</h3>
            <p>
              We automatically collect certain information when you visit, use, or navigate the platform. This information does not reveal 
              your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, 
              operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our 
              platform, and other technical information.
            </p>
          </section>

          <section id="use-of-information">
            <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
            <p>
              We use personal information collected via our platform for a variety of business purposes described below:
            </p>
            <ul>
              <li><strong>To provide and maintain our platform,</strong> including to monitor the usage of our platform.</li>
              <li><strong>To manage your account,</strong> including to manage your registration as a user of the platform.</li>
              <li><strong>To provide you with support and respond to your inquiries,</strong> including to investigate and address your concerns and monitor and improve our responses.</li>
              <li><strong>To enable user-to-user communications,</strong> with your consent and as expressly requested.</li>
              <li><strong>To send you marketing and promotional communications,</strong> if you have opted in to receive such communications.</li>
              <li><strong>To improve our platform, products, marketing, and user experience.</strong></li>
              <li><strong>For compliance, fraud prevention, and safety,</strong> including enforcing our terms of use and this privacy policy, protecting our rights, safety and property, and protecting against and deterring fraudulent, harmful, unauthorized, unethical, or illegal activity.</li>
            </ul>
          </section>

          <section id="disclosure-of-information">
            <h2 className="text-2xl font-bold">3. Disclosure of Your Information</h2>
            <p>
              We may share your information in the following situations:
            </p>
            <ul>
              <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
              <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
              <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
              <li><strong>With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this privacy policy.</li>
              <li><strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
              <li><strong>With Other Users:</strong> When you share personal information or otherwise interact with public areas of the platform, such information may be viewed by all users.</li>
              <li><strong>Legal Obligations:</strong> We may disclose your information where required to do so by law or in response to valid requests by public authorities.</li>
            </ul>
          </section>

          <section id="security">
            <h2 className="text-2xl font-bold">4. Security of Your Information</h2>
            <p>
              We use appropriate technical and organizational security measures designed to protect the security of any personal 
              information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. 
              Although we will do our best to protect your personal information, transmission of personal information to and from 
              our platform is at your own risk. You should only access the services within a secure environment.
            </p>
            <p>
              Our security measures include:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Strict access controls and authentication mechanisms</li>
              <li>Regular security training for all employees</li>
              <li>24/7 monitoring for suspicious activities</li>
            </ul>
          </section>

          <section id="third-party-websites">
            <h2 className="text-2xl font-bold">5. Third-Party Websites</h2>
            <p>
              Our platform may contain advertisements from third parties that are not affiliated with us and which may link to other 
              websites, online services, or mobile applications. We cannot guarantee the safety and privacy of data you provide to any 
              third parties. Any data collected by third parties is not covered by this privacy policy. We are not responsible for the 
              content or privacy and security practices and policies of any third parties, including other websites, services, or 
              applications that may be linked to or from the platform.
            </p>
          </section>

          <section id="data-retention">
            <h2 className="text-2xl font-bold">6. Data Retention</h2>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy 
              policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). 
              When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it.
            </p>
          </section>

          <section id="childrens-privacy">
            <h2 className="text-2xl font-bold">7. Children's Privacy</h2>
            <p>
              Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from 
              children under 18. If you are a parent or guardian and you are aware that your child has provided us with personal information, 
              please contact us. If we become aware that we have collected personal information from children without verification of parental 
              consent, we take steps to remove that information from our servers.
            </p>
          </section>

          <section id="international-data-transfers">
            <h2 className="text-2xl font-bold">8. International Data Transfers</h2>
            <p>
              We are based in the United States. If you are accessing our platform from outside the United States, be aware that your 
              information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may 
              share your personal information, in the United States and other countries. If you are a resident in the European Economic Area, 
              then these countries may not have data protection laws or other similar laws as comprehensive as those in your country. 
              We will take all necessary measures to protect your personal information in accordance with this privacy policy and applicable law.
            </p>
          </section>

          <section id="your-rights">
            <h2 className="text-2xl font-bold">9. Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul>
              <li><strong>Right to Access:</strong> You have the right to request copies of your personal information.</li>
              <li><strong>Right to Rectification:</strong> You have the right to request that we correct inaccurate information about you.</li>
              <li><strong>Right to Erasure:</strong> You have the right to request that we delete your personal information, subject to certain exceptions.</li>
              <li><strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal information.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
              <li><strong>Right to Object:</strong> You have the right to object to our processing of your personal information.</li>
            </ul>
            <p>
              If you would like to exercise any of these rights, please contact us using the information provided below. We will respond 
              to your request within the timeframe required by applicable law.
            </p>
          </section>

          <section id="policy-changes">
            <h2 className="text-2xl font-bold">10. Changes to This Privacy Policy</h2>
            <p>
              We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy 
              on this page and updating the "Last Updated" date at the top of this privacy policy. You are advised to review this privacy 
              policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.
            </p>
          </section>

          <section id="contact-us">
            <h2 className="text-2xl font-bold">11. Contact Us</h2>
            <p>
              If you have questions or comments about this privacy policy, you may contact us at:
            </p>
            <div className="mt-4">
              <p><strong>InfrAudit, Inc.</strong></p>
              <p>350 California St</p>
              <p>San Francisco, CA 94104</p>
              <p>United States</p>
              <p>Email: privacy@infraudit.com</p>
              <p>Phone: +1 (800) 555-1234</p>
            </div>
          </section>
        </div>

        {/* Compliance Banner */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 flex items-start">
          <CheckCircle className="h-6 w-6 text-blue-600 mr-4 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Our Commitment to Privacy</h3>
            <p className="text-muted-foreground">
              InfrAudit is committed to protecting your privacy and ensuring compliance with applicable data protection laws, 
              including GDPR, CCPA, and other regional privacy regulations. If you have any questions about our privacy practices 
              or wish to exercise your rights, please don't hesitate to contact us.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}