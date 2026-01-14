# Document Formal Requirements

## Goal
Extract and document formal requirements from `docs/vision.md` following the EARS-based requirements template.

## Scope
- **Directory**: `docs/requirements/`
- **Files**: Multiple requirement files (one per requirement)

## Context
- **Vision doc**: `docs/vision.md` contains informal feature descriptions.
- **Template**: `docs/requirements/0001_template-requirements.md` defines the format.
- **Rules**: `.agent/skills/requirements/SKILL.md` defines atomicity and EARS syntax.
- **Current state**: ✅ All formal requirements documented (REQ-0002 to REQ-0012).

## Granular Instructions
- [x] Review `docs/vision.md` and extract discrete requirements.
- [x] For each requirement, create a file using the template:
    - Use EARS syntax ("The system shall...")
    - One requirement per file
    - Include acceptance criteria
- [x] Suggested requirements to document:

### Functional Requirements
- [x] `0002_list_creation.md` - Create new list with UUID
- [x] `0003_list_sharing.md` - Access list via unique URL
- [x] `0004_user_identity.md` - Display name entry (no password)
- [x] `0005_identity_persistence.md` - Name stored in LocalStorage
- [x] `0006_item_creation.md` - Add items with title
- [x] `0007_item_editing.md` - Edit item titles
- [x] `0008_item_assignment.md` - Assign items to string value
- [x] `0009_item_completion.md` - Mark items as done
- [x] `0010_realtime_updates.md` - List updates automatically

### Non-Functional Requirements
- [x] `0011_event_sourcing.md` - State derived from event log
- [x] `0012_jsonl_storage.md` - Events stored as JSONL

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
- [x] All requirements from vision.md are documented.
- [x] Each requirement uses EARS syntax.
- [x] Acceptance criteria defined for each.
- [x] `status.md` updated.
- [x] Next Task created if needed.

