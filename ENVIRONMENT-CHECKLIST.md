# BoardClaude Environment Checklist

Complete everything on this list before Feb 10, 12:00 PM EST (6:00 PM CET).
Each section includes the verification command to confirm it works.

---

## 1. System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Windows 10+ with WSL2 | Windows 11 with WSL2 (Ubuntu 22.04) |
| RAM | 8 GB | 16 GB+ |
| Disk Space | 5 GB free | 10 GB+ free |
| Internet | Stable connection | Stable + backup hotspot |
| Terminal | Windows Terminal or WSL terminal | Windows Terminal with split pane support |

---

## 2. Software Installation

### 2.1 Node.js 20+

**Install (WSL/bash):**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

**Install (PowerShell -- alternative):**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Verify:**
```bash
node --version    # Should output v20.x.x or higher
npm --version     # Should output 10.x.x or higher
npx --version     # Should output 10.x.x or higher
```

- [ ] Node.js 20+ installed
- [ ] npm 10+ installed

---

### 2.2 Git

**Install (WSL/bash):**
```bash
sudo apt update && sudo apt install git -y
```

**Configure:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global init.defaultBranch main
```

**Verify:**
```bash
git --version          # Should output git version 2.x.x
git config user.name   # Should output your name
git config user.email  # Should output your email
```

- [ ] Git installed and configured

---

### 2.3 Claude Code

**Install (WSL/bash):**
```bash
npm install -g @anthropic-ai/claude-code
```

**Verify:**
```bash
claude --version       # Should output latest version
claude --help          # Should display help text
```

**Update if already installed:**
```bash
npm update -g @anthropic-ai/claude-code
```

- [ ] Claude Code latest version installed

---

### 2.4 tmux (for Agent Teams split panes)

**Install (WSL/bash):**
```bash
sudo apt install tmux -y
```

**Verify:**
```bash
tmux -V                # Should output tmux 3.x
```

**Basic tmux commands (reference):**
```
tmux new -s boardclaude         # Start named session
Ctrl+B then %                   # Split pane vertically
Ctrl+B then "                   # Split pane horizontally
Ctrl+B then arrow keys          # Navigate panes
Ctrl+B then d                   # Detach session
tmux attach -t boardclaude      # Reattach session
```

**Alternative: Windows Terminal split panes**
If you prefer Windows Terminal over tmux:
- `Alt+Shift+D` to duplicate pane
- `Alt+Shift+Plus` for vertical split
- `Alt+Shift+Minus` for horizontal split
- `Alt+Arrow` to navigate between panes

- [ ] tmux installed OR Windows Terminal split panes working

---

### 2.5 Multiple Concurrent Claude Code Sessions

For parallel agent team execution across Tracks A-D, you may need multiple concurrent Claude Code sessions running simultaneously.

**Setup:**
- Use tmux or Windows Terminal split panes to manage 2-4 concurrent sessions
- Each session runs its own Claude Code instance
- Sessions share the same project directory and git repo
- Be careful with concurrent file edits — use git branches or coordinate via `.boardclaude/state.json`

**Resource requirements for parallel sessions:**
- RAM: 16 GB minimum (recommended 32 GB for 4 concurrent sessions)
- CPU: 4+ cores recommended
- Network: Stable connection for concurrent API calls

**Verify concurrent session support:**
```bash
# Open tmux with 2 panes
tmux new-session -d -s track-a
tmux split-window -h -t track-a
tmux send-keys -t track-a.0 'claude' C-m
tmux send-keys -t track-a.1 'claude' C-m
# Both should start without errors
tmux kill-session -t track-a  # Clean up test
```

- [ ] Confirmed 2+ concurrent Claude Code sessions work

---

### 2.6 Additional Tools

**Install (WSL/bash):**
```bash
sudo apt install jq -y          # JSON processing (used by hooks)
sudo apt install curl -y        # HTTP requests
```

**Verify:**
```bash
jq --version                    # Should output jq-1.x
curl --version                  # Should output curl 7.x or 8.x
```

- [ ] jq installed
- [ ] curl installed

---

## 3. Accounts to Verify

### 3.1 GitHub

- [ ] GitHub account logged in
- [ ] SSH key configured for git push (test: `ssh -T git@github.com`)
- [ ] Repo NOT YET CREATED (create at go-live, or create empty private repo now with README only)

**If creating repo early:**
```bash
# This is fine to do before Feb 10 -- just keep it empty
gh repo create boardclaude --private --description "Assemble a board of AI agents that evaluate your project from multiple expert perspectives"
```

Or create via GitHub web UI: github.com/new

---

### 3.2 Vercel

- [ ] Vercel account logged in (vercel.com)
- [ ] Vercel CLI installed (optional but useful):
  ```bash
  npm install -g vercel
  vercel login
  ```
- [ ] Vercel project created and connected to GitHub repo
- [ ] Custom domain `boardclaude.com` configured in Vercel project settings
- [ ] Redirect `boredclaude.com` -> `boardclaude.com/?bored=true` configured
  - In Vercel project settings -> Domains -> Add `boredclaude.com`
  - Configure redirect in `vercel.json` or Vercel dashboard

---

### 3.3 Anthropic API

- [ ] Anthropic API key available (console.anthropic.com)
- [ ] $500 credits confirmed on billing page
- [ ] API key set in environment:
  ```bash
  # Add to ~/.bashrc or ~/.zshrc
  export ANTHROPIC_API_KEY="sk-ant-..."
  ```
- [ ] Test API connectivity:
  ```bash
  claude -p "Say hello" --output-format json
  ```
  Should return a valid JSON response without errors.

---

## 4. Configuration Steps

### 4.1 Agent Teams Environment Variable

This is the critical experimental feature that enables multi-agent coordination.

**Option A: Set in shell profile (WSL/bash):**
```bash
echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1' >> ~/.bashrc
source ~/.bashrc
```

**Option B: Set in Claude Code settings (recommended -- goes into the repo):**

The prep-kit already includes this in `.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "64000",
    "MAX_THINKING_TOKENS": "31999"
  }
}
```

**Verify Agent Teams works:**
```bash
# Start Claude Code and ask it to create a 2-agent team for a simple task
claude
# Then type: "Create an agent team with 2 agents to research and summarize a topic"
# If it spawns teammates, Agent Teams is working
```

- [ ] Agent Teams env var set
- [ ] Agent Teams tested with a simple 2-agent task

---

### 4.2 Claude Code Permissions

The prep-kit `.claude/settings.json` includes pre-configured permissions to avoid repeated permission prompts during the hackathon:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git *)",
      "Bash(node *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(jq *)",
      "Bash(prettier *)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "Glob(*)",
      "Grep(*)",
      "Task(*)"
    ],
    "deny": [
      "Read(./.env*)",
      "Bash(rm -rf /)"
    ]
  }
}
```

