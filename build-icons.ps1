Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 64, 128, 256, 512, 1024)

function New-IconPng([int]$size) {
    $scale = [float]$size / 108.0
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $margin = [int](8 * $scale)
    $corner = [int](22 * $scale)
    $rect = New-Object System.Drawing.Rectangle($margin, $margin, ($size - 2 * $margin), ($size - 2 * $margin))
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $corner * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc(($rect.Right - $d), $rect.Y, $d, $d, 270, 90)
    $path.AddArc(($rect.Right - $d), ($rect.Bottom - $d), $d, $d, 0, 90)
    $path.AddArc($rect.X, ($rect.Bottom - $d), $d, $d, 90, 90)
    $path.CloseFigure()
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 88, 101, 242))
    $g.FillPath($bg, $path)

    $boltPts = @(
        @(62,14), @(36,58), @(52,58), @(46,94), @(72,48), @(56,48), @(66,14)
    )
    $pts = @()
    foreach ($p in $boltPts) {
        $x = [float]([double]$p[0] * $scale)
        $y = [float]([double]$p[1] * $scale)
        $pts += New-Object System.Drawing.PointF($x, $y)
    }
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPolygon($white, $pts)

    $g.Dispose()
    return $bmp
}

New-Item -ItemType Directory -Force build | Out-Null
foreach ($s in $sizes) {
    $bmp = New-IconPng $s
    $bmp.Save("build\icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
Copy-Item build\icon-1024.png build\icon.png
Write-Output "icons written"
