---
status: Accepted
date: 2026-01-09
---

# AD: Use Azure Container Apps

## Context and Problem Statement

TogetherList requires a deployment strategy that supports:
- Go binary serving the API (and initially the static frontend)
- Mechanism for persistent file storage (JSONL event logs)
- Minimal operational complexity for a micro-SaaS product
- **Cost Efficiency**: Must leverage existing cloud credits/grants or free tiers to keep running costs near zero.

Use of file-based JSONL storage creates a hard requirement for **persistent storage** that survives container restarts. The specific storage implementation (Block vs Object/Blob) and the long-term frontend serving strategy (Binary vs CDN) will be decided in separate ADRs; this decision focuses on the compute/deployment platform for the backend application.

## Decision Drivers

* **Cost**: Must fit within a minimal budget (< $10/mo) or use available free tiers.
* **Flexibility**: Platform must support various storage patterns (Volume mounts, SDKs) and future architectural splits (e.g., separating frontend to CDN).
* **Simplicity**: Single deployment target for the "Walking Skeleton" phase.
* **Scale-to-Zero**: Ability to pause cost when strictly idle is highly desired.

## Considered Options

1. Azure Container Apps (ACA)
2. Oracle Cloud (Always Free VM)
3. Google Cloud Run

### Cost Evaluation Per Option

#### Option 1: Azure Container Apps (ACA)

**Building (Development)**:
- Authoring: Standard Docker container.
- Project Scale: Scale-to-zero supported.
- Onboarding: Azure portal/CLI standard.
- AI Assistance: Excellent.

**Running (Operations)**:
- Runtime: Serverless containers.
- Deployment: `az containerapp up` or GitHub Actions.
- Maintenance: Managed service, no OS patching.

**Externalities**:
- Interoperability: Supports multiple persistence modes and easy integration with Azure CDN/Front Door later.
- **Cost**: Generous free grant (180k vCPU-seconds), fits within available credits.

#### Option 2: Oracle Cloud (Always Free VM)

**Building (Development)**:
- Authoring: Standard Docker Compose or bare metal.
- Project Scale: Fixed resource limits (though generous).
- Onboarding: Higher complexity (Linux admin required).
- AI Assistance: Good.

**Running (Operations)**:
- Runtime: Full VM access.
- Deployment: Manual or via SSH scripts.
- Maintenance: High - responsible for OS security/updates.

**Externalities**:
- Interoperability: Local disk is persistent block storage.
- **Cost**: Free, but high operational "time cost".

#### Option 3: Google Cloud Run

**Building (Development)**:
- Authoring: Docker based.
- Project Scale: Scale-to-zero.
- Onboarding: Simple.
- AI Assistance: Good.

**Running (Operations)**:
- Runtime: Serverless.
- Deployment: `gcloud run deploy`.
- Maintenance: Managed.

**Externalities**:
- Interoperability: Persistence requires FUSE (API costs).
- **Cost**: Good free tier, but storage costs can be unpredictable.

## Decision Outcome

**Selected: Azure Container Apps (ACA)**

Azure Container Apps is the selected strategy because:

1. **Compute/Cost Fit**: Leveages existing Azure credits and free grants for a near-zero cost footprint.
2. **Future-Proofing**:
    - **Storage**: Supports both Volume Mounts and Blob SDKs (decision deferred).
    - **Frontend**: Currently served by Go binary, but ACA creates a clear path to split traffic or put Azure CDN in front later (decision deferred).
3. **Operational Simplicity**: Managed Docker environment eliminates OS maintenance.

### Deployment Architecture

- **Service**: Single Container App (Go binary)
- **Ingress**: External HTTP/HTTPS (Port 8080)
- **Frontend**: Served statically by the Go binary (Current Phase). *Future optimizations may move this to a CDN.*
- **Compute**: Azure Container Apps (Serverless Consumption profile)
- **Persistence**: *To be defined in separate ADR.*

### Operational & Persistence Strategy

**How to run (Operational Model):**
Deployments are container-based.
1. Build Docker image: `docker build -t myregistry.azurecr.io/togetherlist .`
2. Push to Registry: `docker push ...`
3. Update Container App: `az containerapp update --image ...`

**Persistence Note:**
The specific mechanism for persisting the `.jsonl` files is decoupled from this decision. ACA allows connecting to either Azure Files (Volume) or Blob Storage as needed.

## Consequences

* Good, because it leverages existing credits effectively.
* Good, because it provides a flexible foundation for future storage and CDN decisions.
* Good, because scale-to-zero is supported.
* Bad, because Azure has higher configuration complexity than simple PaaS.

## More Information

- Documentation: [Azure Container Apps Overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
- Related ADR: `docs/adr/0003_backend_tech.md`
- Future ADR: Storage Implementation (Azure Files vs Blob)
- Future ADR: Frontend Delivery (Binary vs CDN)
