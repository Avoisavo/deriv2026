import Head from 'next/head';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
      <Head>
        <title>TRUMAN</title>
        <meta name="description" content="Project TRUMAN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${geistSans.className} ${geistMono.className} relative flex min-h-screen flex-col items-center justify-between py-24 overflow-hidden`}>
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 min-h-full min-w-full w-auto h-auto object-cover -z-20"
        >
          <source src="/landing.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute top-0 left-0 h-full w-full bg-black/40 -z-10" />

        {/* Top Content: Title and Description */}
        <div className="z-10 flex flex-col items-center gap-6 text-center px-4 mt-20">
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white drop-shadow-sm">
            TRUMAN
          </h1>
          <p className="max-w-3xl text-2xl md:text-3xl text-white/90 font-light tracking-wide leading-relaxed drop-shadow-xl">
            A platform that simulates multiple possible business realities and guides decisions as the real one unfolds
          </p>
        </div>

        {/* Bottom Content: Button */}
        <div className="z-10 mb-8">
          <button
            className="group relative px-10 py-4 text-xl font-semibold text-white overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-full border border-white/20 backdrop-blur-md bg-white/10"
          >
            {/* Liquid Glass Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />

            {/* Shimmer Effect */}
            <div className="absolute -inset-full h-[300%] w-[300%] translate-x-[-100%] translate-y-[-100%] group-hover:translate-x-[100%] group-hover:translate-y-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45" />

            <span className="relative z-10 drop-shadow-md">Start Now</span>
          </button>
        </div>
      </main>
    </>
  );
}
