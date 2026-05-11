# REQ: US Olympics Agent

**Status:** Locked  
**Date:** 2026-05-09  
**Author:** DmytroPaliichuk

---

## Overview

The US Olympics Agent is a conversational AI assistant that answers questions about US Olympic and Paralympic athletes. It draws on a curated dataset of athlete profiles (`athletes_sub_prompt.txt`) and falls back to the model's factual training knowledge for questions outside the dataset. The agent is deployed using Google ADK and accessed via the ADK Web UI.

---

## Actors

| Actor | Description |
|---|---|
| End user | Fans, journalists, or anyone wanting information about US Olympic/Paralympic athletes |
| Developer | Maintains and configures the agent locally |

---

## Dataset

- **Source file:** `us_olympics_agent/athletes_sub_prompt.txt`  
- **Size:** ~4.4 MB  
- **Content:** Structured text profiles for US Olympic and Paralympic athletes, each containing: name, hometown, birthday, education, sport, Paralympic/Olympic experience, medal counts, world championship history, and biography  
- **Scope:** US Olympic and Paralympic athletes across all sports and Games editions present in the file  
- **Update policy:** Out of scope (data is treated as static for this feature)

---

## Primary Flows

### 1. Athlete lookup by name
> User asks about a specific athlete by name.

- The agent retrieves the relevant profile from the dataset.
- The agent summarizes or quotes the profile information in a readable response.
- Example: *"Tell me about Katie Bridge"* → returns name, sport, medals, bio highlights.

### 2. Medal and achievement queries
> User asks about medals, rankings, or notable achievements.

- The agent searches the dataset for athletes matching the criteria.
- The agent returns a list or ranked answer drawn from dataset facts.
- Example: *"Who has the most gold medals?"* or *"Which athletes won gold in Paris 2024?"*

### 3. Sport and event filtering
> User filters athletes by sport, event type, or Games edition.

- The agent retrieves all athletes matching the specified sport/event/Games.
- The agent returns a list with relevant details.
- Example: *"List all US taekwondo athletes"* or *"Who competed in the 2022 Winter Olympics?"*

### 4. Biographical and personal detail queries
> User asks a specific personal or career fact.

- The agent retrieves the matching profile and extracts the requested detail.
- Example: *"Where is Monica Abbott from?"* → *"Salinas, CA"*

### 5. Multi-turn conversation
> User asks a follow-up question referencing a prior exchange.

- The agent retains session context within a single session.
- The agent correctly resolves references like *"What about her medals?"* after a prior athlete lookup.
- Session context does not persist across separate sessions.

---

## Acceptance Criteria

1. **Athlete lookup:** Given a valid athlete name in the dataset, the agent returns accurate profile information within a single conversational turn.
2. **Medal queries:** The agent correctly identifies athletes by medal type (gold/silver/bronze) and Games year when queried.
3. **Sport filtering:** The agent correctly lists athletes for a given sport or event type.
4. **Multi-turn:** After establishing an athlete in conversation, the agent correctly answers follow-up questions about that athlete without the user repeating the name.
5. **Fallback:** When a query targets an athlete not in the dataset, the agent attempts to answer from its training knowledge and clearly indicates it is not drawing from the curated dataset.
6. **Out-of-scope refusal:** The agent does not speculate, fabricate, or offer opinions on athletes. Responses are grounded in verifiable facts only.
7. **Language:** All responses are in English regardless of query language.
8. **ADK Web UI:** The agent is accessible and functional via `adk web` locally.

---

## Data Retrieval

- The dataset is too large (4.4 MB) to be injected wholesale into every model prompt.
- The agent must use a **retrieval-augmented generation (RAG)** approach: the dataset is chunked, embedded, and stored in an in-process local vector store.
- The agent is given a **search tool** that queries the vector store and returns relevant athlete chunks at query time.
- The embedding and chunking strategy is a design concern; requirements only state that retrieval must be accurate enough to surface the correct athlete profile when queried by name.

---

## Errors and Edge Cases

| Scenario | Required behavior |
|---|---|
| Athlete not in dataset | Agent answers from training data and clearly signals it is not from the curated dataset |
| Ambiguous name (multiple athletes share a name or close spelling) | Agent acknowledges ambiguity and asks the user to clarify |
| Query is entirely off-topic (e.g., asking for stock tips) | Agent politely declines and redirects to its purpose |
| Empty or very short query | Agent asks the user for more detail |
| Dataset search returns no results | Agent informs the user it could not find relevant information and offers to try rephrasing |

---

## Non-Functional Requirements

| Concern | Requirement |
|---|---|
| Response latency | Acceptable for a public-facing conversational product; no hard SLA defined at this stage |
| Reliability | Agent should not crash on malformed queries; graceful error responses required |
| Security | No user data is stored beyond in-session context; no PII collected |
| Privacy | Dataset contains public athlete information only; no private data handling required |
| Cost | In-process ChromaDB avoids cloud vector DB costs; model inference costs are a design-time concern |

---

## Integrations and Data Ownership

- **Google ADK:** Agent runtime and deployment framework  
- **Gemini model (via ADK):** Language model powering responses  
- **Local ChromaDB:** In-process vector store for RAG  
- **athletes_sub_prompt.txt:** Sole authoritative data source; treated as read-only at runtime  
- No external APIs, databases, or third-party services beyond the above

---

## Out of Scope

- Real-time data updates or live sports scores
- User authentication or access control
- Multi-language support
- Deployment to Vertex AI Agent Engine (design may address this as a future step)
- Admin interface for updating the athlete dataset
- Analytics or usage tracking
- Custom frontend (beyond ADK Web UI)
- Any personally identifiable information handling beyond what is already public in the dataset
