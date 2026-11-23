# VaultGuard Hybrid

**Privacy-First Smart Contract & Code Secret Auditor powered by Firebase AI Logic Hybrid Inference**

## Overview
**VaultGuard Hybrid** solves a core developer security dilemma: auditing smart contracts (`.sol`), configuration files, and application code for vulnerabilities without leaking sensitive credentials (`API_KEY`, private keys, tokens) to external cloud endpoints.

## How Hybrid AI Architecture Works
1. **Zero-Leak On-Device Privacy Shield (Local / Gemini Nano):** Before any external inference call, VaultGuard Hybrid scans and redacts hardcoded secrets strictly inside the user's browser and runs on-device triage using Firebase AI Logic (`InferenceMode.PREFER_ON_DEVICE` / `ONLY_ON_DEVICE`).
2. **Cloud Deep Audit Fallback (Gemini 2.5 Flash via Firebase AI Logic):** Sanitized code structures are evaluated via Firebase AI Logic (`GoogleAIBackend`) to identify access control flaws, reentrancy risks, and ERC-4626 edge cases, returning actionable remediation snippets.
3. **Security & Abuse Prevention:** Protected with **Firebase App Check** (debug token enabled for hackathon evaluation).

## Live Demo
Hosted via GitHub Pages: `https://github.io`

## License
Apache License 2.0
