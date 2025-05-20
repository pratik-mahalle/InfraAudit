import React from 'react';
import { Helmet } from 'react-helmet';
import { FileText, AlertCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  const lastUpdated = 'May 15, 2025';

  return (
    <>
      <Helmet>
        <title>Terms of Service | InfraAudit</title>
        <meta name="description" content="Review the Terms of Service for InfraAudit's multi-cloud infrastructure monitoring platform, including user responsibilities, acceptable use, and licensing terms." />
      </Helmet>

      <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            These Terms of Service ("Terms") govern your access to and use of InfraAudit's platform and services. 
            Please read these Terms carefully before using our services. By accessing or using our services, 
            you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of the terms, 
            you may not access our services.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Contents</h2>
          <ul className="space-y-2">
            <li>
              <a href="#account-terms" className="text-blue-600 hover:underline">1. Account Terms</a>
            </li>
            <li>
              <a href="#service-license" className="text-blue-600 hover:underline">2. Service License and Restrictions</a>
            </li>
            <li>
              <a href="#subscription-billing" className="text-blue-600 hover:underline">3. Subscription and Billing</a>
            </li>
            <li>
              <a href="#acceptable-use" className="text-blue-600 hover:underline">4. Acceptable Use</a>
            </li>
            <li>
              <a href="#confidentiality" className="text-blue-600 hover:underline">5. Confidentiality</a>
            </li>
            <li>
              <a href="#warranties" className="text-blue-600 hover:underline">6. Warranties and Disclaimer</a>
            </li>
            <li>
              <a href="#limitation-liability" className="text-blue-600 hover:underline">7. Limitation of Liability</a>
            </li>
            <li>
              <a href="#indemnification" className="text-blue-600 hover:underline">8. Indemnification</a>
            </li>
            <li>
              <a href="#termination" className="text-blue-600 hover:underline">9. Termination</a>
            </li>
            <li>
              <a href="#updates" className="text-blue-600 hover:underline">10. Updates to Terms</a>
            </li>
            <li>
              <a href="#governing-law" className="text-blue-600 hover:underline">11. Governing Law</a>
            </li>
            <li>
              <a href="#contact" className="text-blue-600 hover:underline">12. Contact Information</a>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-10">
          <section id="account-terms">
            <h2 className="text-2xl font-bold">1. Account Terms</h2>
            <p>
              You must be at least 18 years old to use this service. You are responsible for maintaining the security of your 
              account and password. InfraAudit cannot and will not be liable for any loss or damage from your failure to comply 
              with this security obligation.
            </p>
            <p>
              You are responsible for all content posted and activity that occurs under your account. You may not use the service 
              for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.
            </p>
            <p>
              One person or legal entity may maintain no more than one free account. Additional accounts require payment of service fees.
            </p>
          </section>

          <section id="service-license">
            <h2 className="text-2xl font-bold">2. Service License and Restrictions</h2>
            <p>
              Subject to your compliance with these Terms, InfraAudit grants you a limited, non-exclusive, non-transferable, 
              non-sublicensable license to access and use the services for your internal business purposes.
            </p>
            <p>
              You may not:
            </p>
            <ul>
              <li>Modify, copy, or create derivative works based on the services or their content</li>
              <li>Reverse engineer, decompile, or disassemble any portion of the services</li>
              <li>Access the services to build a competitive product or service</li>
              <li>Use the services in a way that could damage, disable, overburden, or impair InfraAudit systems</li>
              <li>Use automated means (including bots, scrapers, or similar technologies) to access the services</li>
              <li>Circumvent or disrupt security-related features of the services</li>
              <li>Use the services in a manner that violates applicable laws or regulations</li>
            </ul>
          </section>

          <section id="subscription-billing">
            <h2 className="text-2xl font-bold">3. Subscription and Billing</h2>
            <p>
              Some aspects of the services require payment of fees. You shall pay all applicable fees as described on our website 
              in connection with the services selected by you. All payment obligations are non-cancelable, and fees paid are 
              non-refundable.
            </p>
            <p>
              If you select a subscription plan, you will be billed on a recurring basis at the frequency selected (monthly, 
              annually, etc.) until you cancel. By selecting a subscription plan, you authorize us to store your payment 
              information and to automatically charge you at regular intervals until you cancel.
            </p>
            <p>
              We reserve the right to change the price of our services. If we do change prices, we will provide notice of the 
              change on our website or by email, at our option, at least 30 days before the change is to take effect. If you do 
              not agree to the price change, you must cancel your subscription before the price change takes effect.
            </p>
          </section>

          <section id="acceptable-use">
            <h2 className="text-2xl font-bold">4. Acceptable Use</h2>
            <p>
              You agree not to misuse the InfraAudit services. Prohibited activities include but are not limited to:
            </p>
            <ul>
              <li>Harassing, threatening, or causing harm to others</li>
              <li>Impersonating another person or entity</li>
              <li>Attempting to probe, scan, or test the vulnerability of any system or network</li>
              <li>Using our services to transmit malware or harmful code</li>
              <li>Attempting to access data not intended for you</li>
              <li>Interfering with the proper functioning of our services</li>
              <li>Using our services for any illegal activities</li>
              <li>Publishing or distributing objectionable content, including discriminatory, defamatory, or harassing content</li>
            </ul>
          </section>

          <section id="confidentiality">
            <h2 className="text-2xl font-bold">5. Confidentiality</h2>
            <p>
              "Confidential Information" means all non-public information disclosed by us to you, or by you to us, whether orally, 
              in writing, or by any other means. Confidential Information includes, but is not limited to, product designs, business 
              plans, customer data, and technical information.
            </p>
            <p>
              Both parties agree to:
            </p>
            <ul>
              <li>Protect the other party's Confidential Information with the same standard of care as its own Confidential Information</li>
              <li>Not disclose the Confidential Information to any third party except as necessary to perform obligations under these Terms</li>
              <li>Use the Confidential Information only for purposes consistent with these Terms</li>
            </ul>
            <p>
              These confidentiality obligations do not apply to information that:
            </p>
            <ul>
              <li>Is or becomes publicly available through no fault of the receiving party</li>
              <li>Was rightfully known to the receiving party prior to receipt from the disclosing party</li>
              <li>Is rightfully obtained from a third party without restriction</li>
              <li>Is independently developed by the receiving party without use of the disclosing party's Confidential Information</li>
              <li>Is required to be disclosed by law or governmental order, provided the receiving party gives prompt notice</li>
            </ul>
          </section>

          <section id="warranties">
            <h2 className="text-2xl font-bold">6. Warranties and Disclaimer</h2>
            <p>
              You represent and warrant that:
            </p>
            <ul>
              <li>You have the legal capacity and authority to enter into these Terms</li>
              <li>Your use of our services will comply with these Terms and all applicable laws and regulations</li>
              <li>Any information you provide to us is true, accurate, and complete</li>
              <li>You are authorized to provide any data or information that you upload to our services</li>
            </ul>
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
              NON-INFRINGEMENT. INFRAAUDIT DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS 
              WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER 
              HARMFUL COMPONENTS.
            </p>
          </section>

          <section id="limitation-liability">
            <h2 className="text-2xl font-bold">7. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL INFRAAUDIT, ITS AFFILIATES, OFFICERS, DIRECTORS, 
              EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, 
              INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, THAT RESULT 
              FROM THE USE OF, OR INABILITY TO USE, THE SERVICES.
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INFRAAUDIT ASSUMES NO LIABILITY OR RESPONSIBILITY FOR ANY:
            </p>
            <ul>
              <li>ERRORS, MISTAKES, OR INACCURACIES IN CONTENT</li>
              <li>PERSONAL INJURY OR PROPERTY DAMAGE RESULTING FROM YOUR ACCESS TO OR USE OF OUR SERVICES</li>
              <li>UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS OR ANY PERSONAL INFORMATION STORED THEREIN</li>
              <li>INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM OUR SERVICES</li>
              <li>BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED THROUGH OUR SERVICES</li>
              <li>LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF YOUR USE OF ANY CONTENT POSTED, EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE THROUGH OUR SERVICES</li>
            </ul>
            <p>
              IN NO EVENT SHALL INFRAAUDIT'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION EXCEED THE AMOUNT PAID BY YOU, 
              IF ANY, FOR ACCESSING OUR SERVICES DURING THE 12 MONTHS PRIOR TO BRINGING THE CLAIM.
            </p>
          </section>

          <section id="indemnification">
            <h2 className="text-2xl font-bold">8. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless InfraAudit, its affiliates, licensors, and service providers, and its and 
              their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and 
              against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' 
              fees) arising out of or relating to:
            </p>
            <ul>
              <li>Your violation of these Terms</li>
              <li>Your use of the services, including any data or content submitted or provided by you</li>
              <li>Your violation of any rights of another</li>
              <li>Your violation of applicable laws or regulations</li>
            </ul>
          </section>

          <section id="termination">
            <h2 className="text-2xl font-bold">9. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the services at any time, without prior notice or liability, for any reason 
              whatsoever, including without limitation if you breach the Terms.
            </p>
            <p>
              Upon termination, your right to use the services will immediately cease. If you wish to terminate your account, you may simply 
              discontinue using the services or contact us to request account deletion.
            </p>
            <p>
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, 
              ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section id="updates">
            <h2 className="text-2xl font-bold">10. Updates to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on our website and 
              updating the "Last Updated" date. You are advised to review these Terms periodically for any changes.
            </p>
            <p>
              Your continued use of the services after we post any modifications to the Terms will constitute your acknowledgment of the 
              modifications and your consent to abide and be bound by the modified Terms.
            </p>
          </section>

          <section id="governing-law">
            <h2 className="text-2xl font-bold">11. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the State of California, United States, 
              without regard to its conflict of law provisions.
            </p>
            <p>
              Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the state 
              and federal courts located in San Francisco County, California.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-bold">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4">
              <p><strong>InfraAudit, Inc.</strong></p>
              <p>350 California St</p>
              <p>San Francisco, CA 94104</p>
              <p>United States</p>
              <p>Email: legal@infraaudit.com</p>
              <p>Phone: +1 (800) 555-1234</p>
            </div>
          </section>
        </div>

        {/* Alert Banner */}
        <div className="mt-12 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 flex items-start">
          <AlertCircle className="h-6 w-6 text-amber-600 mr-4 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Important Notice</h3>
            <p className="text-muted-foreground">
              By using InfraAudit's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please discontinue use of our services immediately.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}