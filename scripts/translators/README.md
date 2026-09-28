# Hindi translation step

The importer calls one translator after the English article is built. No paid key is required for the default.

## Contract

Input fields:

- `title`
- `standfirst`
- `body`
- `key_facts` (string array)
- `sides` (`{ label, text }` array)
- `not_confirmed` (string array)
- `factcheck_claim`
- `factcheck_evidence` (string array)

Do not translate outlet names, source headlines, URLs, slugs, photo credits, or the Instagram embed.

The glossary in `content/glossary.json` is part of the prompt. Numbers, ₹ amounts and dates must survive unchanged.

## Providers

`TRANSLATION_PROVIDER=none` (default) copies the English fields and forces the article to stay a draft, because the automatic checks fail.

`TRANSLATION_PROVIDER=http` POSTs the fields to `TRANSLATION_HTTP_URL`. Optional `TRANSLATION_HTTP_KEY` is sent as a bearer token. The response must be:

```json
{
  "engine": "your-engine",
  "model": "your-model",
  "fields": { "title": "", "standfirst": "", "body": "", "key_facts": [], "sides": [], "not_confirmed": [], "factcheck_claim": "", "factcheck_evidence": [] }
}
```

Add another file in this folder and branch on `TRANSLATION_PROVIDER` in `scripts/import-post.mjs` if you want a different client. Keep the key in the environment, never in git.

## Automatic checks

After a real translation, the importer checks that:

- every number and ₹ amount in the English text appears in the Hindi text
- glossary terms that appear in English appear as the Hindi entry
- the Hindi length is between 0.8× and 1.6× the English length

If a check fails, Hindi stays a draft (`status_hi: draft`). While `IMPORT_ALWAYS_DRAFT` is not `false`, the English article is a draft too.
