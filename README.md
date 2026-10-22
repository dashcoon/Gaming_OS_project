# gaming-os

A lean Linux gaming image for an AMD desktop PC (AMD CPU + AMD Radeon GPU), built on [Bazzite](https://bazzite.gg) with Steam Gaming Mode.

- **Boots into Steam Big Picture** like a Steam Deck. **Switch to Desktop** in the power menu opens a full KDE desktop.
- **Uses the PC's own hardware:** AMD graphics through the Mesa drivers built into Linux, Bazzite's gaming kernel, Gamescope, GameMode and the sched-ext CPU schedulers. Windows games run through **Proton** in Steam.
- **No bloat:** `build_files/build.sh` removes extras a desktop gaming PC doesn't need (Android container, VPN, web admin console, disc ripper, laptop and Steam Deck hardware tools, CJK input methods, TV remote support). It only removes a package when nothing else depends on it, so the gaming stack stays intact.
- **Safe updates:** the system is image-based. GitHub rebuilds the image every day from the latest Bazzite, the PC updates in the background, and the previous version stays in the boot menu if an update misbehaves.

## Install

You need a USB stick of 16 GB or more (it gets erased) and, for dual boot, free space or a second drive.

### 1. Get the installer

- **This image:** in this repository, go to **Actions → Build disk images → Run workflow** (platform `amd64`). When it finishes (about 30 to 60 minutes), open the run and download the artifact. Unzip it to get the `.iso`.
- **Or the official Bazzite installer:** on [bazzite.gg](https://bazzite.gg) choose *Desktop/Laptop → AMD → Steam Gaming Mode* and download that ISO, then switch to this image after installing (step 5).

### 2. Write it to the USB stick

On Windows, use [Fedora Media Writer](https://fedoraproject.org/workstation/download) (choose *Select .iso file*) or [Rufus](https://rufus.ie) (choose *DD mode* if asked).

### 3. Boot from the USB stick

Restart the PC and press the boot-menu key while it starts (often **F12**, **F11** or **F8**; check your motherboard), then pick the USB stick.

### 4. Install

In the installer, under **Installation Destination**:

| You want | Choose |
| --- | --- |
| Keep Windows on the same drive | *Custom* or *Free up space*, shrink the Windows partition, install into the free space |
| Linux on its own SSD | Select only that SSD |
| Replace Windows | Select the drive and *Delete all* (erases it) |

Create your user, finish, and restart.

**Secure Boot:** Bazzite's kernel is signed with Universal Blue's own key, which the PC has to learn once ([Bazzite docs](https://docs.bazzite.gg/General/Installation_Guide/secure_boot/)). If a blue **MOK management** screen appears, choose *Enroll MOK* → *Continue* → password `universalblue` → *Reboot*. If Linux won't start with Secure Boot on: turn Secure Boot off in the BIOS, start Linux, run `ujust enroll-secure-boot-key` in Konsole (password `universalblue`), restart and enroll on the blue screen, then turn Secure Boot back on.

### 5. Only if you used the official Bazzite installer

Open **Switch to Desktop → Konsole** and run:

```bash
sudo bootc switch ghcr.io/dashcoon/gaming-os:latest
```

Then restart.

## Play

1. Sign in to Steam in Gaming Mode.
2. Install your games. Steam picks Proton automatically for Windows games. If a game won't start: open it in the library → ⚙ **Properties → Compatibility** → force **Proton Hotfix** or **Proton Experimental**.
3. In Gaming Mode, the **…** button shows per-game performance options (frame limit, FSR upscaling).

## Everyday commands (Konsole)

| Task | Command |
| --- | --- |
| Update now | `ujust update` |
| Go back to the previous version | `sudo bootc rollback`, then restart |
| See which version is running | `bootc status` |
| Bazzite's extra options (Decky plugins, scheduler choice, etc.) | `ujust` |

Install desktop apps from **Bazaar** (the app store) as Flatpaks; they don't touch the system image.

## Change the image

Edit `build_files/build.sh` (add `dnf5 install -y <package>` or extend the remove list) and push. GitHub rebuilds and publishes `ghcr.io/dashcoon/gaming-os:latest`, and the PC picks it up at the next update.

### Signing (recommended)

Images are published unsigned until you add a key. In a terminal with [cosign](https://docs.sigstore.dev/cosign/system_config/installation/) installed:

```bash
COSIGN_PASSWORD="" cosign generate-key-pair
```

Add the contents of `cosign.key` as a repository secret named `SIGNING_SECRET` (**Settings → Secrets and variables → Actions**), commit `cosign.pub`, and never commit `cosign.key`.

## Credits

Based on [ublue-os/image-template](https://github.com/ublue-os/image-template) (Apache-2.0) and [Bazzite](https://github.com/ublue-os/bazzite).
