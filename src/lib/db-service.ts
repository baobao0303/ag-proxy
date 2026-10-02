import { connectDB } from "./db";
import { Account } from "./models/account";
import { AgentTask } from "./models/agent-task";
import { Proxy } from "./models/proxy";
import { Soul } from "./models/soul";
import { Tunnel } from "./models/tunnel";
import { User } from "./models/user";

// Populate() needs a registry so Account -> Proxy, Tunnel -> Account and
// AgentTask -> Soul references resolve. Registered after all models exist.
const models = { Account, AgentTask, Proxy, Soul, Tunnel, User };
for (const m of Object.values(models)) m.registerModels(models);

export const dbService = {
  connect: connectDB,
  account: Account,
  agentTask: AgentTask,
  proxy: Proxy,
  soul: Soul,
  tunnel: Tunnel,
  user: User,
};
