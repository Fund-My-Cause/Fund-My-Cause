if (process.env.NEXT_PUBLIC_MSW_ENABLED === "true") {
  void import("./mocks/browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass" }),
  );
}
