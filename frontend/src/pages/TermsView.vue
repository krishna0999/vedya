<script setup lang="ts">
// Terms of Service. Plan limits quoted here mirror backend/src/limits.ts —
// change both together.
import UiLogo from "@/components/ui/UiLogo.vue";
</script>

<template>
  <div class="min-h-screen bg-ink-50 px-4 py-10">
    <article
      class="mx-auto max-w-2xl rounded-md border border-line-200 bg-white p-6 shadow-card sm:p-10"
    >
      <router-link to="/" aria-label="Vedya home"><UiLogo /></router-link>
      <h1 class="mt-6 text-2xl font-semibold text-ink-900">Terms of Service</h1>
      <p class="mt-1 text-sm text-ink-500">Effective 30 October 2026</p>

      <div class="legal-prose">
        <p>
          These terms are an agreement between you and Krishna Muraree, an
          individual based in Dhanbad, Jharkhand, India, who operates Vedya
          (“we”, “us”). By creating an account or using Vedya you agree to them.
          Our
          <router-link :to="{ name: 'privacy' }">Privacy Policy</router-link>
          explains how we handle personal data.
        </p>

        <h2>1. Who can use Vedya</h2>
        <p>
          You must be at least 13. If you are under 18, you need your parent or
          guardian’s permission. If you use Vedya for an organisation, you
          confirm you’re authorised to accept these terms for it.
        </p>

        <h2>2. Your account</h2>
        <p>
          Give accurate information, keep your password private, and tell us at
          <a href="mailto:support@vedya.app">support@vedya.app</a> if you think
          your account has been compromised. You are responsible for activity
          under your account.
        </p>

        <h2>3. Your content and your respondents</h2>
        <ul>
          <li>
            You own your forms and the responses they collect. You give us
            permission to store, process and display them only as needed to run
            Vedya for you.
          </li>
          <li>
            You decide what your forms collect, so you are responsible for
            having a lawful basis (such as consent) to collect it, for telling
            respondents how you’ll use their answers, and for handling their
            requests. We process responses on your behalf.
          </li>
        </ul>

        <h2>4. What you must not do</h2>
        <ul>
          <li>
            Phish or deceive: use forms to collect passwords, card or bank
            details, or government ID numbers under false pretences, or
            impersonate another person or organisation.
          </li>
          <li>
            Publish illegal, hateful, harassing or sexually explicit content
            involving minors.
          </li>
          <li>
            Send spam, distribute malware, or use forms to collect data you have
            no right to.
          </li>
          <li>
            Abuse the service: get around limits or security, overload it,
            scrape it, or access other people’s data.
          </li>
        </ul>
        <p>
          We may remove a form or suspend an account that breaks these rules,
          where possible after telling you. To report a form, email
          <a href="mailto:support@vedya.app">support@vedya.app</a> with its
          link.
        </p>

        <h2>5. Plans and limits</h2>
        <p>
          Vedya is currently free. The free plan includes 100 responses per
          month across all your forms and 10 AI form generations per month, and
          public forms show a small “Made with Vedya” badge. We may change these
          limits; we’ll give notice before a change reduces what you get. Paid
          plans, when offered, will be sold through a merchant-of-record payment
          provider whose terms you’ll see at checkout.
        </p>

        <h2>6. AI features</h2>
        <p>
          AI-generated forms can be wrong or incomplete. Review them before you
          publish; you are responsible for what your forms ask.
        </p>

        <h2>7. The service</h2>
        <p>
          We work to keep Vedya available and your data safe, but we provide it
          “as is” and “as available”, without warranties of any kind, to the
          extent the law allows. We may change, suspend or discontinue features;
          if we shut Vedya down, we’ll give you reasonable notice to export your
          data.
        </p>

        <h2>8. Ending your use</h2>
        <p>
          You can stop using Vedya and delete your account at any time from
          Account → “Delete account”. We may suspend or close accounts that
          seriously or repeatedly break these terms.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the extent the law allows, we are not liable for indirect or
          consequential losses, such as lost profits or lost data, and our total
          liability for any claim is limited to the amount you paid us for Vedya
          in the 12 months before the claim. Nothing in these terms limits
          liability that cannot be limited by law.
        </p>

        <h2>10. Indemnity</h2>
        <p>
          You agree to cover our reasonable costs if a third party brings a
          claim against us because of your forms, the data you collect with
          them, or your breach of these terms.
        </p>

        <h2>11. Law and disputes</h2>
        <p>
          These terms are governed by the laws of India. Courts at Dhanbad,
          Jharkhand have exclusive jurisdiction over any dispute arising from
          them.
        </p>

        <h2>12. Changes</h2>
        <p>
          If we change these terms in a meaningful way, we’ll tell you by email
          or in the app before the change takes effect. Continuing to use Vedya
          after that means you accept the new terms.
        </p>

        <h2>Contact</h2>
        <p>
          Krishna Muraree, Dhanbad, Jharkhand, India
          <a href="mailto:support@vedya.app">support@vedya.app</a>
        </p>
      </div>
    </article>
  </div>
</template>
