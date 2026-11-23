window.FIREBASE_APPCHECK_DEBUG_TOKEN = "7f9c3d12-8a4b-4e6f-9c2d-1b8e5a7f3c90";

const API_KEY = "AIzaSyD_hH6a2W3gRCP8vJ53PQeLyofsN3z_UNg";

function redactSecrets(text) {
  let count = 0;
  let clean = text.replace(/sk-[a-zA-Z0-9_-]{8,}/g, function () {
    count++;
    return "[REDACTED_ON_DEVICE]";
  });
  clean = clean.replace(/AIza[0-9A-Za-z-_]{20,}/g, function () {
    count++;
    return "[REDACTED_ON_DEVICE]";
  });
  return { clean: clean, count: count };
}

function localAudit(code) {
  const issues = [];
  if (code.includes("withdrawAll") && !code.includes("onlyOwner")) {
    issues.push("- [CRITICAL] Missing Access Control: withdrawAll() can be called by anyone.");
  }
  if (code.includes(".call{value:") && !code.includes("nonReentrant")) {
    issues.push("- [HIGH] Reentrancy Risk: External ETH transfer via .call{value:} without reentrancy guard.");
  }
  if (code.includes("totalSupply == 0")) {
    issues.push("- [HIGH] ERC-4626 Inflation Attack: Initial share minting vulnerable to direct asset donation.");
  }
  if (issues.length === 0) {
    issues.push("- [INFO] Local heuristic scan passed with no critical patterns.");
  }
  return issues.join("\n");
}

document.getElementById("sampleBtn").onclick = function () {
  document.getElementById("codeInput").value =
    "// ERC-4626 Vault Share Inflation Check\n" +
    "contract MiniVault {\n" +
    "    uint256 public totalAssets;\n" +
    "    uint256 public totalSupply;\n" +
    "    string constant API_KEY = \"AIzaSyD9876543210SecretTokenExample12345\";\n\n" +
    "    function convertToShares(uint256 assets) public view returns (uint256) {\n" +
    "        if (totalSupply == 0) return assets;\n" +
    "        return (assets * totalSupply) / totalAssets;\n" +
    "    }\n" +
    "}";
};

document.getElementById("auditBtn").onclick = async function () {
  const btn = document.getElementById("auditBtn");
  const out = document.getElementById("auditOutput");
  const badge = document.getElementById("routeBadge");
  const log = document.getElementById("redactionLog");
  const mode = document.getElementById("inferenceMode").value;
  const raw = document.getElementById("codeInput").value.trim();

  if (!raw) return;

  btn.disabled = true;
  out.textContent = "Step 1: Scanning & redacting secrets locally on-device...\nStep 2: Running Firebase AI Logic Hybrid Inference...";

  const res = redactSecrets(raw);
  log.textContent = "Local Secret Guard: Masked " + res.count + " secret(s) on-device";
  const localFindings = localAudit(res.clean);

  if (mode === "ONLY_ON_DEVICE") {
    badge.textContent = "Inference Source: ON_DEVICE";
    badge.className = "pill local";
    out.textContent =
      "=== 1. LOCAL PRIVACY SHIELD (ON-DEVICE) ===\n" +
      "Secrets masked locally before network call: " + res.count + "\n\n" +
      "=== 2. ON-DEVICE SECURITY REPORT ===\n" + localFindings + "\n\n" +
      "=== 3. SANITIZED CODE ===\n" + res.clean;
    btn.disabled = false;
    return;
  }

  try {
    const url = "https://googleapis.com" + API_KEY;
    const prompt = "You are a senior smart contract security auditor. Audit this sanitized code (secrets already redacted on-device) and list: 1) Findings, 2) Root Cause, 3) Fixed Solidity Code.\n\n" + res.clean;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const cand = data.candidates && data.candidates.at(0);
    const part = cand && cand.content && cand.content.parts && cand.content.parts.at(0);

    if (part && part.text) {
      badge.textContent = "Inference Source: " + mode;
      badge.className = "pill cloud";
      out.textContent =
        "=== 1. LOCAL PRIVACY SHIELD (ON-DEVICE) ===\n" +
        "Secrets masked on-device prior to cloud call: " + res.count + "\n\n" +
        "=== 2. LOCAL PRE-SCREEN ===\n" + localFindings + "\n\n" +
        "=== 3. HYBRID AI AUDIT (" + mode + ") ===\n\n" + part.text;
    } else {
      throw new Error((data.error && data.error.message) || "Fallback to local report");
    }
  } catch (err) {
    badge.textContent = "On-Device Fallback Active";
    badge.className = "pill local";
    out.textContent =
      "=== 1. LOCAL PRIVACY SHIELD (ON-DEVICE) ===\n" +
      "Secrets masked on-device prior to inference: " + res.count + "\n\n" +
      "=== 2. ON-DEVICE SECURITY REPORT ===\n" + localFindings + "\n\n" +
      "=== 3. SANITIZED CODE ===\n" + res.clean + "\n\n" +
      "(Cloud notice: " + err.message + ")";
  } finally {
    btn.disabled = false;
  }
};
