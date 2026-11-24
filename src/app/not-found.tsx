import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-primary">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-fg-secondary">The page you were looking for is not part of this mission.</p>
      <Link href="/" className="ts-btn ts-btn-primary mt-2">
        Back to home
      </Link>
    </main>
  );
}
