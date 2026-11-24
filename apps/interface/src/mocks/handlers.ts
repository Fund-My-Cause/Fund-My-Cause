import { http, HttpResponse } from "msw";

const preferencesUrl = "http://localhost/api/preferences";

export const handlers = [
  http.get(preferencesUrl, () =>
    HttpResponse.json({ notifications: true, theme: "system" }),
  ),
  http.post(preferencesUrl, () => HttpResponse.json({ success: true })),
];
