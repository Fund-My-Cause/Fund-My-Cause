import { expect, test } from "@playwright/test";

test("uses the shared MSW handler for preferences requests", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();

  const response = await page.evaluate(async () => {
    const result = await fetch("/api/preferences");
    return {
      status: result.status,
      body: await result.json(),
    };
  });

  expect(response).toEqual({
    status: 200,
    body: { notifications: true, theme: "system" },
  });
});
