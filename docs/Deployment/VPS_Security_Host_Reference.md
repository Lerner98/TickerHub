# VPS Security & Host Reference
## Hostinger KVM 4 - devprojects.cloud

---

## 🔐 Quick Access

### SSH Login
```bash
ssh guy@72.62.60.212
```

### Coolify Dashboard
```
URL: https://coolify.devprojects.cloud
Alt: http://72.62.60.212:8000
```

### Hostinger hPanel
```
URL: https://hpanel.hostinger.com
VPS: srv1180546.hstgr.cloud
```

---

## 🖥️ Server Details

| Property | Value |
|----------|-------|
| **Hostname** | srv1180546.hstgr.cloud |
| **IPv4** | 72.62.60.212 |
| **IPv6** | 2a02:4780:41:1cd8::1 |
| **OS** | Ubuntu 24.04 LTS |
| **Plan** | KVM 4 |
| **RAM** | 16GB |
| **vCPU** | 4 cores |
| **Storage** | 200GB NVMe |
| **Expires** | 2027-12-06 |

---

## 👤 User Access

| User | Purpose | SSH Access |
|------|---------|------------|
| `guy` | Daily use (sudo) | ✅ Key-based |
| `root` | Disabled | ❌ Blocked |

### SSH Key Location (Local Machine)
```
Private: C:\Users\guyle\.ssh\id_ed25519
Public:  C:\Users\guyle\.ssh\id_ed25519.pub
```

---

## 🔥 Firewall Rules (UFW)

| Port | Service | Status |
|------|---------|--------|
| 22/tcp | SSH | ✅ Open |
| 80/tcp | HTTP | ✅ Open |
| 443/tcp | HTTPS | ✅ Open |
| 8000/tcp | Coolify UI | ✅ Open |

### UFW Commands
```bash
# Check status
sudo ufw status

# Add port
sudo ufw allow PORT/tcp

# Remove port
sudo ufw delete allow PORT/tcp

# Reload
sudo ufw reload
```

---

## 🛡️ Fail2Ban (SSH Protection)

### Status Commands
```bash
# Overall status
sudo fail2ban-client status

# SSH jail status
sudo fail2ban-client status sshd

# Unban an IP
sudo fail2ban-client unban IP_ADDRESS
```

### Config Location
```
/etc/fail2ban/jail.local
```

---

## 🐳 Docker & Coolify

### Docker Commands
```bash
# List running containers
docker ps

# View logs
docker logs CONTAINER_NAME

# Restart container
docker restart CONTAINER_NAME
```

### Coolify Location
```
/data/coolify/
```

### Restart Coolify
```bash
cd /data/coolify
docker compose down && docker compose up -d
```

---

## 🌐 DNS Records (devprojects.cloud)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | coolify | 72.62.60.212 | 14400 |

### Add More Subdomains
Go to: Hostinger hPanel → DNS Manager → devprojects.cloud → Edit DNS

Example for new app:
| Type | Name | Value |
|------|------|-------|
| A | app | 72.62.60.212 |
| A | api | 72.62.60.212 |
| A | @ | 72.62.60.212 |

---

## 📁 Important File Locations

| File | Location |
|------|----------|
| SSH Config | `/etc/ssh/sshd_config` |
| SSH Override | `/etc/ssh/sshd_config.d/50-cloud-init.conf` |
| UFW Rules | `/etc/ufw/` |
| Fail2Ban Config | `/etc/fail2ban/jail.local` |
| Coolify Data | `/data/coolify/` |
| Docker Data | `/var/lib/docker/` |

---

## 🔧 Common Tasks

### Restart Services
```bash
# SSH
sudo systemctl restart sshd

# UFW
sudo systemctl restart ufw

# Fail2Ban
sudo systemctl restart fail2ban

# Docker
sudo systemctl restart docker
```

### System Updates
```bash
sudo apt update && sudo apt upgrade -y
```

### Reboot Server
```bash
sudo reboot
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

---

## 🚨 Emergency Access

If locked out of SSH:
1. Go to Hostinger hPanel
2. Click **Terminal** button (Browser Terminal)
3. Or use **Emergency Mode** in Settings

---

## 📝 Security Checklist

- [x] Non-root user created (`guy`)
- [x] SSH key authentication enabled
- [x] Password authentication disabled
- [x] Root SSH login disabled
- [x] UFW firewall active
- [x] Fail2Ban protecting SSH
- [x] Coolify running with HTTPS

---

## 🔄 Backup Reminders

- Export Coolify settings periodically
- Backup `/data/coolify/` for app configs
- Keep SSH private key safe locally

---

*Last updated: December 6, 2025*
