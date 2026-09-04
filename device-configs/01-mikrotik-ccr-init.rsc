# ==============================================================================
# TCU-PLATFORM-LAB: MIKROTIK CCR CORE INITIALIZATION
# Hardware: MikroTik CCR (Cloud Core Router)
# Architecture: Single-Node ISP Lab / Headend
# Date: September 2026
# ==============================================================================

/system identity set name=TCU-CCR-CORE

# ------------------------------------------------------------------------------
# 1. VLAN & INTERFACE CONFIGURATION
#    ether1 : WAN Uplink (Ke ISP / Internet)
#    ether2 : Downlink Trunk (Ke UniFi Switch Port 1 / OLT ZTE)
#    ether3 : Dedicated Server Link (Ke PC Ryzen 7 LAN)
# ------------------------------------------------------------------------------
/interface vlan
add interface=ether2 name=vlan100-mgmt vlan-id=100 comment=VLAN Management & Monitoring
add interface=ether2 name=vlan200-pppoe vlan-id=200 comment=VLAN Pelanggan FTTH (PPPoE)

# ------------------------------------------------------------------------------
# 2. IP ADDRESS ASSIGNMENT
# ------------------------------------------------------------------------------
# WAN Uplink (Ganti dengan DHCP Client atau IP Statik publik dari ISP Anda)
/ip dhcp-client add interface=ether1 disabled=no comment=WAN Uplink DHCP

# Management Subnet (10.0.10.0/24)
/ip address add address=10.0.10.1/24 interface=vlan100-mgmt comment=Gateway Management

# PPPoE Subscriber Gateway (10.200.0.1/16)
/ip address add address=10.200.0.1/16 interface=vlan200-pppoe comment=Gateway PPPoE Subscriber

# ------------------------------------------------------------------------------
# 3. DNS & NAT (INTERNET FORWARDING)
# ------------------------------------------------------------------------------
/ip dns set allow-remote-requests=yes servers=1.1.1.1,8.8.8.8,1.0.0.1
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment=NAT Internet Pelanggan

# ------------------------------------------------------------------------------
# 4. PPPoE POOLS & PROFILES (REGULAR & AUTO-ISOLIR)
# ------------------------------------------------------------------------------
/ip pool
add name=pool-pppoe-regular ranges=10.200.0.2-10.200.15.254
add name=pool-pppoe-isolir ranges=10.201.0.2-10.201.0.254

/ppp profile
add name=profile-isolir local-address=10.201.0.1 remote-address=pool-pppoe-isolir rate-limit=64k/64k dns-server=10.0.10.1 comment=Profil Pelanggan Menunggak
add name=profile-20mbps local-address=10.200.0.1 remote-address=pool-pppoe-regular rate-limit=20M/20M dns-server=1.1.1.1,8.8.8.8 comment=Paket Silver 20M
add name=profile-50mbps local-address=10.200.0.1 remote-address=pool-pppoe-regular rate-limit=50M/50M dns-server=1.1.1.1,8.8.8.8 comment=Paket Gold 50M
add name=profile-100mbps local-address=10.200.0.1 remote-address=pool-pppoe-regular rate-limit=100M/100M dns-server=1.1.1.1,8.8.8.8 comment=Paket Platinum 100M

# ------------------------------------------------------------------------------
# 5. PPPoE SERVER SETUP (VLAN 200)
# ------------------------------------------------------------------------------
/interface pppoe-server server
add authentication=pap,chap,mschap2 default-profile=profile-20mbps disabled=no interface=vlan200-pppoe max-mtu=1492 max-mru=1492 service-name=TCU-INTERNET one-session-per-host=yes

# ------------------------------------------------------------------------------
# 6. RADIUS AAA INTEGRATION (PC RYZEN 7 DOCKER)
#    IP PC Server Docker: 10.0.10.10
# ------------------------------------------------------------------------------
/radius
add address=10.0.10.10 secret=tcu_radius_secret_2026 service=ppp comment=FreeRADIUS TCU Docker timeout=3s
/radius incoming set accept=yes port=3799 comment=RADIUS CoA Incoming (Auto-Isolir)
/ppp aaa set use-radius=yes accounting=yes interim-update=5m

# ------------------------------------------------------------------------------
# 7. SERVICE HARDENING & SECURITY FILTER
# ------------------------------------------------------------------------------
# Matikan service rentan
/ip service set telnet disabled=yes
/ip service set www disabled=yes
/ip service set ftp disabled=yes

# Kunci API khusus untuk IP PC Server (10.0.10.10)
/ip service set api address=10.0.10.10/32 disabled=no port=8728
/ip service set api-ssl disabled=yes

# Kunci Winbox & SSH hanya di subnet management
/ip service set winbox address=10.0.10.0/24 disabled=no port=8291
/ip service set ssh address=10.0.10.0/24 disabled=no port=2222

# Firewall Filter: Isolasi Total
/ip firewall filter
add chain=input connection-state=established,related action=accept comment=Allow Established & Related
add chain=input in-interface=vlan100-mgmt action=accept comment=Allow Management Subnet
add chain=input in-interface=vlan200-pppoe protocol=udp dst-port=53 action=accept comment=Allow DNS for PPPoE Clients
add chain=input in-interface=ether1 action=drop comment=DROP ALL INBOUND FROM PUBLIC INTERNET
add chain=input in-interface=vlan200-pppoe action=drop comment=DROP PPPoE CLIENT ACCESS TO ROUTER INTERFACES

/log info TCU-PLATFORM-LAB: MikroTik CCR Core successfully configured!
