import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export async function startMockApi(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
  });
}
