# TCU-PLATFORM-LAB: Hardware Installation Checklist

Gunakan panduan ini saat Anda merakit dan menyambungkan hardware fisik di rak server / lab Anda.

---

### 1. Power & Battery Subsystem (DC 48V)

- [ ] **Baterai Huawei LiFePO4 48V**: Terhubung ke Rectifier Redundant 48V dengan kabel DC tebal (minimal 16mm - 25mm). Periksa kutub positif (+) dan negatif (-) jangan sampai terbalik!
- [ ] **Rectifier 48V**: Terhubung ke sumber listrik PLN. Pastikan tegangan output mengambang (Float Charge) berada di kisaran 53.5V - 54.0V.
- [ ] **OLT ZTE C320**: Menggunakan input DC -48V bawaan langsung dari output busbar Rectifier/Baterai.
- [ ] **Inverter 48V ke 220V**: Dihubungkan ke busbar DC 48V untuk menyuplai daya ke PC Ryzen 7, MikroTik CCR, UniFi Switch, dan Cloud Key.

---

### 2. Network Cabling & Port Layout

- [ ] **Uplink Internet (ISP)** $\rightarrow$ Colok ke **Port 1 (ether1 / sfp1)** MikroTik CCR.
- [ ] **Trunk Link** $\rightarrow$ Dari **Port 2 (ether2 / sfp2)** MikroTik CCR ke **Port 1** UniFi Switch.
- [ ] **OLT Uplink** $\rightarrow$ Dari **Port 2** UniFi Switch ke **Port Uplink GE1 (gei_1/4/1)** OLT ZTE C320.
- [ ] **PC Server Ryzen 7** $\rightarrow$ Dari **Port 3** UniFi Switch ke port LAN PC Ryzen 7.
- [ ] **UniFi Cloud Key G2** $\rightarrow$ Dari salah satu port PoE UniFi Switch.
- [ ] **Kabel Console ZTE C320** $\rightarrow$ Dari port CLI/Console OLT ke port USB PC Ryzen 7 (untuk inisialisasi awal).

---

### 3. IP Address Assignment Plan (VLAN 100 Management)

| Perangkat | Interface Fisik | IP Address | Subnet Mask | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **MikroTik CCR** | ether2 (vlan100) | 10.0.10.1 | 255.255.255.0 | Gateway Management & PPPoE Core |
| **OLT ZTE C320** | gei_1/4/1 (vlan100) | 10.0.10.2 | 255.255.255.0 | FTTH OLT Chassis |
| **UniFi Switch** | Port Management | 10.0.10.3 | 255.255.255.0 | Manageable Switch |
| **PC Ryzen 7** | LAN Ethernet | 10.0.10.10 | 255.255.255.0 | Host Server & Docker Engine |

---

### 4. Verifikasi Akhir Sebelum Menjalankan Software

1. Set IP LAN PC Ryzen 7 secara statik:
   * IP: 10.0.10.10
   * Subnet: 255.255.255.0
   * Gateway: 10.0.10.1
   * DNS: 1.1.1.1
2. Buka PowerShell dan jalankan:
   `powershell
   .\scripts\test-network.ps1
   `
   Pastikan CCR (10.0.10.1) dan OLT (10.0.10.2) merespons dengan status [OK].
