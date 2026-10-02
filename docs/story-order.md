Published stories are ordered by `published_at` descending. The timestamp’s offset is kept, so an IST time sorts as that instant, not by filename or a featured flag.

The homepage lead is the newest published story. A story with `pinned: true` or `breaking: true` may take the lead only when it was published within the last 36 hours; the newest such story wins. A pin or breaking flag older than 36 hours never leads while any newer published story exists.

The three stories under the lead, the latest list, category pages, and the fact-check list use the same newest-first order. Drafts stay out. The homepage revalidates every 60 seconds.
