# gaming-os

A lean Linux gaming image for desktop PCs, built on [Bazzite](https://bazzite.gg) with Steam Gaming Mode. Two versions, one per graphics card brand:

| Version | For | Image |
| --- | --- | --- |
| **gaming-os** | AMD Radeon, Intel Arc or Intel integrated graphics | `ghcr.io/dashcoon/gaming-os:latest` |
| **gaming-os-nvidia** | NVIDIA GeForce GTX 16-series, RTX 20-series and newer | `ghcr.io/dashcoon/gaming-os-nvidia:latest` |

Both work with AMD and Intel CPUs, desktops and laptops. Picked the wrong one? Gaming PC Setup notices and offers to switch.

- **Boots into Steam Big Picture** like a Steam Deck. **Switch to Desktop** in the power menu opens a full KDE desktop.
- **Uses the PC's own hardware:** AMD graphics through the Mesa drivers built into Linux, Bazzite's gaming kernel, Gamescope, GameMode and the sched-ext CPU schedulers. Windows games run through **Proton** in Steam.
- **No bloat, full hardware support:** `build_files/build.sh` removes extras a gaming PC doesn't need (Android container, VPN, web admin console, disc ripper, CJK input methods, Steam Deck-only parts) and adds drivers for a wide range of hardware (see [Drivers](#drivers)). A package is only removed when nothing else depends on it, so the gaming stack stays intact.
- **Safe updates:** the system is image-based. GitHub rebuilds the image every day from the latest Bazzite, the PC updates in the background, and the previous version stays in the boot menu if an update misbehaves.

## Install

You need a USB stick of 16 GB or more (it gets erased) and, for dual boot, free space or a second drive.

### 1. Get the installer

- **This image:** in this repository, go to **Actions → Build disk images → Run workflow**, choose the version for your graphics card (`gaming-os` or `gaming-os-nvidia`). When it finishes (about 30 to 60 minutes), open the run and download the artifact. Unzip it to get the `.iso`.
- **Or the official Bazzite installer:** on [bazzite.gg](https://bazzite.gg) choose your graphics card brand and *Steam Gaming Mode*, download that ISO, then switch to this image after installing (step 5).

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

**Secure Boot:** Bazzite's kernel is signed with Universal Blue's own key, which the PC has to learn once ([Bazzite docs](https://docs.bazzite.gg/General/Installation_Guide/secure_boot/)). If a blue **MOK management** screen appears, choose *Enroll MOK* → *Continue* → password `universalblue` → *Reboot*. The NVIDIA driver also needs this key. If Linux won't start with Secure Boot on (or the NVIDIA driver doesn't load): turn Secure Boot off in the BIOS, start Linux, run `ujust enroll-secure-boot-key` in Konsole (password `universalblue`), restart and enroll on the blue screen, then turn Secure Boot back on.

### 5. Only if you used the official Bazzite installer

Open **Switch to Desktop → Konsole** and run:

```bash
sudo bootc switch ghcr.io/dashcoon/gaming-os:latest          # AMD or Intel graphics
sudo bootc switch ghcr.io/dashcoon/gaming-os-nvidia:latest   # NVIDIA graphics
```

Then restart.

## First start: Gaming PC Setup

Switch to Desktop once (Steam → power menu → **Switch to Desktop**). **Gaming PC Setup** opens by itself the first time and:

1. **Checks every piece of hardware** and the driver it uses (see [Drivers](#drivers)): CPU power management (AMD P-State), graphics card and Vulkan, displays, audio, network and Wi-Fi, Bluetooth, controllers, drives, devices without a driver, and firmware the kernel couldn't load. The report is saved as `Gaming-Setup-Report.txt` in your home folder.
2. **Fixes common problems** after asking: switches Wi-Fi/Bluetooth on, starts Bluetooth for wireless controllers and headsets, installs firmware updates for the motherboard, SSD and peripherals, mounts your other drives at startup for extra Steam libraries, and adds a **Boot Windows** tile to Steam if Windows is also installed.
3. **Adds the integrations you tick:** Battle.net and EA app (through Lutris), Heroic (Epic, GOG, Amazon), Lutris for other launchers, Decky Loader (Gaming Mode plugins), ProtonPlus (Proton-GE and other Proton versions), Discord, OBS Studio, CoolerControl (fan curves and AIO pumps).

Run it again any time: **Gaming PC Setup** in the app menu, or `ujust gaming-setup` in Konsole. **Hardware Report** (or `ujust hardware-report`) shows the check only.

## Drivers

Everything is in the image, so the PC works offline from the first boot. On Linux most drivers are part of the kernel; the image adds the firmware files they load.

| Hardware | Driver | Notes |
| --- | --- | --- |
| AMD CPU | `amd-pstate` power management, AMD microcode | Enable *CPPC* in the BIOS for amd-pstate |
| Intel CPU | `intel_pstate`, Intel microcode, `thermald` thermal management | |
| AMD Radeon GPU and displays | `amdgpu` + Mesa (Vulkan RADV, OpenGL), FreeSync, VA-API video | 4K 120 Hz over HDMI: `ujust configure-amd-hdmi21` |
| Intel Arc / integrated GPU | `i915`/`xe` + Mesa (Vulkan ANV), Intel media driver and oneVPL for video, `intel-gpu-tools` | **gaming-os** |
| NVIDIA GeForce GPU | NVIDIA driver (open kernel modules), Vulkan, DLSS, Reflex, G-Sync, NVENC | **gaming-os-nvidia**; GTX 16-series, RTX 20-series and newer. GTX 10-series and earlier are not supported for gaming |
| Laptops | Hybrid graphics switching (`supergfxctl`), TDP control, screen rotation, Framework laptop tools | |
| Ethernet (LAN) | Realtek `r8169`, Intel `igc`/`e1000e`, and others in the kernel | |
| Wi-Fi and Bluetooth | Intel `iwlwifi`, MediaTek `mt7921`/`mt7925`, Realtek `rtw88`/`rtw89`, Qualcomm `ath11k`/`ath12k`, Broadcom `brcmfmac` + firmware | Broadcom cards that need `wl`: `rpm-ostree install broadcom-wl`, then restart |
| Audio | Intel/AMD HDA, Intel SOF, Cirrus, USB audio, HDMI/DisplayPort audio | |
| Controllers | Xbox (`xpad`, `xone`, `xpadneo`), PlayStation, Switch, Steam, 8BitDo | |
| Gaming mice and keyboards | Solaar (Logitech), Piper/ratbagd (many brands), ckb-next (Corsair) | Razer: `ujust install-openrazer` |
| Headsets | HeadsetControl (Logitech, SteelSeries, HyperX, Corsair): battery, sidetone, lights | |
| RGB lighting | OpenRGB (motherboards, RAM, GPUs, peripherals) | |
| Racing wheels | Kernel force-feedback drivers + Oversteer (Logitech, Thrustmaster, Fanatec) | |
| Fans and AIO coolers | `lm_sensors`; CoolerControl from Gaming PC Setup | |
| Drives | NVMe, SATA, USB; NTFS and exFAT for Windows disks and memory cards | |
| Printers and scanners | CUPS with HP (`hplip`) and Gutenprint drivers, SANE scanners | |
| TV and HDMI | HDMI-CEC remote control | |

**Gaming PC Setup** lists every device by type (GPU, LAN, Wi-Fi, audio, USB, NVMe, Bluetooth) with the driver it uses, recognises gaming peripherals and names the app for each, and says what to do for any device without one.

## Launchers and games

| Launcher | How to get it | Games |
| --- | --- | --- |
| Steam | Built in (Gaming Mode) | Most PC games; Windows games run through Proton |
| Battle.net | Gaming PC Setup → tick **Battle.net** (installs it through Lutris) | Diablo IV, Diablo II: Resurrected, Warcraft III: Reforged, World of Warcraft, Overwatch 2 |
| EA app | Gaming PC Setup → tick **EA app** (installs it through Lutris) | Need for Speed, The Sims and other EA games not bought on Steam (EA games bought on Steam install from Steam) |
| Epic, GOG, Amazon | Gaming PC Setup → tick **Heroic** | |

After installing a launcher in Lutris, right-click it → **Create Steam shortcut** to start it from Gaming Mode.

Before buying a game, check it on [ProtonDB](https://www.protondb.com) (how well it runs on Linux) and [Are We Anti-Cheat Yet](https://areweanticheatyet.com): a few multiplayer games block Linux with their anti-cheat. How fast games run depends on your CPU and graphics card, the same as on Windows.

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
