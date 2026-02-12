Here are the most effective advanced strategies to manage a ballooning context window.

---

## 1. Implement "Just-in-Time" Data Loading (URI Resources)

The biggest reason your context window is at 93% is that **Tool Results** are being treated as part of the "conversation history."

* **The Fix:** Instead of returning a massive JSON block or log file, have your MCP tool return a **URI Reference** (e.g., `mcp://logs/session_42`).
* **How it works:** MCP supports **Resources**. When a tool returns a URI, VS Code displays it as a link or a "virtual file." The AI only "reads" the content (consuming tokens) when it explicitly decides to open that resource. This keeps the "Messages" and "Tool Results" segments of your context window extremely small.

## 2. Use a "Memory" MCP Tool

VS Code Copilot's memory resets per session. You can bypass this by adding a "Knowledge Base" tool to your MCP server.

* **The Pattern:** Create two tools: `store_context(key, info)` and `retrieve_context(query)`.
* **Persistence:** Have your MCP server save this data to a local `memory.json` or a SQLite database.
* **The Workflow:** Add a rule to your `.github/copilot-instructions.md` file:
> *"At the end of a complex task, use the `store_context` tool to summarize the architectural decisions made. At the start of a new chat, use `retrieve_context` to refresh your memory."*



## 3. Leverage "Subagents" for Heavy Lifting

If you are on a recent version of VS Code Copilot, use the **Subagent** pattern to isolate context bloat.

* **Context Isolation:** When you delegate a task (e.g., "Analyze these 20 files for bugs"), the Subagent opens its own **separate** context window.
* **The Hand-off:** Once the Subagent finishes, it returns only a **compact summary** to your main chat.
* **Result:** You get the benefit of 128K tokens of research, but your main chat only "sees" (and pays for) the 500-token summary.

---

### Summary of Compaction Techniques

| Technique | Effort | Impact on Context | Best For |
| --- | --- | --- | --- |
| **LLM Summarization** | Medium | High | Summarizing logs/JSON before the server sends them. |
| **MCP Resources** | High | Extreme | Large datasets, documentation, or long files. |
| **Pagination** | Low | Medium | Lists of items, database rows, or search results. |
| **Subagents** | None (Built-in) | High | Multi-step research or large-scale code analysis. |
