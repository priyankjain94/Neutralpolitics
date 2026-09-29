type Row = Record<string, unknown>;

type Bag = {
  submissions: Row[];
  submission_events: Row[];
  signups: Row[];
  reports: Row[];
  error_reports: Row[];
  story_overrides: Row[];
  desk_corrections: Row[];
  audit_log: Row[];
};

function bag(): Bag {
  const host = globalThis as typeof globalThis & { __npFixture?: Bag };
  if (!host.__npFixture) {
    const now = new Date().toISOString();
    host.__npFixture = {
      submissions: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          reference: "NP-2026-PREVIEW",
          created_at: now,
          name: "Preview Contributor",
          phone: "+919800000000",
          email: "preview@example.com",
          city: "Delhi",
          state: "Delhi",
          description: "Fixture row used only when NP_ADMIN_FIXTURE=1 outside production. Not a real submission.",
          event_date: now,
          event_location: "Connaught Place",
          language: "en",
          category: "politics",
          extra_notes: null,
          social_handle: null,
          credit_preference: "name",
          video_key: null,
          video_provider: null,
          video_size_bytes: 12000000,
          video_mime: "video/mp4",
          upload_completed_at: null,
          consent_version: "2026-09-28",
          consent_at: now,
          age_confirmed_at: now,
          consent_ip_hash: "fixture",
          status: "verifying",
          desk_status: "under_review",
          notes: null,
          posted_article_slug: null,
          posted_ig_url: null,
          checklist: {},
          payment_track: "pending",
          payment_amount_inr: 1500,
          payment_method: "UPI",
          payment_reference: "TRACK-ONLY",
          payment_at: null,
        },
      ],
      submission_events: [],
      signups: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          created_at: now,
          email: "reader@example.com",
          whatsapp_e164: "+919811111111",
          language: "en",
          topics: ["all"],
          channel: "both",
          consent_text_version: "2026-09-28",
          consent_at: now,
          unsubscribed_at: null,
          source_page: "/",
        },
      ],
      reports: [],
      error_reports: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          created_at: now,
          updated_at: now,
          story_ref: "/news/2026/09/asian-games-day10",
          what_wrong: "Fixture report used only when NP_ADMIN_FIXTURE=1 outside production. The medal line should be checked against the sources.",
          suggested_correction: "Say India is 12th because the table ranks gold medals first.",
          source_url: "https://sportstar.thehindu.com/asian-games/india-medal-tally-asian-games-2026-live-day-10-september-28/article71518481.ece",
          name: "Preview Reader",
          email: "reader@example.com",
          language: "en",
          consent_contact: true,
          consent_at: now,
          consent_ip_hash: "fixture",
          status: "new",
          notes: null,
          desk_correction_id: null,
          reviewed_at: null,
        },
      ],
      story_overrides: [],
      desk_corrections: [],
      audit_log: [],
    };
  }
  return host.__npFixture;
}

function query(table: keyof Bag) {
  const state: { filters: [string, unknown][]; op: "select" | "insert" | "update" | "delete"; patch: Row | null; row: Row | null } = {
    filters: [],
    op: "select",
    patch: null,
    row: null,
  };
  const matched = () => {
    let rows = bag()[table];
    for (const [key, value] of state.filters) rows = rows.filter((item) => item[key] === value);
    return rows;
  };
  const exec = () => {
    if (state.op === "insert" && state.row) {
      const row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        at: new Date().toISOString(),
        ...state.row,
      };
      bag()[table].unshift(row);
      return { data: row, error: null };
    }
    if (state.op === "update" && state.patch) {
      for (const row of matched()) Object.assign(row, state.patch);
      return { data: matched(), error: null };
    }
    if (state.op === "delete") {
      const drop = new Set(matched());
      bag()[table] = bag()[table].filter((row) => !drop.has(row));
      return { data: null, error: null };
    }
    return { data: matched(), error: null };
  };
  const api = {
    select() {
      return api;
    },
    eq(key: string, value: unknown) {
      state.filters.push([key, value]);
      return api;
    },
    order() {
      return api;
    },
    limit() {
      return api;
    },
    insert(row: Row) {
      state.op = "insert";
      state.row = row;
      return api;
    },
    update(patch: Row) {
      state.op = "update";
      state.patch = patch;
      return api;
    },
    delete() {
      state.op = "delete";
      return api;
    },
    maybeSingle: async () => {
      const { data } = exec();
      const rows = Array.isArray(data) ? data : [];
      return { data: rows[0] || null, error: null };
    },
    then(resolve: (value: { data: unknown; error: null }) => void, reject?: (reason: unknown) => void) {
      try {
        resolve(exec());
      } catch (error) {
        reject?.(error);
      }
    },
  };
  return api;
}

export function fixtureDb() {
  return {
    from(table: string) {
      return query(table as keyof Bag);
    },
    storage: {
      from() {
        return {
          createSignedUploadUrl: async () => ({ data: { signedUrl: "" }, error: null }),
          createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
        };
      },
    },
  };
}

export function fixtureMode(): boolean {
  return process.env.NP_ADMIN_FIXTURE === "1" && process.env.NODE_ENV !== "production";
}
