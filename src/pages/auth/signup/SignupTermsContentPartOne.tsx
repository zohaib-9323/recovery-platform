import { Section, TermDef } from '@/pages/auth/signup/signup-terms-primitives'

/** "About us" through "Cancelling a Contract" — see `SignupTermsContent.tsx`. */
export function SignupTermsContentPartOne() {
  return (
    <>
      <Section title="About us">
        <p>
          We are Trade Harmonizer, a company registered in Northern Ireland. Our company
          registration number is NI701041 and our registered company address is 17 Osborne Park,
          Bangor, BT20 3DJ.
        </p>
        <p className="mt-2">
          These are the terms and conditions which apply to your use of our website located at{' '}
          <a
            href="http://www.tradeharmonizer.co.uk"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://www.tradeharmonizer.co.uk
          </a>{' '}
          and to the Services we provide to you (as defined below).
        </p>
        <p className="mt-2">
          Please read these terms carefully before you use our Website and/or Services. These terms
          tell you who we are, how we will provide Services to you and other important information.
          If you do not agree to be bound by these terms you must not use our Website or any of our
          Services.
        </p>
      </Section>

      <Section title="Definitions and interpretation">
        <p className="font-semibold">Definitions</p>
        <TermDef term='"Charges"' def="means as defined in clause 10.1." />
        <TermDef term='"Contract"' def="means as defined in clause 8.9." />
        <TermDef
          term='"Denied Parties Screening"'
          def="means the check against government databases in your country of jurisdiction as described on our Website."
        />
        <TermDef term='"Events Outside Our Control"' def="means as defined in clause 13.1." />
        <TermDef
          term='"Intellectual Property Rights"'
          def="means patents, rights to inventions, copyright and related rights, moral rights, trade marks and service marks, business names and domain names, rights in get-up and trade dress, goodwill and the right to sue for passing off, rights in designs, rights in computer software, database rights, rights to use, and protect the confidentiality of, confidential information (including know-how and trade secrets) and all other intellectual property rights, in each case whether registered or unregistered and including all applications and rights to apply for and be granted, renewals or extensions of, and rights to claim priority from, such rights and all similar or equivalent rights or forms of protection which subsist or will subsist now or in the future in any part of the world."
        />
        <TermDef
          term='"Order"'
          def="means your order for one or more of our Services selected through our Website."
        />
        <TermDef term='"Our Materials"' def="means as defined in clause 9.6.7." />
        <TermDef term='"Quote"' def="means a quote from us for our Services." />
        <TermDef
          term='"Services"'
          def="means one or more of our Denied Parties Screening and/or our Trade Harmonizer Code Generation and/or our Trade Import Duty Audit and any other services provided directly by us to you from time to time as described on and/or made available through the Website."
        />
        <TermDef
          term='"these terms"'
          def="means these terms and conditions and our Privacy Policy available at tradeharmonizer.co.uk/privacy"
        />
        <TermDef
          term='"Third Party Services"'
          def="Denied Parties Screening and/or Trade Harmonizer Code Generation and any other services provided or other services or products provided directly by a Third Party Service Provider to you."
        />
        <TermDef
          term='"Third Party Service Provider"'
          def="means a company or organisation that we introduce you to through our Website that offers and may provide you directly with products or services."
        />
        <TermDef
          term='"Trade Harmonizer Code Generation"'
          def="means the generation of Harmonised System Code as recognised by the International Chamber of Commerce whether in 6, 8 or 10 digit format."
        />
        <TermDef
          term='"us", "we", "Trade Harmonizer" and "our"'
          def="means Trade Harmonizer Ltd."
        />
        <TermDef
          term='"Website"'
          def={
            <>
              means the website located at{' '}
              <span className="text-primary underline">www.tradeharmonizer.co.uk</span>
            </>
          }
        />
        <TermDef term='"Your Default"' def="means as defined in clause 12.1." />
        <p className="mt-3 font-semibold">Interpretation</p>
        <p className="mt-1">
          Unless the context otherwise requires, in these terms words in the singular shall include
          the plural and in the plural shall include the singular.
        </p>
        <p className="mt-1">
          Any words following the terms including, include, in particular, for example or any
          similar expression shall be construed as illustrative and shall not limit the sense of the
          words, description, definition, phrase or term preceding those terms.
        </p>
        <p className="mt-1">
          Reference to the singular includes the plural and vice versa, reference to a gender
          includes the other genders unless the context requires otherwise, and reference to a
          person or a company includes (in either case) any company or incorporated or
          unincorporated business or association.
        </p>
      </Section>

      <Section title="Website">
        <p>
          We do not guarantee that our Website, or any content on it, will always be available or be
          uninterrupted. At certain times our Website or any of the content on it may be unavailable
          due to problems with third party websites we rely on or the performance of the internet in
          general.
        </p>
        <p className="mt-2">
          We may suspend or withdraw or restrict the availability of all or any part of our Website
          for business and operational reasons. We will try to give you reasonable notice of any
          suspension or withdrawal.
        </p>
        <p className="mt-2">
          You are responsible for ensuring that all persons who access our Website through your
          internet connection are aware of these terms and other applicable terms and conditions and
          that they comply with them.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may make changes to these terms from time to time. Please make sure you check these
          terms each time you use our Website. We will notify you of any changes to these terms by
          posting details of the changes on our Website.
        </p>
      </Section>

      <Section title="Keep your account details safe">
        <p>
          If you choose, or are provided with, a username or password or any other piece of
          information as part of our security procedures, you must treat this information as
          confidential.
        </p>
        <p className="mt-2">
          We have the right to disable any username or password, whether chosen by you or allocated
          by us, at any time, if in our reasonable opinion you have failed to comply with any of the
          provisions of these terms and conditions.
        </p>
        <p className="mt-2">
          If you know or suspect that anyone other than you knows your username or password, you
          must promptly notify us by following the instructions on our Website.
        </p>
      </Section>

      <Section title="Third Party Services">
        <p>
          Third Party Service Providers are companies or organisations that offer you products and
          services through our Website, Denied Parties Screening and/or Trade Harmonizer Code
          Generation and any other services provided.
        </p>
        <p className="mt-2">
          If you decide to purchase Third Party Services you will need to enter into a contract
          directly with the relevant Third Party Service Provider for the provision of such Third
          Party Services.
        </p>
        <p className="mt-2">
          We are not responsible for any Third Party Services that you purchase from a Third Party
          Service Provider. You are responsible for ensuring that any Third Party Services that you
          purchase from a Third Party Service Provider are suitable for your needs and we recommend
          that you obtain independent advice.
        </p>
        <p className="mt-2">
          We do not provide any advice as to the suitability for any Third Party Services provided
          by a Third Party Service Provider and we do not act as your advisor or agent.
        </p>
        <p className="mt-2">
          We may provide Third Party Quotes of Third Party Service Providers to you via our Website.
          The Third Party Quotes we are able to provide will depend on the Third Party Services you
          wish to purchase. Neither we nor Third Party Service Providers are obliged to provide you
          with any Third Party Quotes.
        </p>
        <p className="mt-2">
          Third Party Quotes for Third Party Services may be subject to further terms and conditions
          in addition to these terms. Before you confirm you wish to purchase any Third Party
          Services you must ensure you have read and understood any terms and conditions that apply.
          The additional terms and conditions may be supplied to you with a Third Party Quote or be
          made available on the third party&apos;s website.
        </p>
      </Section>

      <Section title="Our services">
        <p>The services we provide to you may include:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            access to our dashboard and document management system accessible via our Website using
            an individual online account;
          </li>
          <li>
            providing you with one or more of our Denied Parties Screening and/or{' '}
            <span className="text-primary"> Trade Harmonizer </span> Code Generation and any other
            services provided; and
          </li>
          <li>
            introducing you to Third Party Service Providers and/or providing Third Party Quotes
            from Third Party Service Providers Denied Parties Screening and/or Trade Harmonizer Code
            Generation and any other services provided and other Third Party Services.
          </li>
        </ul>
        <p className="mt-2">
          All our correspondence and communications with you on our Website will be in English.
        </p>
      </Section>

      <Section title="Quotes for our Services">
        <p>
          Quotes for our Services are provided in response to the information you provide to us. We
          do not check the information you provide. You must ensure that all information you provide
          is true, complete and accurate and you must disclose all relevant facts.
        </p>
        <p className="mt-2">
          Failure to provide true, complete and accurate information or failure to disclose all
          relevant facts may result in Services you purchase being terminated or declared invalid.
          You may also be liable for damage or losses incurred as a result of any inaccurate
          information you provide.
        </p>
      </Section>

      <Section title="Orders for our Services">
        <p>
          When you place an Order for our Services using our Website this constitutes an offer to us
          from you to purchase such Services in accordance with these terms and any other applicable
          terms and conditions.
        </p>
        <p className="mt-2">
          Your Order will be accepted when we notify you using our Website that it has been accepted
          by us.
        </p>
        <p className="mt-2">
          If you wish to purchase such Third Party Services you must contact the relevant Third
          Party Service Provider direct.
        </p>
        <p className="mt-2">
          Our acceptance of your Order will take place when we contact you via our Website to accept
          it, at which point a contract will come into existence between you and us (Contract).
        </p>
        <p className="mt-2">
          If we are unable to accept your Order we will inform you of this for any reason we will
          inform you of this and we will not process your Order. If you have already paid for the
          Service we will refund you the full amount.
        </p>
      </Section>

      <Section title="Cancelling a Contract">
        <p>
          You may cancel a Contract and receive a refund if you notify us using our Website within 7
          days of your receipt of our acceptance of your Order in accordance with clause 8.7.
        </p>
        <p className="mt-2">
          You cannot cancel a Contract once we have completed the relevant Service, even if the
          7-day period is still running. To cancel a Contract, you must notify us by using the
          cancellation button displayed on our Website. We will contact you using our Website to
          confirm that we have received your cancellation.
        </p>
        <p className="mt-2">
          If you cancel a Contract we will refund you in full for the price you paid for the
          relevant Service by the method you used for payment. We may deduct from any refund an
          amount for the supply of the relevant Service for the period up to the time when you give
          notice of cancellation. The amount we deduct will be based on our daily fee rates as set
          out on our Website at the time you submit your Order.
        </p>
        <p className="mt-2">
          Any descriptions or illustrations of our Services on our Website are published for the
          sole purpose of giving an approximate idea of the Services described in them. They will
          not form part of the Contract or have any contractual force.
        </p>
        <p className="mt-2">
          We will use all reasonable endeavours to meet any performance dates specified in the
          confirmation of your Order for our Services, but any such dates are estimates only and
          failure to perform the Service by such dates will not give you the right to terminate the
          Contract.
        </p>
        <p className="mt-2">In respect of the Services it is your responsibility to ensure that:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>the terms of your Order are complete and accurate;</li>
          <li>you co-operate with us in all matters relating to the Services;</li>
          <li>
            you provide us with such information and materials we may reasonably require in order to
            supply the Services and ensure that such information is complete and accurate in all
            material respects;
          </li>
          <li>
            you obtain and maintain all necessary licences, permissions and consents which may be
            required for the Services before the date on which the Services are to start;
          </li>
          <li>you comply with all applicable laws, including health and safety laws; and</li>
          <li>
            you keep all of our materials, equipment, documents and other property (Our Materials)
            at your premises or the premises at which your goods are located in safe custody at your
            own risk, maintain Our Materials in good condition until returned to us, and not dispose
            of or use Our Materials other than in accordance with our written instructions or
            authorisation.
          </li>
        </ul>
      </Section>
    </>
  )
}
