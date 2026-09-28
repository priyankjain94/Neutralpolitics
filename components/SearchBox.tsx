"use client";

import { FormEvent, useState } from "react";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import type { Lang } from "@/lib/types";

type Result = { url: string; meta?: { title?: string; image?: string; date?: string }; excerpt?: string };

export function SearchBox({ lang, initialQuery }: { lang: Lang; initialQuery: string }) {
  const m = t(lang);
  const [query, setQuery] = useState(initialQuery);
  const [section, setSection] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState("");

  async function run(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    const q = query.trim();
    if (!q) return;
    try {
      const pagefind = await import(/* webpackIgnore: true */ `${window.location.origin}/pagefind/pagefind.js`);
      if (pagefind.init) await pagefind.init();
      const options = section ? { filters: { section: [section] } } : undefined;
      const search = await pagefind.search(q, options);
      const rows = await Promise.all(search.results.slice(0, 20).map((result: { data: () => Promise<Result> }) => result.data()));
      setResults(rows);
      const url = new URL(window.location.href);
      url.searchParams.set("q", q);
      window.history.replaceState(null, "", url.toString());
    } catch {
      setError(m.searchUnavailable);
      setResults(null);
    }
  }

  return (
    <div>
      <form className="search-form" onSubmit={run}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={m.searchPlaceholder}
          aria-label={m.searchTitle}
        />
        <select aria-label={m.section} value={section} onChange={(event) => setSection(event.target.value)}>
          <option value="">{m.allSections}</option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {categoryLabel(category.slug, lang)}
            </option>
          ))}
        </select>
        <button className="button" type="submit">
          {m.searchButton}
        </button>
      </form>
      <p className="dek">{m.searchHint}</p>
      {lang === "hi" && query ? (
        <p>
          <a href={`/search?q=${encodeURIComponent(query)}`}>{m.searchAlso}</a>
        </p>
      ) : null}
      {error ? <p className="empty-state error-text">{error}</p> : null}
      {results && results.length === 0 ? <p className="empty-state">{m.searchEmpty}</p> : null}
      {results && results.length > 0 ? (
        <>
          <p className="fine">{m.searchCount.replace("{n}", String(results.length))}</p>
          <ul className="results">
            {results.map((result) => (
              <li key={result.url} className={result.meta?.image ? "result-row" : undefined}>
                {result.meta?.image ? (
                  <img className="result-thumb" src={result.meta.image} alt="" />
                ) : null}
                <div>
                  <a href={result.url}>{result.meta?.title || result.url}</a>
                  {result.meta?.date ? (
                    <time className="story-time" dateTime={result.meta.date}>
                      {formatDateTime(result.meta.date, lang)}
                    </time>
                  ) : null}
                  {result.excerpt ? <p className="excerpt" dangerouslySetInnerHTML={{ __html: result.excerpt }} /> : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
