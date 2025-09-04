import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/general-dashboard');
}
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-[#f0f4ff] dark:from-[#0a0a0a] dark:to-[#23272f] px-4 py-12">
      <main className="flex flex-col items-center gap-8 max-w-2xl w-full">
        <Image
          src="/globe.svg"
          alt="Visual Brainstorm Canvas Logo"
          width={80}
          height={80}
          className="mb-2 drop-shadow-lg"
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-foreground mb-2">
          Visual Brainstorm Canvas
        </h1>
        <p className="text-lg sm:text-xl text-center text-muted-foreground max-w-xl">
          Unleash your creativity and collaborate in real-time with an interactive canvas for brainstorming, mind mapping, and idea sharing.
        </p>
        <a
          href="#get-started"
          className="mt-4 px-8 py-3 rounded-full bg-primary text-background font-semibold text-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          Get Started
        </a>
      </main>
      <footer className="mt-16 text-sm text-muted-foreground text-center opacity-80">
        &copy; {new Date().getFullYear()} Visual Brainstorm Canvas. All rights reserved.
      </footer>
    </div>
  );
}
