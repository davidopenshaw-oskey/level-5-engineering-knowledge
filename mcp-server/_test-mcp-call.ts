// Temporary, one-shot generic MCP tool caller for interactive investigation.
// Usage: node -r ts-node/register mcp-server/_test-mcp-call.ts <toolName> '<jsonArgs>'
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const [toolName, argsJson] = process.argv.slice(2);
  const args = JSON.parse(argsJson);

  const transport = new StdioClientTransport({
    command: "node",
    args: ["-r", "ts-node/register", "mcp-server/src/index.ts"],
    cwd: process.cwd(),
  });
  const client = new Client({ name: "manual-investigation-client", version: "0.1.0" }, { capabilities: {} });
  await client.connect(transport);

  const result = await client.callTool({ name: toolName, arguments: args });
  const content = JSON.parse((result.content as any)[0].text);
  console.log(JSON.stringify(content, null, 2));

  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
