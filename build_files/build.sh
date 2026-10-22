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
  # VPN, web admin console, disc ripper, printer driver, virtual machine firmware
  tailscale
  cockpit-files cockpit-networkmanager cockpit-podman cockpit-selinux cockpit-storaged cockpit-system
  makemkv
  uld
  edk2-ovmf
  usbip
  stress-ng
  webapp-manager
  # Chinese and Japanese input methods
  ibus-mozc ibus-pinyin ibus-table-chinese-cangjie ibus-table-chinese-quick
  # Laptop and handheld hardware tools (Framework, hybrid graphics, TDP control, Steam Deck parts)
  framework-system fw-ectool fw-fanctrl
  supergfxctl
  ryzenadj plasma-applet-tdp-control
  jupiter-fan-control steamdeck-dsp galileo-mura sdgyrodsu
  iio-sensor-proxy
  # TV remote control over HDMI (CEC)
  libcec linux-cec inputattach-cec-units
)

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

dnf5 clean all
