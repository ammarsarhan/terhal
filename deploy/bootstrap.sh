#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 VPS, run as root:
#   ssh root@<vps> 'bash -s' -- "<deploy public key>" < deploy/bootstrap.sh
# The key is the public half of the key GitHub Actions deploys with (the VPS_SSH_KEY secret). Safe to re-run.
#
# Leaves the box with Docker, a firewall that only lets in SSH, http and https, automatic security updates, a `deploy`
# user for CI, and /opt/terhal ready for the edge and the environments. The README walks through the rest.
set -euo pipefail

deploy_key="${1:?the SSH public key for the deploy user}"

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl ufw unattended-upgrades fail2ban

# Docker from Docker's own apt repository (Ubuntu's docker.io lags behind and lacks the compose plugin).
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -q
apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Rotate logs of any container that doesn't set its own limits.
cat > /etc/docker/daemon.json <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "5" } }
EOF
systemctl restart docker

# Security updates install themselves; reboots stay manual.
dpkg-reconfigure -f noninteractive unattended-upgrades

# Only SSH, http and https. Docker publishes ports around ufw, which is why only Caddy publishes any (80 and 443).
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# Keys only, no passwords.
cat > /etc/ssh/sshd_config.d/10-terhal.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
systemctl reload ssh

# The deploy user. Membership in the docker group is root-equivalent, so its key belongs to CI and nobody else.
id deploy &> /dev/null || useradd --create-home --shell /bin/bash deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
grep -qxF "$deploy_key" /home/deploy/.ssh/authorized_keys 2> /dev/null || echo "$deploy_key" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# A swap file, so a memory spike slows the box down instead of killing a container.
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

install -d -o deploy -g deploy /opt/terhal /opt/terhal/edge /opt/terhal/edge/sites /opt/terhal/staging /opt/terhal/main \
  /opt/terhal/incoming
docker network inspect edge &> /dev/null || docker network create edge

echo "Bootstrapped. Next: set up the edge and each environment's app.env (see the README)."
