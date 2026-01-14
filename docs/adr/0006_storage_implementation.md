# 6. Storage Implementation

Date: 2026-01-14

## Status

Accepted

## Context

The application is architected around **Event Sourcing**, where the state is derived from an append-only log of events (`events.jsonl`).
We have chosen **Azure Container Apps** for deployment (ADR 0004).
We need a storage solution that:
1.  **Is Persistent**: Data must survive container restarts and deployments.
2.  **Is Simple**: Aligns with the "Vibe Coding" philosophy (minimal complexity).
3.  **Is Flexible**: Allows us to switch to a more scalable solution (like Blob Storage) later if successful, without rewriting the core business logic.

We evaluated two main options:
1.  **Azure Files (Volume Mount)**: Mounted as a standard directory. Accessed via standard Go `os` file operations.
2.  **Azure Blob Storage**: Accessed via the Azure SDK over HTTP.

## Decision

We will use **Azure Files** mounted as a volume, accessed via a **Storage Interface (Repository Pattern)**.

### 1. Storage Backend: Azure Files
We will mount an Azure File Share to the container.
-   **Mechanism**: The app will read/write to a local path (e.g., `/data/events.jsonl`).
-   **Concurrency**: We will use `flock` (supported by Azure Files over NFS/SMB) to ensure only one process writes to the file at a time, preventing corruption if we vertically scale (though we plan to run as a singleton initially).

### 2. Architecture: Repository Pattern
We will **not** hardcode file system logic into the domain layer. Instead, we will define an interface:

```go
type EventStore interface {
    Append(events []Event) error
    LoadAll() ([]Event, error)
}
```

-   **Initial Implementation**: `FileEventStore` (uses `os.OpenFile`, `flock`, `json.Encoder`).
-   **Future Implementation**: `BlobEventStore` (uses Azure SDK, Lease Blob, blocks).

## Consequences

### Positive
-   **Simplicity**: The initial code is just standard Go file I/O. No cloud SDKs required for the minimal version.
-   **Dev/Prod Parity**: Local development uses a local file. Production uses a mounted file. The code path is identical.
-   **Future-Proofing**: The interface ensures that switching to Blob Storage later is a contained refactoring of the *adapter* layer, not the *domain* layer.

### Negative
-   **Cost**: Azure Files is slightly more expensive per GB than Blob Storage (approx $0.06/GB vs $0.018/GB), but for text logs, this is negligible (< $1/month).
-   **Performance**: Network file systems (SMB/NFS) have higher latency than local disks, but this is acceptable for our expected throughput.

## Comparison Table

| Feature | Azure Files (Volume Mount) | Azure Blob Storage (SDK) |
| :--- | :--- | :--- |
| **Integration** | Native `os` package | Azure SDK |
| **Dev Experience** | Identical to Local | Different (needs mocking) |
| **Cost** | ~$0.06/GB | ~$0.018/GB (Hot) |
| **Locking** | `flock` supported | Lease Blob |
