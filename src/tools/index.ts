import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OmniFocusClient } from "../omnifocus/client.js";
import { registerDatabaseTools } from "./database.js";
import { registerQueryTools } from "./query.js";
import { registerTaskTools } from "./tasks.js";
import { registerProjectTools } from "./projects.js";
import { registerFolderTools } from "./folders.js";
import { registerTagTools } from "./tags.js";
import { registerPerspectiveTools } from "./perspectives.js";

export function registerAllTools(server: McpServer, client: OmniFocusClient): void {
  registerDatabaseTools(server, client);
  registerQueryTools(server, client);
  registerTaskTools(server, client);
  registerProjectTools(server, client);
  registerFolderTools(server, client);
  registerTagTools(server, client);
  registerPerspectiveTools(server, client);
}
