# TCU-PLATFORM-LAB

> **TopClass Universal ISP Command Center & FTTH Automation Platform**  
> Tailored for Single-Node Headend / Lab on AMD Ryzen 7 + MikroTik CCR + ZTE C320 OLT + Huawei 48V Power Subsystem.

---

## 🏗️ Hardware Architecture & Integration

`
┌────────────────────────────────────────────────────────────────────────────┐
│                       POWER SUBSYSTEM (DC 48V)                             │
├────────────────────────────────────────────────────────────────────────────┤
│  PLN / Genset ──> Rectifier Redundant 48V ──┬──> Baterai Huawei LiFePO4 48V│
│                                             │    (Cadangan Daya 8-24 Jam)  │
│                   ┌─────────────────────────┴───────────────────────────┐  │
│                   │ Direct 48V DC             Inverter 48V to 220V      │  │
│                   ▼                                      ▼              │  │
│            OLT ZTE C320 (DC)              PC Ryzen 7, CCR, UniFi Switch │  │
└───────────────────┬──────────────────────────────────────┬──────────────┘──┘
                    │                                      │
┌───────────────────▼──────────────────────────────────────▼─────────────────┐
│                       NETWORK & CONTROL PLANE                              │
├────────────────────────────────────────────────────────────────────────────┤
│  Internet Uplink ──> MikroTik CCR (BGP / Gateway / PPPoE Server / NAT)     │
│                             │                                              │
│                             ▼ (Trunk: VLAN 100 Mgmt & VLAN 200 PPPoE)      │
│                      UniFi Switch Manageable                               │
│                      ├── UniFi Cloud Key G2 (Controller)                   │
│                      ├── OLT ZTE C320 (GPON ke Pelanggan FTTH)             │
│                      └── PC Server Ryzen 7 (Docker All-in-One Engine)      │
└────────────────────────────────────────────────────────────────────────────┘
`

---

## 🚀 Quick Launch

1. **Siapkan Konfigurasi Hardware**:
   - Salin isi file device-configs/01-mikrotik-ccr-init.rsc ke Terminal Winbox MikroTik CCR.
   - Salin isi file device-configs/02-zte-c320-init.cfg ke PuTTY Serial Console OLT ZTE C320.

2. **Jalankan Platform di Windows 11**:
   - Pastikan Docker Desktop aktif.
   - Jalankan scripts\start-lab.bat (atau docker compose up -d).

3. **Akses Dashboard**:
   - **Frontend Command Center**: [http://localhost:3001](http://localhost:3001)
   - **Backend API**: [http://localhost:3000](http://localhost:3000)
   - **Grafana NOC Dashboard**: [http://localhost:3002](http://localhost:3002)

---

## 📂 Project Structure

`
TCU-PLATFORM-LAB/
├── backend/               # Express.js API, Prisma ORM, RouterOS & OLT Connectors
├── frontend/              # Next.js Modern Glassmorphism ISP Command Center UI
├── device-configs/        # Ready-to-flash configs for MikroTik CCR & ZTE C320
│   ├── 01-mikrotik-ccr-init.rsc
│   └── 02-zte-c320-init.cfg
├── config/                # RADIUS schema, Prometheus, & Network policies
├── docs/                  # Hardware checklists, wiring guides, quickstart
├── scripts/               # 1-Click Windows launch & diagnostic scripts
├── docker-compose.yml     # All-in-one Single-Node production stack
└── README.md
`

---

## 🔒 Security Principles

* **Zero Public Ingress**: Router CCR menutup total semua port dari arah internet WAN.
* **Strict Management Isolation**: VLAN 100 hanya dapat diakses oleh IP 10.0.10.10 (Server) dan subnet admin.
* **PPPoE Layer 2 Protection**: Pelanggan terisolasi total dalam tunnel Point-to-Point.
* **Zero Trust Remote Access**: Remote dashboard dari luar kota dilindungi oleh Cloudflare Zero Trust Tunnel.

---
Copyright © 2026 PT Top Class Universal. All rights reserved.
