# TogetherList - App Features & Architecture

## Goals
Create a web app for organizing and assigning list items.
*   **Simplicity**: No complex auth, just enter a name.
*   **Real-time**: Updates propagate to other users.
*   **Shareable**: Easy sharing via unique links.

## Features
### 1. Landing Page
*   **Create a new list**: Generates a unique UUID and redirects to the list page.

### 2. Identity & Access
*   **No Password**: Users simply enter a display name.
*   **Persistence**: The name is stored in the browser's LocalStorage.
*   **Sharing**: The list is accessible via a unique URL (e.g., `/list/<uuid>`). Anyone with the link can join.

### 3. List Page
*   **View Items**: See all list items with their status.
*   **Add Items**: Create new items with a title.
*   **Edit Items**: Update item titles.
*   **Assign Items**: Assign items to any string (e.g., a user's name or a category like "Groceries").
*   **Complete Items**: Mark items as done.
*   **Real-time Updates**: The list updates automatically to show changes from other users.

## Architecture: Event Sourcing
The state of a list is derived entirely from a sequence of immutable events stored in a JSONL file (one file per list).

### Storage
*   Format: JSON Lines (`.jsonl`).
*   Location: Server-side file system.

### Event Schema
| Event Type | Payload | Description |
| :--- | :--- | :--- |
| `ListCreated` | `{ "name": "..." }` | Initial creation of the list. |
| `UserJoined` | `{ "username": "..." }` | A user accessed the list. |
| `ItemAdded` | `{ "item_id": "uuid", "title": "..." }` | A new item was added. |
| `ItemCompleted` | `{ "item_id": "uuid", "is_completed": bool }` | Item status changed. |
| `ItemAssigned` | `{ "item_id": "uuid", "assigned_to": "..." }` | Item assigned to a person/category. |
| `ItemTitleEdited` | `{ "item_id": "uuid", "new_title": "..." }` | Item renamed. |