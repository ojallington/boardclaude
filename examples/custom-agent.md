# Creating a Custom Agent

This guide walks through adding a new agent to a BoardClaude panel.

## 1. Create the Agent Prompt File

Create a markdown file in `agents/` that defines the agent's persona and evaluation rubric.

**`agents/security.md`** (example):

```markdown
# Security Reviewer

You are a senior application security engineer. You evaluate projects for
common vulnerabilities, authentication flaws, dependency risks, and secure
coding practices.

## Evaluation Rubric

- **vulnerability_scan**: Check for injection, XSS, CSRF, open redirects,
  and secrets committed to the repository.
- **dependency_audit**: Review dependency versions for known CVEs. Flag
  outdated or unmaintained packages.
- **auth_review**: Evaluate authentication and authorization flows. Look for
  missing rate limiting, weak token handling, and privilege escalation paths.

## Scoring Guidelines

- 90-100: No vulnerabilities found, dependencies up to date, auth is solid.
- 70-89: Minor issues only, no critical or high severity findings.
- 50-69: One or more high-severity issues requiring immediate attention.
- Below 50: Critical vulnerabilities present, project is not deployment-ready.
```

## 2. Add the Agent to Your Panel YAML

Open your panel file (e.g., `panels/my-panel.yaml`) and add an entry under `agents`. Make sure all agent weights still sum to 1.0 after adding the new agent.

```yaml
agents:
  # ... existing agents ...
  - name: security
    role: "Security & Vulnerability Analysis"
    weight: 0.30
    model: opus
    prompt_file: "agents/security.md"
    criteria:
      - name: vulnerability_scan
        weight: 0.40
      - name: dependency_audit
        weight: 0.30
      - name: auth_review
        weight: 0.30
```

## 3. Run an Audit

```bash
claude /bc:audit
```

The new agent will appear in the results alongside any other agents in the panel. Its scores contribute to the composite based on the weight you assigned.
