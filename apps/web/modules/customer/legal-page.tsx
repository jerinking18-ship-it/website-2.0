type LegalPageProps = {
  title: string;
  eyebrow: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export function LegalPage({ title, eyebrow, summary, sections }: LegalPageProps) {
  return (
    <main className="customer-app">
      <section className="shopping-shell">
        <section className="main-module legal-page">
          <a className="brand" href="/">
            <span className="brand-mark">FC</span>
            <div>
              <strong>FreshCart Market</strong>
              <small>Customer information</small>
            </div>
          </a>
          <header className="module-header">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{summary}</p>
          </header>
          <div className="legal-section-grid">
            {sections.map((section) => (
              <article key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
          <div className="legal-actions">
            <a className="primary-link" href="/support">Contact support</a>
            <a className="ghost-link" href="/products">Continue shopping</a>
          </div>
        </section>
      </section>
    </main>
  );
}
