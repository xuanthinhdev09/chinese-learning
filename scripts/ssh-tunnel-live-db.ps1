# Always-on SSH tunnel to the live Postgres on the VPS.
# Local 5433 -> VPS loopback 5432 (container maps 127.0.0.1:5432 only).
# Uses local port 5433 because the local dev Postgres (Docker) owns 5432.
# Registered as a Scheduled Task at logon; the loop reconnects after any drop.

$VpsTarget = 'thinh@91.99.69.228'
$LocalPort = 5433
$SshExe = 'C:\Windows\System32\OpenSSH\ssh.exe'

while ($true) {
    & $SshExe `
        -N `
        -o ExitOnForwardFailure=yes `
        -o ConnectTimeout=10 `
        -o ServerAliveInterval=15 `
        -o ServerAliveCountMax=3 `
        -o StrictHostKeyChecking=accept-new `
        -L "127.0.0.1:${LocalPort}:127.0.0.1:5432" `
        $VpsTarget
    # ssh exited (network drop, sleep/wake, VPS restart) -> retry shortly
    Start-Sleep -Seconds 5
}
