# Teachery course hosting

This document records the planned course-hosting architecture. It is a reference
only: the website, bootcamp routes, buttons and checkout links remain unchanged
until the Teachery course is ready.

## Status: deferred

**Do not implement this yet.** Course recording and production are the current
priority. Revisit hosting, payments, DNS and checkout only when the first course
is close enough to completion for an end-to-end test.

Until then:

- keep the existing bootcamp pages in waitlist mode;
- do not add a Teachery checkout URL to the repository;
- do not redirect a public bootcamp page to Teachery;
- do not change DNS for `learn.kastriottanaj.com`;
- do not buy a platform plan solely to reserve this architecture.

## Recommended architecture

Use a hybrid setup:

- self-host public sales and landing pages on `kastriottanaj.com`;
- use Teachery for protected lessons, student accounts, progress and course
  delivery on `learn.kastriottanaj.com`;
- use a supported checkout provider, then connect successful purchases to
  Teachery enrolment.

The public bootcamp URL should remain the permanent marketing and SEO URL. It
should not automatically redirect to Teachery. Keeping it on the main site
preserves design control, analytics, internal links, structured data and search
rankings, and makes a future course-platform migration much easier.

## Intended customer journey

The public sales page remains on the main website:

```text
https://kastriottanaj.com/bootcamps/wordpress-bootcamp/
```

Teachery hosts the course, checkout and student access on the branded learning
subdomain:

```text
https://learn.kastriottanaj.com/
```

Once enrolment opens, the €275 call-to-action on the WordPress Bootcamp page
should send the visitor to the final tested checkout URL. If Teachery's native
checkout is available to the business, the expected pattern is:

```text
https://learn.kastriottanaj.com/checkout?upsell=true
```

The final URL must be copied from the configured Teachery course rather than
assumed from this example. If Teachery's native checkout is not available, the
button should instead use the selected external payment provider.

Reference flow supplied for comparison:

```text
https://ecommerceseobootcamp.com/
  -> https://learn.ecommerceseobootcamp.com/checkout?upsell=true
```

## Ownership of each part

| Surface | Host | Purpose |
| --- | --- | --- |
| `kastriottanaj.com/bootcamps/wordpress-bootcamp/` | Current website | Public sales page, curriculum, FAQs and €275 offer |
| `learn.kastriottanaj.com` | Teachery | Checkout, course delivery and student access |
| Payment and enrolment records | Teachery/payment provider | Purchase processing and access provisioning |

The main website must never collect or process card details.

## Payment constraint for a Kosovo business

Teachery's direct payment integration currently uses Stripe. At the time of this
decision, Kosovo is not listed as a generally supported country for opening a
standard Stripe payments account. Euro pricing support does not solve account
eligibility or payout availability.

Before choosing Teachery's native checkout, verify all of the following against
the current official documentation:

- the legal business entity is in a Stripe-supported country;
- its registered address, owner verification and tax information are valid;
- the settlement bank account is eligible;
- Teachery can connect to that exact Stripe account;
- EUR charges and payouts work for that account;
- taxes, invoices, refunds and chargebacks can be handled correctly.

Do not open a Stripe account under another country unless the business genuinely
has the required legal entity, address, banking and tax setup there.

Official references to re-check when this work resumes:

- Teachery payments: <https://help.teachery.co/en/articles/211-using-teachery-s-built-in-payment-method-stripe>
- Teachery pricing: <https://www.teachery.co/pricing>
- Teachery selling documentation: <https://help.teachery.co/en/collections/10-sell>
- Stripe availability: <https://stripe.com/global>

## Alternative external-payment flow

If the business cannot use Teachery's native Stripe checkout, use an eligible
external provider such as Paysera and automate access after a confirmed payment:

```text
kastriottanaj.com bootcamp sales page
  -> Paysera or another supported hosted checkout
  -> verified successful-payment event
  -> enrol the buyer in Teachery
  -> Teachery sends the student access email
```

The enrolment step may use a supported Teachery integration, Make, Zapier or a
small server-side webhook bridge. The implementation must be idempotent: the
same payment event arriving twice must not create duplicate access or email.
Never grant access from a browser redirect alone; grant it only after a payment
event has been verified server-side.

Before implementing this alternative, confirm that Teachery supports the needed
enrolment action on the selected plan and that the payment provider supplies
signed, retryable webhooks.

## Cost decision

Teachery currently advertises monthly, annual and limited lifetime pricing with
no additional Teachery transaction fee, although the payment processor still
charges its own fees. Pricing and product terms may change before launch, so
re-check them when the course is nearly ready rather than choosing a plan now.

At a €275 course price, compare the platform cost against expected sales,
payment-processing fees and the time saved by not building student accounts,
protected lessons, progress tracking and course emails yourself.

## Teachery setup checklist

1. Finish recording and preparing the course.
2. Confirm the payment route available to the legal business.
3. Create the WordPress Bootcamp in Teachery.
4. Set the product price to **€275** and confirm the displayed currency is EUR.
5. Configure `learn.kastriottanaj.com` as the Teachery custom domain.
6. Add the DNS record required by Teachery in Cloudflare.
7. Keep the Cloudflare proxy setting exactly as Teachery requires for custom
   domains; do not guess between proxied and DNS-only mode.
8. Wait for Teachery to confirm the domain and issue HTTPS.
9. Configure checkout, purchase confirmation, student login and course emails.
10. Complete a test purchase and confirm that access is granted correctly.
11. Copy the exact live checkout URL from Teachery or the external provider.
12. Only then add that URL to the WordPress Bootcamp content entry.

## Future repository connection

The WordPress Bootcamp is defined here:

```text
src/content/bootcamps/wordpress-bootcamp.md
```

Its single tier already supports a hosted checkout through the optional
`checkout` field. When the Teachery URL has been tested, add it to that tier:

```yaml
tiers:
  - name: "WordPress Bootcamp"
    price: 275
    checkout: "https://learn.kastriottanaj.com/checkout?upsell=true"
```

Adding `checkout` is the existing enrolment switch. It will:

- change the button from the waitlist action to **Enrol — €275**;
- link the button to Teachery;
- mark the structured-data offer as available;
- leave course delivery and payment processing outside this repository.

Do not add the field until the exact checkout URL, HTTPS, payment flow and
student access have all been tested.

## Pre-launch verification

Before changing the website button, verify all of the following:

- `https://learn.kastriottanaj.com/` loads with a valid certificate;
- the checkout clearly shows **WordPress Bootcamp**, **€275** and **EUR**;
- desktop and mobile checkout both work;
- a real or sandbox payment reaches the confirmation screen;
- the buyer receives the expected receipt and login/access email;
- the buyer can sign in and open the course;
- refund, support, privacy and terms links are visible and correct;
- analytics and conversion tracking do not run before consent where consent is
  required;
- the checkout URL has no temporary preview token or administrator-only value.

## Other bootcamps

Use the same architecture for future courses:

```text
kastriottanaj.com/bootcamps/<course>/  ->  learn.kastriottanaj.com/<Teachery checkout>
```

Each course should keep its public sales content in this repository and use its
own tested Teachery checkout URL in the corresponding tier's `checkout` field.
