---
status: Proposed
date: 2026-01-26
---

# AD: Adopt Infrastructure as Code (IaC) with Azure Bicep

## Context and Problem Statement

TogetherList's infrastructure (Azure Container Apps, Registry, etc.) is currently provisioned using imperative Azure CLI scripts (`docs/CICD_SETUP.md`).
- **Problem**: Manual execution ("click-ops") leads to configuration drift, lack of state tracking, and difficulty in replicating environments (e.g., spinning up a staging environment).
- **Goal**: We need a way to define infrastructure declaratively, version it with our code, and automate its deployment.

## Decision Drivers

*   **Reproducibility**: Ability to recreate the entire environment from scratch.
*   **Simplicity**: Minimize operational overhead (e.g., managing remote state files).
*   **Cost**: Must not incur additional monthly costs for management tooling.
*   **Azure-Native**: The project is already committed to Azure (ADR-0004).

## Considered Options

1.  **Azure Bicep**
2.  **Terraform**
3.  **Pulumi (Self-Managed State)**
4.  **Manual CLI Scripts (Status Quo)**

### Cost Evaluation Per Option

#### Option 1: Azure Bicep

**Building (Development)**:
-   **Authoring**: Domain-specific language (DSL) that is cleaner than ARM templates. Excellent VS Code extension.
-   **Project Scale**: Modular and scalable, but specific to Azure.
-   **Onboarding**: Low friction for those already using Azure CLI. No external state backend to configure.
-   **AI Assistance**: Strong support from Copilot/AI tools.

**Running (Operations)**:
-   **Runtime**: Transpiles to ARM templates and executes directly against Azure Resource Manager.
-   **Deployment**: `az deployment group create`. No state file management required (Azure is the state).
-   **Maintenance**: Day-0 support for all Azure resources.

**Externalities**:
-   **Interoperability**: Azure only. Lock-in prevents easy migration to AWS/GCP (but application is containerized, so migration is possible by rewriting infra).
-   **Security**: IAM managed via standard Azure RBAC.

#### Option 2: Terraform

**Building (Development)**:
-   **Authoring**: HCL (HashMap Configuration Language). Industry standard.
-   **Project Scale**: Extremely scalable and modular.
-   **Onboarding**: Higher learning curve. **Requires bootstrapping a remote state backend** (Blob Storage + Locking).
-   **AI Assistance**: Excellent.

**Running (Operations)**:
-   **Runtime**: Terraform binary.
-   **Deployment**: Plan/Apply workflow.
-   **Maintenance**: Provider updates required. State drift must be managed (e.g., `terraform refresh`).

**Externalities**:
-   **Interoperability**: Cloud agnostic (in theory, though code is provider-specific).
-   **Security**: State file contains secrets and must be carefully protected.

#### Option 3: Pulumi (Self-Managed State)

**Building (Development)**:
-   **Authoring**: General purpose languages (TypeScript, Go, Python). Full power of loop/logic constructs.
-   **Project Scale**: Extremely high. Best-in-class modularity.
-   **Onboarding**: High. Team must learn Pulumi-specifics + manage a state backend (Azure Blob Storage) before writing infrastructure.
-   **AI Assistance**: Good.

**Running (Operations)**:
-   **Runtime**: CLI driven.
-   **Deployment**: Requires authenticating to both Cloud Provider (Azure) and State Backend (storage account).
-   **Maintenance**: "Manage the manager" - you are responsible for the availability and locking of the state file in Blob Storage.

**Externalities**:
-   **Interoperability**: Cloud agnostic concepts, but code is specific to Azure SDK.
-   **Security**: State file encryption and access control is entirely the user's responsibility.

#### Option 4: Manual CLI Scripts (Status Quo)

**Building (Development)**:
-   **Authoring**: Shell scripts.
-   **Project Scale**: Hard to maintain as complexity grows.
-   **Onboarding**: Easy (just run script), but fragile ("works on my machine").
-   **AI Assistance**: Good.

**Running (Operations)**:
-   **Runtime**: Bash/Zsh.
-   **Deployment**: Manual. No idempotency guarantees (scripts often fail if resource already exists).
-   **Maintenance**: High manual effort to track changes.

**Externalities**:
-   **Interoperability**: N/A.
-   **Security**: Credentials often hardcoded or passed in env vars ad-hoc.

## Decision Outcome

**Selected: Option 1 (Azure Bicep)**

We choose **Azure Bicep** because:
1.  **Simplicity**: It eliminates the need to manage a remote state file (unlike Terraform or Self-Managed Pulumi), which drastically reduces the "tax" of adopting IaC for a small team/project.
2.  **Azure Focus**: Since we are fully committed to Azure (ADR-0004), the benefits of cloud-agnostic tools are outweighed by the maintenance overhead of managing state backends.
3.  **Cost**: Zero additional cost.

## Consequences

*   **Positive**: Infrastructure is now code, versioned in git.
*   **Positive**: Deployments are idempotent and automated.
*   **Positive**: No managing state files or locks.
*   **Negative**: We are more tightly coupled to the Azure ecosystem (vendor lock-in).
*   **Negative**: Team must learn Bicep syntax (though it is similar to TypeScript/JSON).
