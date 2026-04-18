import { Minus, Plus } from 'lucide-react'
import {
  faqItems,
  featureItems,
  howItWorksItems,
  privacyPolicyItems,
  resultSteps,
} from '../content/siteContent'
import { DiagonalDivider } from './DiagonalDivider'

export function FeaturesSection() {
  return (
    <section
      className="border-b border-zinc-300 dark:border-zinc-800"
      id="features"
    >
      <div className="grid grid-cols-1 border-b border-zinc-300 dark:border-zinc-800 sm:grid-cols-4">
        {resultSteps.map((step, index) => (
          <div
            className="border-b border-zinc-300 px-4 py-6 dark:border-zinc-800 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0"
            key={step}
          >
            <span className="font-mono text-sm font-semibold text-lime-700 dark:text-lime-400">
              0{index + 1}
            </span>
            <p className="mt-3 text-sm font-medium">{step}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {featureItems.map((item) => (
          <article
            className="border-b border-zinc-300 px-4 py-8 last:border-b-0 dark:border-zinc-800 sm:px-6 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"
            key={item.title}
          >
            <h3 className="font-mono text-sm font-semibold uppercase">
              {item.title}
            </h3>
            <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PrivacyHowItWorksSection() {
  return (
    <section
      className="grid grid-cols-1 border-b border-zinc-300 dark:border-zinc-800 lg:grid-cols-[minmax(360px,1fr)_minmax(0,1fr)]"
      id="privacy"
    >
      <div className="border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:px-6 lg:border-b-0 lg:border-r">
        <h2 className="font-mono text-sm font-semibold uppercase text-lime-700 dark:text-lime-400">
          Privacy policy
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-zinc-700 dark:text-zinc-300">
          PrivateTranscribe.app is built around local-first transcription.
        </p>
        <div className="mt-6 grid gap-5">
          {privacyPolicyItems.map((item) => (
            <article key={item.title}>
              <h3 className="font-mono text-xs font-semibold uppercase text-zinc-950 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
      <div className="px-4 py-8 sm:px-6" id="how-it-works">
        <h2 className="font-mono text-sm font-semibold uppercase text-lime-700 dark:text-lime-400">
          How it works
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-zinc-700 dark:text-zinc-300">
          The app keeps the workflow simple.
        </p>
        <div className="mt-6 grid gap-5">
          {howItWorksItems.map((item) => (
            <article key={item.title}>
              <h3 className="font-mono text-xs font-semibold uppercase text-zinc-950 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  return (
    <section
      className="border-b border-zinc-300 dark:border-zinc-800"
      id="faqs"
    >
      <div className="border-b border-zinc-300 px-4 py-5 dark:border-zinc-800 sm:px-6">
        <h2 className="font-mono text-sm font-semibold uppercase text-lime-700 dark:text-lime-400">
          FAQs
        </h2>
      </div>
      <div className="divide-y divide-zinc-300 dark:divide-zinc-800">
        {faqItems.map((item) => (
          <details className="group px-4 py-5 sm:px-6" key={item.question}>
            <summary className="flex cursor-pointer list-none items-center gap-3 font-mono text-sm font-semibold uppercase marker:hidden">
              <span className="grid size-5 shrink-0 place-items-center text-lime-700 dark:text-lime-400">
                <Plus
                  aria-hidden="true"
                  className="size-4 group-open:hidden"
                  strokeWidth={1.8}
                />
                <Minus
                  aria-hidden="true"
                  className="hidden size-4 group-open:block"
                  strokeWidth={1.8}
                />
              </span>
              <span>{item.question}</span>
            </summary>
            <p className="mt-3 max-w-3xl leading-7 text-zinc-700 dark:text-zinc-300">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function MarketingSections() {
  return (
    <>
      <DiagonalDivider />
      <FeaturesSection />
      <DiagonalDivider />
      <PrivacyHowItWorksSection />
      <DiagonalDivider />
      <FaqSection />
      <DiagonalDivider />
    </>
  )
}
