/**
 * Data layer entry point.
 *
 * The original implementation connected to MongoDB via MONGODB_URI. There is
 * no MongoDB on this host — the persistent document store available is the
 * DynamoDB service of the floci AWS emulator, so this now warms the
 * DynamoDB-backed models instead.
 *
 * The exported surface (`connectDB`) is unchanged, so no call site changes.
 */

import { Account } from "./models/account";
import { AgentTask } from "./models/agent-task";
import { Proxy } from "./models/proxy";
import { Soul } from "./models/soul";
import { Tunnel } from "./models/tunnel";
import { User } from "./models/user";

let ready: Promise<void> | null = null;

/**
 * Warm every model. Each creates its DynamoDB table on first use, so this only
 * needs to touch them once. Idempotent for concurrent callers, and resets on
 * failure so a later call can retry after a transient outage.
 */
export async function connectDB(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await Promise.all([
        Account.countDocuments(),
        AgentTask.countDocuments(),
        Proxy.countDocuments(),
        Soul.countDocuments(),
        Tunnel.countDocuments(),
        User.countDocuments(),
      ]);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}
