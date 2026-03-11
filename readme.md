# 📋 TogetherList

**Real-time collaborative lists without the sign-up friction.**

🌐 **[Try it live → togetherlist.ayasse.cloud](https://togetherlist.ayasse.cloud)** -- Under development

A modern micro-SaaS application enabling instant shared lists for shopping, tasks, or any collaborative needs—no authentication required. Share a link and start collaborating in seconds.

---

## ✨ Key Features

- **🔗 Instant Sharing** — Create a list, share the link, collaborate immediately
- **⚡ Real-time Sync** — Changes appear instantly across all participants
- **🎭 Simple Identity** — Just enter your display name, no sign-up needed
- **📱 Mobile-First** — Responsive design that works beautifully on any device

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
