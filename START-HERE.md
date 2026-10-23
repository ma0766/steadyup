# Start here: SteadyUp

About 45 minutes of setup tonight, then Claude Code builds overnight. Everything runs on **Windows** (not WSL), because the Android TV emulator lives there.

## 1. Install (skip what you have)

- [ ] **Git for Windows** (gives you Git Bash; Claude Code needs it): https://git-scm.com/download/win
- [ ] **Node 22 LTS for Windows**: https://nodejs.org (check: `node -v` shows v22)
- [ ] **AWS CLI v2 for Windows**: https://aws.amazon.com/cli/ then in Git Bash: `aws configure sso` (same account as Household Guard, region us-east-1) and check `aws sts get-caller-identity`
- [ ] **Android Studio**: https://developer.android.com/studio
- [ ] **Claude Code for Windows**, then `claude update`
- [ ] **CDK bootstrap** (once per account and region; if you already did it from WSL for Household Guard, skip): `npx aws-cdk bootstrap aws://<ACCOUNT_ID>/us-east-1`

## 2. Create the TV emulator

1. Android Studio → More actions → **Virtual Device Manager** → **Create device**.
2. Category **TV** → **Television (1080p)** → Next.
3. System image: **API 30** (Android 11, same as Fire OS 8). Download it → Next → Finish.
4. Press ▶ to start it. Wait for the home screen. **Leave it running all night.**
5. If it won't start: Windows search "Turn Windows features on or off" → tick **Windows Hypervisor Platform** → restart.

## 3. Put the files in place

1. In Git Bash: `mkdir -p /c/dev && cd /c/dev`
2. Unzip `steadyup-kit.zip` here so you get `C:\dev\steadyup\` with `CLAUDE.md`, `GOAL.txt`, `docs/`, `.claude/`.
3. On GitHub create a **private** repo named `steadyup` (no README).
4. In Git Bash:

```
cd /c/dev/steadyup
git init -b main
git add .
git commit -m "spec"
git remote add origin https://github.com/<you>/steadyup.git
git push -u origin main
```

## 4. Launch

```
cd /c/dev/steadyup
claude --permission-mode auto
```

Inside Claude Code:

1. `/rename steadyup-build`
2. Open `GOAL.txt`, copy **all** of it, paste it, press Enter.
3. Check it starts S0 (it should build the APK and install it on the emulator within the first hour). Then sleep. Keep the laptop plugged in and set Windows sleep to **Never**.

## 5. Morning (by 8 AM)

1. Read `docs/MORNING-REPORT.md`.
2. 10-minute real test: open the phone page on your phone, pair with the TV code, do 10 sit-to-stands. Note the count.
3. **Go/no-go at 8 AM:** stick figure moves on the TV from your real phone, and reps count right on sit-to-stand. If not, stop and give the morning to Household Guard.
4. If go: record the 2:45 video from `docs/DEMO.md` (2 takes max), fill the friction log "what happened" column, make the repo public, submit on Devpost by noon ET.

## Not possible by morning

Listing on the Amazon Appstore needs a developer account and Amazon's review (usually days). By morning you have a working prototype that installs on the emulator or any Fire TV by sideloading. Submit to the Appstore after the hackathon.
