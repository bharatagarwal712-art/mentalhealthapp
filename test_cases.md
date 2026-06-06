# Kivi Test Cases

This document details the automated test cases implemented for the Kivi application. These tests ensure the security, reliability, and data integrity of the application.

## 1. Security & Vulnerability Tests (`tests/security.test.js`)

**Objective:** Ensure the application is protected against Cross-Site Scripting (XSS) attacks, particularly from user-generated content like notes and exam labels.

| Test Case ID | Description | Expected Outcome |
| :--- | :--- | :--- |
| `SEC-001` | **XSS Prevention (Malicious Tags)**: Attempt to pass `<script>alert('xss')</script>` into the `sanitizeHTML` utility. | The output should escape the tags (e.g., `&lt;script&gt;`) and not contain executable `<script>` blocks. |
| `SEC-002` | **Graceful Null Handling**: Pass `null`, `undefined`, or an empty string `""` to `sanitizeHTML`. | The output should safely return an empty string without throwing TypeError exceptions. |

## 2. State & Storage Integrity Tests (`tests/store.test.js`)

**Objective:** Verify that local storage operations, state mutations, and persistence behaviors function correctly without corrupting user data.

| Test Case ID | Description | Expected Outcome |
| :--- | :--- | :--- |
| `STR-001` | **Data Persistence**: Save a mock user profile and session to local storage using `store_save`, reset memory, and then call `store_load`. | The in-memory state should exactly match the mock profile and session data loaded from `localStorage`. |
| `STR-002` | **Session Appending**: Call `store_addSession` with a new mock session object. | The state array length should increase by 1, and the local storage cache should immediately reflect the newly added session. |
| `STR-003` | **Message Context Updates**: Call `store_updateSession` with an existing session ID and a new message object. | The correct session object in memory should append the message, and local storage should update to contain the new message history. |
| `STR-004` | **Data Wipe (Logout)**: Set mock data in local storage, then call `store_clear`. | The `kivi_data` key should be fully removed from `localStorage`, and `location.reload()` should be triggered to reset the app state. |

## Running the Tests
All tests are implemented using the **Jest** framework running via Node.js (with `jest-environment-jsdom`).

**Command:**
```bash
npm install
npm run test
```
