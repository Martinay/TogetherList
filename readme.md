# 📋 TogetherList

**Real-time collaborative lists without the sign-up friction.**

🌐 **[Try it live → togetherlist.eu](https://togetherlist.eu)** -- Under development

A modern micro-SaaS application enabling instant shared lists for shopping, tasks, or any collaborative needs—no authentication required. Share a link and start collaborating in seconds.

---

## ✨ Key Features

- **🔗 Instant Sharing** — Create a list, share the link, collaborate immediately
- **⚡ Real-time Sync** — Changes appear instantly across all participants
- **🎭 Simple Identity** — Just enter your display name, no sign-up needed
- **📱 Mobile-First** — Responsive design that works beautifully on any device
- **🤖 MCP Server for AI** — Built-in Model Context Protocol HTTP/SSE endpoint for AI assistants (Claude, Cursor, Antigravity)

---

## 🤖 Model Context Protocol (MCP) Server

TogetherList provides a built-in MCP server accessible over HTTP, allowing AI assistants to manage lists and items.

### Endpoints
- **SSE Transport**: `GET /api/v1/mcp/sse` (and alias `/mcp/sse`)
- **Message Transport**: `POST /api/v1/mcp/messages` (and alias `/mcp/messages`)
- **Direct JSON-RPC**: `POST /api/v1/mcp` (and alias `/mcp`)

### Supported Tools
- `create_list` — Create a new shared list with creator and participants
- `get_list` — Retrieve full current state of a list
- `list_lists` — Enumerate existing shared lists
- `rename_list` — Rename a shared list
- `add_item` — Add an item to a list
- `complete_item` — Toggle completion status of an item
- `assign_item` — Assign an item to participant(s)
- `update_item_title` — Edit item title
- `update_item_description` — Edit item description

### Client Configuration (e.g. Cursor / Claude Desktop)
```json
{
  "mcpServers": {
    "togetherlist": {
      "url": "http://localhost:8080/api/v1/mcp/sse"
    }
  }
}
```

---


## 🏗️ Technical Highlights

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | React + Vite + TypeScript | Fast builds, excellent DX, tree-shaking for <200KB bundles |
| **Backend** | Go (stdlib) | Minimal dependencies, predictable performance, easy containerization |
| **Architecture** | Event Sourcing | Full audit trail, time-travel debugging, conflict-free collaboration |
| **Infrastructure** | Azure Container Apps + Bicep | Infrastructure as Code, auto-scaling, managed SSL |
| **CI/CD** | GitHub Actions | Automated testing, security scanning, containerized deployments |

---

## 🎯 Architecture Decisions

Decision-making is documented through Architecture Decision Records (ADRs) in `docs/adr/`.

## 📚 Documentation

- `docs/vision.md` — Product vision and direction
- `docs/requirements/` — Functional requirements (EARS format)
- `docs/tasks/` — Implementation tasks and execution units
- `docs/adr/` — Architecture Decision Records
- `docs/CICD_SETUP.md` — CI/CD setup and pipeline notes
- `docs/ssl-setup.md` — TLS/SSL setup notes

---

## 🚀 Quick Start

```bash
# Frontend
cd frontend && bun install && bun run dev

# Backend
cd backend && go run ./cmd/server
```

---

## 📁 Project Structure

```
├── frontend/          # React + Vite SPA
├── backend/           # Go HTTP server with event sourcing
├── infra/             # Azure Bicep IaC modules
├── docs/
│   ├── adr/           # Architecture Decision Records
│   └── requirements/  # EARS-syntax specifications
└── .github/workflows/ # CI/CD pipeline
```
