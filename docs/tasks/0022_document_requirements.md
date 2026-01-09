# Document Formal Requirements

## Goal
Extract and document formal requirements from `docs/vision.md` following the EARS-based requirements template.

## Scope
- **Directory**: `docs/requirements/`
- **Files**: Multiple requirement files (one per requirement)

## Context
- **Vision doc**: `docs/vision.md` contains informal feature descriptions.
- **Template**: `docs/requirements/0001_template-requirements.md` defines the format.
- **Rules**: `docs/requirements/0000_readme-requirements.md` defines atomicity and EARS syntax.
- **Current state**: No formal requirements documented yet (only template exists).

## Granular Instructions
- [ ] Review `docs/vision.md` and extract discrete requirements.
- [ ] For each requirement, create a file using the template:
    - Use EARS syntax ("The system shall...")
    - One requirement per file
    - Include acceptance criteria
- [ ] Suggested requirements to document:

### Functional Requirements
- [ ] `0002_list_creation.md` - Create new list with UUID
- [ ] `0003_list_sharing.md` - Access list via unique URL
- [ ] `0004_user_identity.md` - Display name entry (no password)
- [ ] `0005_identity_persistence.md` - Name stored in LocalStorage
- [ ] `0006_item_creation.md` - Add items with title
- [ ] `0007_item_editing.md` - Edit item titles
- [ ] `0008_item_assignment.md` - Assign items to string value
- [ ] `0009_item_completion.md` - Mark items as done
- [ ] `0010_realtime_updates.md` - List updates automatically

### Non-Functional Requirements
- [ ] `0011_event_sourcing.md` - State derived from event log
- [ ] `0012_jsonl_storage.md` - Events stored as JSONL

## Cross-Reference
Link existing tasks to requirements once documented:
| Requirement | Related Tasks |
|-------------|---------------|
| REQ-0002 | 0005 (Landing Page) |
| REQ-0003 | 0010 (Routing) |
| REQ-0004, 0005 | 0011 (User Identity) |
| REQ-0006 | 0013 (Add Item UI), 0009 (Item API) |
| REQ-0007, 0008, 0009 | 0014 (Item Actions) |
| REQ-0010 | 0015 (Polling) |
| REQ-0011, 0012 | 0007 (Event Sourcing) |

## Definition of Done
- [ ] All requirements from vision.md are documented.
- [ ] Each requirement uses EARS syntax.
- [ ] Acceptance criteria defined for each.
- [ ] `status.md` updated.
- [ ] Next Task created if needed.
