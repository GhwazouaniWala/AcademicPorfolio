import { profile } from "../data/content";
import { SectionEyebrow } from "./About";
import { Magnetic, Reveal, RevealText, Stagger, StaggerItem } from "./Motion";
import { PaletteHint } from "./CommandPalette";

const LINKS = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}` },
  { label: "GitHub", value: "GhwazouaniWala", href: profile.github },
  { label: "LinkedIn", value: "ghazouani-wala-eddine", href: profile.linkedin },
  { label: "Hugging Face", value: "Ghazouaniwala", href: profile.huggingface },
];

export default function Contact() {
  return (
    <section id="contact" className="relative band band-edge border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="08" label="Contact" />

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div>
          <h2 className="font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
            <RevealText text="Looking for a 6-month" className="block" />
            <RevealText text="final-year internship." className="block text-gradient" delay={0.06} />
          </h2>

          <Reveal delay={0.12}>
            <p className="mt-5 max-w-lg leading-relaxed text-muted">
              Available January through June 2027, open to relocating to Europe or Canada. If
              you&apos;re building LLM, multimodal, or agentic systems — or need someone who&apos;ll
              own the MLOps around them — I&apos;d like to hear about it.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href={`mailto:${profile.email}`}
                  className="focus-ring group inline-flex items-center gap-2 rounded-full px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-void"
                  style={{ background: "linear-gradient(100deg, var(--c-signal), var(--c-signal-2))" }}
                >
                  Send an email
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="/Wala_Eddine_Ghazouani_CV.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex rounded-full border border-line px-6 py-3 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-signal hover:text-signal"
                >
                  Download CV
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>

        <Stagger className="glass overflow-hidden rounded-2xl">
          {LINKS.map((l) => (
            <StaggerItem key={l.label} y={10}>
              <a
                href={l.href}
                target={l.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="focus-ring group flex items-center justify-between gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-[color-mix(in_srgb,var(--c-signal)_7%,transparent)]"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {l.label}
                </span>
                <span className="truncate font-mono text-[13px] text-ink transition-colors group-hover:text-signal">
                  {l.value}{" "}
                  <span className="inline-block text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-signal">
                    ↗
                  </span>
                </span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function Footer({ onOpenPalette }) {
  return (
    <footer className="border-t border-line px-6 py-10 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-faint">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <PaletteHint onOpen={onOpenPalette} />
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          Built with React, Vite &amp; Tailwind — deployed on Vercel
        </span>
      </div>
    </footer>
  );
}
