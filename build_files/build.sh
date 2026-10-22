#!/bin/bash
# Turns Bazzite (Steam Gaming Mode) into a lean image for an AMD desktop PC.
# Removes extras a desktop gaming PC does not need. A package is only removed
# when nothing else on the system depends on it, so the gaming stack stays intact.

set -ouex pipefail

# Copy the contents of system_files/ of the git repo to /
cp -avf "/ctx/system_files"/. /

REMOVE=(
  # Android apps container
  waydroid
  # VPN, web admin console, disc ripper, virtual machine firmware, test tools
  tailscale
  cockpit-files cockpit-networkmanager cockpit-podman cockpit-selinux cockpit-storaged cockpit-system
  makemkv
  edk2-ovmf
  usbip
  stress-ng
  webapp-manager
  # Chinese and Japanese input methods
  ibus-mozc ibus-pinyin ibus-table-chinese-cangjie ibus-table-chinese-quick
  # Steam Deck-only hardware parts (fan, speakers, OLED panel, gyro)
  jupiter-fan-control steamdeck-dsp galileo-mura sdgyrodsu
)
# Laptop and peripheral support (hybrid graphics, TDP control, screen rotation, Framework,
# TV remote over HDMI, printers) is kept so the image works on as many PCs as possible.

# Several passes, because removing one extra can free another (for example the cockpit parts).
for pass in 1 2 3; do
  removed_any=0
  for pkg in "${REMOVE[@]}"; do
    rpm -q --quiet "$pkg" || continue
    if rpm -e --test "$pkg" > /dev/null 2>&1; then
      dnf5 -y remove "$pkg"
      removed_any=1
    fi
  done
  [ "$removed_any" -eq 1 ] || break
done

echo "Extras still installed because other packages need them:"
for pkg in "${REMOVE[@]}"; do
  rpm -q --quiet "$pkg" && echo "  kept: $pkg" || true
done

# Firmware for CPUs, graphics, Wi-Fi, Bluetooth, Ethernet and audio, so devices work offline from first boot.
# (Most drivers are part of the Linux kernel; these packages hold the firmware files they load.)
dnf5 install -y --skip-unavailable \
  linux-firmware amd-ucode-firmware amd-gpu-firmware intel-gpu-firmware nvidia-gpu-firmware \
  realtek-firmware atheros-firmware brcmfmac-firmware mt7xxx-firmware iwlwifi-mvm-firmware iwlwifi-dvm-firmware \
  iwlegacy-firmware nxpwireless-firmware qcom-wwan-firmware \
  intel-audio-firmware cirrus-audio-firmware alsa-sof-firmware alsa-firmware

# Extra drivers and hardware support. Installed one by one so a package that is missing,
# already provided under another name, or in conflict is skipped instead of failing the build.
DRIVERS=(
  # Graphics: video decoding/encoding for AMD, Intel and NVIDIA, Intel Arc and iGPU tools
  mesa-va-drivers mesa-vdpau-drivers libva-utils vdpauinfo
  intel-media-driver libva-intel-media-driver intel-vpl-gpu-rt libvpl intel-gpu-tools
  # Intel CPU thermal management (laptops and small PCs)
  thermald
  # Gaming mice, keyboards and headsets: Logitech (Solaar), many brands (Piper/ratbagd),
  # Corsair (ckb-next), SteelSeries/HyperX/Logitech headsets (HeadsetControl)
  solaar libratbag-ratbagd piper ckb-next headsetcontrol
  # RGB lighting for motherboards, RAM, GPUs and peripherals
  openrgb openrgb-udev-rules
  # Controllers and VR/streaming devices (udev rules)
  steam-devices game-devices-udev
  # Drives and file systems used by games and Windows disks
  ntfs-3g exfatprogs
  # Printers and scanners
  hplip gutenprint-cups sane-backends-drivers-scanners
)
for pkg in "${DRIVERS[@]}"; do
  rpm -q --quiet "$pkg" && continue
  dnf5 install -y --skip-unavailable "$pkg" || echo "Skipped $pkg (conflict or not available)"
done
systemctl enable thermald.service 2> /dev/null || true
# If the Android container could not be removed (other packages depend on it), keep it switched off
systemctl disable waydroid-container.service 2> /dev/null || true
systemctl enable ratbagd.service 2> /dev/null || true

# Hardware tools used by gaming-setup and handy for troubleshooting
dnf5 install -y --skip-unavailable inxi radeontop nvtop pciutils usbutils efibootmgr zenity

# Register the gaming-setup commands with ujust
grep -q '99-gaming-os.just' /usr/share/ublue-os/justfile || \
  echo 'import "/usr/share/ublue-os/just/99-gaming-os.just"' >> /usr/share/ublue-os/justfile
chmod 0755 /usr/bin/gaming-setup

dnf5 clean all
