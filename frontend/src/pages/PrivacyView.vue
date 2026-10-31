<script setup lang="ts">
// Privacy Policy. Written against what the code actually does — when a data
// flow changes (new provider, new field, new retention), update this page in
// the same change.
import UiLogo from "@/components/ui/UiLogo.vue";
</script>

<template>
  <div class="min-h-screen bg-ink-50 px-4 py-10">
    <article
      class="mx-auto max-w-2xl rounded-md border border-line-200 bg-white p-6 shadow-card sm:p-10"
    >
      <router-link to="/" aria-label="Vedya home"><UiLogo /></router-link>
      <h1 class="mt-6 text-2xl font-semibold text-ink-900">Privacy Policy</h1>
      <p class="mt-1 text-sm text-ink-500">Effective 30 October 2026</p>

      <div class="legal-prose">
        <p>
          Vedya (“we”, “us”) is a form builder operated by Krishna Muraree, an
          individual based in Dhanbad, Jharkhand, India. This policy explains
          what we collect, why, who helps us process it, and the choices you
          have. Questions:
          <a href="mailto:support@vedya.app">support@vedya.app</a>.
        </p>

        <h2>Two kinds of people use Vedya</h2>
        <ul>
          <li>
            <strong>Creators</strong> sign up, build forms and collect
            responses. For your account data, we decide how it is used.
          </li>
          <li>
            <strong>Respondents</strong> fill in forms that creators share. The
            creator decides what a form asks and what happens to the answers; we
            store and process them on the creator’s behalf. If you filled in a
            form, contact its creator first about your answers. You can also
            write to us and we’ll help.
          </li>
        </ul>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account:</strong> your email address, an optional display
            name, your password (stored only as a salted scrypt hash and never
            in readable form), your plan, and whether you’ve confirmed your
            email.
          </li>
          <li>
            <strong>Forms:</strong> titles, questions, settings, themes and
            every published version.
          </li>
          <li>
            <strong>Responses:</strong> the answers submitted, when, which
            version of the form they were submitted on, and the respondent’s IP
            address and browser user-agent, which we keep to prevent spam and
            abuse.
          </li>
          <li>
            <strong>Form views:</strong> a count of when a public form was
            opened. We don’t store who opened it.
          </li>
          <li>
            <strong>AI prompts:</strong> if you use “Generate with AI”, the
            description you type, which we keep alongside the generated form.
          </li>
          <li>
            <strong>Technical logs:</strong> our hosting providers record
            requests (IP address, URL, time) to keep the service running and
            secure. These are kept for a short period.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use one essential cookie to keep you signed in. It is httpOnly and
          expires after 30 days of inactivity. We don’t use advertising or
          analytics cookies, and we don’t sell or rent personal data.
        </p>

        <h2>How we use it</h2>
        <ul>
          <li>
            To run the service: host your forms, store responses, show your
            dashboard.
          </li>
          <li>
            To send emails you need: email confirmation, password reset, and a
            notification when one of your forms gets a response (only once
            you’ve confirmed your email).
          </li>
          <li>
            To keep it safe: rate limiting, bot checks and investigating abuse.
          </li>
          <li>To meet legal obligations.</li>
        </ul>

        <h2>Who helps us (sub-processors)</h2>
        <ul>
          <li><strong>Neon</strong> database, hosted on AWS in Singapore.</li>
          <li><strong>Render</strong> application servers in Singapore.</li>
          <li>
            <strong>Vercel</strong> serves the website from a global network.
          </li>
          <li>
            <strong>Cloudflare</strong> DNS, and Turnstile bot protection on
            public forms, which checks browser signals and IP address to tell
            people from bots.
          </li>
          <li><strong>Resend</strong>, sends our emails.</li>
          <li>
            <strong>Sentry</strong>, error monitoring: when something breaks,
            technical details of the error (what failed and where, browser and
            device type) are sent so we can fix it. We configure it not to send
            form answers, cookies or account details.
          </li>
          <li>
            <strong>OpenAI</strong>, only when you use “Generate with AI”: your
            prompt is sent to OpenAI to draft the form. Under OpenAI’s API
            policies, API data isn’t used to train their models by default.
          </li>
        </ul>
        <p>
          These providers process data only to provide their service to us. Your
          data is therefore stored and processed outside India (principally in
          Singapore). When paid plans launch, payments will be handled by a
          merchant-of-record payment provider; we will never see or store your
          card details.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>
            Your account, forms and their responses: until you delete them.
            Deleting your account removes your forms, their versions and
            responses, and your sessions straight away; copies in our provider’s
            backups expire within a short period after that.
          </li>
          <li>
            Password reset links expire after 30 minutes, email confirmation
            links after 24 hours; each works once.
          </li>
        </ul>

        <h2>Your rights</h2>
        <ul>
          <li>
            <strong>Access and portability:</strong> Settings → “Export all my
            data” downloads everything as a file.
          </li>
          <li>
            <strong>Correction:</strong> change your name in Settings; to change
            your email, write to us.
          </li>
          <li>
            <strong>Deletion:</strong> Account → “Delete account” erases your
            account and everything in it.
          </li>
          <li>
            You can also contact us to exercise any right you have under
            applicable law, including India’s Digital Personal Data Protection
            Act, 2023, or to raise a grievance. We aim to respond within 30
            days.
          </li>
        </ul>

        <h2>Children</h2>
        <p>
          You must be at least 13 to create an account, and if you are under 18
          you need your parent or guardian’s permission. Creators must not use
          Vedya to collect personal data from children without the consent the
          law requires.
        </p>

        <h2>Security</h2>
        <p>
          All traffic is encrypted over HTTPS, passwords are hashed, the
          database connection is encrypted, and we use rate limits and bot
          protection. No system is perfectly secure; if we learn of a breach
          affecting your data, we will notify you and the authorities as the law
          requires.
        </p>

        <h2>Changes</h2>
        <p>
          If we change this policy in a meaningful way, we’ll tell you by email
          or in the app before it takes effect. The date at the top shows the
          latest version.
        </p>

        <h2>Contact</h2>
        <p>
          Krishna Muraree, Dhanbad, Jharkhand, India
          <a href="mailto:support@vedya.app">support@vedya.app</a>
        </p>
      </div>

      <p class="mt-10 text-sm text-ink-500">
        See also our
        <router-link
          :to="{ name: 'terms' }"
          class="font-medium text-brand-700 hover:underline"
          >Terms of Service</router-link
        >.
      </p>
    </article>
  </div>
</template>
