# ==============================================================================
# TCU-PLATFORM-LAB: NETWORK DIAGNOSTIC & CONNECTIVITY CHECK
# ==============================================================================

Write-Host ===================================================================== -ForegroundColor Cyan
Write-Host  TCU-PLATFORM-LAB: HARDWARE CONNECTIVITY TEST  -ForegroundColor Cyan
Write-Host ===================================================================== -ForegroundColor Cyan

 = @(
    @{ Name = MikroTik CCR Gateway; IP = 10.0.10.1; Ports = @(8728, 8291, 2222) },
    @{ Name = ZTE C320 OLT;         IP = 10.0.10.2; Ports = @(23, 161) },
    @{ Name = UniFi Switch / CK;    IP = 10.0.10.3; Ports = @(443, 22) }
)

foreach ( in ) {
    Write-Host 
[*] Menguji ()... -ForegroundColor Yellow
     = Test-Connection -ComputerName .IP -Count 2 -Quiet
    if () {
        Write-Host  [OK] Ping Berhasil! -ForegroundColor Green
        foreach ( in .Ports) {
             = Test-NetConnection -ComputerName .IP -Port  -WarningAction SilentlyContinue
            if (.TcpTestSucceeded) {
                Write-Host  - Port : TERBUKA / SIAP -ForegroundColor Green
            } else {
                Write-Host  - Port : TERTUTUP / FILTERED -ForegroundColor Gray
            }
        }
    } else {
        Write-Host  [FAIL] Ping Gagal! Periksa kabel LAN, VLAN 100, atau IP Address PC. -ForegroundColor Red
    }
}

Write-Host 
===================================================================== -ForegroundColor Cyan
Write-Host Diagnostik selesai. -ForegroundColor Cyan
