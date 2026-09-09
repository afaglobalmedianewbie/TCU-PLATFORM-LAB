# TCU hAP lite - Dual WAN failover
# WAN1 = wlan1 tethering HP (primary) | WAN2 = ether1 LAN modem topclass (backup)
# 2026-09-08 - tempel via Winbox Terminal
/interface list add name=WAN comment="Grup interface WAN untuk NAT"
/interface list member add list=WAN interface=wlan1
/interface list member add list=WAN interface=ether1
/interface set ether1 comment="WAN2 - LAN modem topclass universal (backup)"
/interface set wlan1 comment="WAN1 - tethering HP (primary)"
/ip dhcp-client remove [find interface=wlan1]
/ip dhcp-client remove [find interface=ether1]
/ip dhcp-client add interface=wlan1 disabled=no add-default-route=yes default-route-distance=1 use-peer-dns=no comment="WAN1 tethering primary"
/ip dhcp-client add interface=ether1 disabled=no add-default-route=yes default-route-distance=2 use-peer-dns=no comment="WAN2 topclass backup"
/ip firewall nat remove [find comment="NAT Internet"]
/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade comment="NAT dual-WAN failover"
/ip dns set allow-remote-requests=yes servers=1.1.1.1,8.8.8.8