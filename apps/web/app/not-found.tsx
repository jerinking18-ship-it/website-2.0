import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found-shell">
      <section className="not-found-card">
        <span>FreshCart Market</span>
        <h1>Page not found</h1>
        <p>
          The page you opened is unavailable or may have moved. Head back to the store and
          continue shopping fresh groceries.
        </p>
        <div>
          <Link href="/">Go home</Link>
          <Link href="/products">Browse products</Link>
        </div>
      </section>
    </main>
  );
}