- [ ] Reviewed permissions and confirmed they are appropriate

---

### 4.3 Domain Setup

**boardclaude.com:**
1. DNS pointing to Vercel (either via Vercel nameservers or CNAME record)
2. Vercel project has `boardclaude.com` as custom domain
3. SSL certificate auto-provisioned by Vercel

**boredclaude.com:**
1. DNS pointing to Vercel (same as above)
2. Vercel project has `boredclaude.com` as a redirect domain
3. Redirect rule: `boredclaude.com/*` -> `boardclaude.com/$1?bored=true` (301)

**Verify:**
```bash
# These may not resolve until the Next.js app is deployed
# For now, just verify DNS:
nslookup boardclaude.com
nslookup boredclaude.com
```

- [ ] boardclaude.com DNS configured
- [ ] boredclaude.com DNS configured
- [ ] Vercel project connected

---

## 5. Prep-Kit Verification

Run these commands to verify all prep-kit files are present and correct.

```bash
# Navigate to prep-kit
cd /mnt/c/Projects/HackathonPrep/prep-kit

# Check top-level files
ls -la CLAUDE.md GO-LIVE-RUNBOOK.md ENVIRONMENT-CHECKLIST.md

# Check plugin manifest
cat .claude-plugin/plugin.json | jq .name
# Should output: "boardclaude"

# Check settings
cat .claude/settings.json | jq .env
# Should show AGENT_TEAMS, MAX_OUTPUT_TOKENS, MAX_THINKING_TOKENS

# Check agents (should be 7: boris, cat, thariq, lydia, ado, jason, synthesis)
ls agents/
# Expected: ado.md  boris.md  cat.md  jason.md  lydia.md  synthesis.md  thariq.md

# Check commands (should be 6: audit, compare, fork, init, merge, review)
ls commands/

# Check panels
ls panels/

# Check hooks
cat hooks/hooks.json | jq .

# Check skills
ls skills/
```

