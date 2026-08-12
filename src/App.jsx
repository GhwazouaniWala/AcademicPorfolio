import { useCallback, useState } from "react";
// The /react entry point, not /next — Vercel's quickstart defaults to the
// Next.js one, which does not exist for a Vite SPA.
import { Analytics } from "@vercel/analytics/react";
import Backdrop from "./components/Backdrop";
import BootScreen from "./components/BootScreen";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Models from "./components/Models";
import Certifications from "./components/Certifications";
import Demos from "./components/Demos";
import Contact, { Footer } from "./components/Contact";
import ChatLauncher from "./components/chat/ChatLauncher";
import CommandPalette, { useCommandPalette } from "./components/CommandPalette";
import { useTheme } from "./hooks/useTheme";
import { ScrollProgress } from "./components/Motion";

export default function App() {
  const [booted, setBooted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useCommandPalette();
  const { theme } = useTheme();

  // The palette drives these; both are owned by the components themselves, so
  // it asks via a DOM handle rather than lifting their state up for one caller.
  const openChat = useCallback(() => {
    document.querySelector('[data-chat-launcher]')?.click();
  }, []);
  const openDemo = useCallback(() => {
    document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" });
    requestAnimationFrame(() => document.querySelector("[data-demo-launch]")?.click());
  }, []);

  return (
    <div className="min-h-screen bg-void text-ink">
      <BootScreen onDone={() => setBooted(true)} />
      <Backdrop />
      <ScrollProgress />
      <a
        href="#about"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-signal focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-wider focus:text-void"
      >
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero booted={booted} />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Models />
        <Certifications />
        <Demos />
        <Contact />
        <Footer onOpenPalette={() => setPaletteOpen(true)} />
      </main>
      <ChatLauncher />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenChat={openChat}
        onOpenDemo={openDemo}
        theme={theme}
      />
      {/*
        Page views only, and no-ops off Vercel — locally it just logs to the
        console. Cookieless and aggregate, so it does not weaken the privacy
        note on the emotion demo: camera frames still never leave the browser.
      */}
      <Analytics />
    </div>
  );
}