- [ ] All prep-kit files present and valid
- [ ] plugin.json parses correctly
- [ ] settings.json parses correctly
- [ ] All 7 agent .md files present
- [ ] All 6 command .md files present
- [ ] Panel YAML files present
- [ ] hooks.json valid
- [ ] Skill directories present with SKILL.md files

---

## 6. Full Verification Test

Run this end-to-end test to confirm everything is ready.

```bash
# 1. Verify Node.js
node --version && echo "PASS: Node.js" || echo "FAIL: Node.js"

# 2. Verify npm
npm --version && echo "PASS: npm" || echo "FAIL: npm"

# 3. Verify Git
git --version && echo "PASS: Git" || echo "FAIL: Git"

# 4. Verify Claude Code
claude --version && echo "PASS: Claude Code" || echo "FAIL: Claude Code"

# 5. Verify tmux
tmux -V && echo "PASS: tmux" || echo "FAIL: tmux"

# 6. Verify jq
jq --version && echo "PASS: jq" || echo "FAIL: jq"

# 7. Verify Agent Teams env var
echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
# Should output: 1

# 8. Verify API key is set
[ -n "$ANTHROPIC_API_KEY" ] && echo "PASS: API key set" || echo "FAIL: API key not set"

# 9. Verify GitHub SSH
ssh -T git@github.com 2>&1 | grep -q "successfully" && echo "PASS: GitHub SSH" || echo "WARN: Check GitHub SSH"

# 10. Verify Next.js scaffold works (quick test, then clean up)
mkdir /tmp/test-nextjs && cd /tmp/test-nextjs
npx create-next-app@latest test --typescript --tailwind --app --src-dir=false --yes 2>/dev/null
[ -f test/package.json ] && echo "PASS: Next.js scaffold" || echo "FAIL: Next.js scaffold"
rm -rf /tmp/test-nextjs
```

- [ ] All 10 checks pass

---

## 7. Day-of Quick Reference

Tape this to your monitor or keep it on a second screen.

```
PREP-KIT PATH:  /mnt/c/Projects/HackathonPrep/prep-kit
REPO NAME:      boardclaude
GO-LIVE:        Feb 10, 12:00 PM EST / 6:00 PM CET
SUBMIT BY:      Feb 16, 3:00 PM EST / 9:00 PM CET
BUDGET:         $500 (target: use < $260)
SUBMISSION:     https://cv.inc/e/claude-code-hackathon

FIRST 15 MINUTES:
  1. git init boardclaude && cd boardclaude
  2. Copy prepared content from prep-kit
  3. git add . && git commit && git push
  4. npx create-next-app@latest dashboard
  5. Open Claude Code and start building
```

---

## Troubleshooting

### Claude Code won't start
```bash
# Reinstall
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# Check API key
echo $ANTHROPIC_API_KEY

# Check for conflicting Node versions
which node
node --version
```

### Agent Teams not working
```bash
# Verify env var
echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
# Must be exactly "1"

# Try setting it directly before launching
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

### Git push fails
```bash
# Check SSH key
ssh -T git@github.com

# If using HTTPS instead of SSH
git remote set-url origin https://github.com/[USERNAME]/boardclaude.git
```

### npx create-next-app hangs
```bash
# Clear npm cache
npm cache clean --force

# Try with explicit registry
npx --registry https://registry.npmjs.org create-next-app@latest dashboard --typescript --tailwind --app --src-dir=false
```

### WSL file system performance
```bash
# Work in the WSL filesystem for better performance, not /mnt/c/
# Consider cloning the repo to ~/boardclaude instead of /mnt/c/Projects/
cd ~ && git init boardclaude
```

---

*Last updated: February 7, 2026*
*Complete this checklist before Feb 10 go-live.*
