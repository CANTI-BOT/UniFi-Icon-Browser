Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)
$sourcePath = Join-Path $PSScriptRoot "icon-source.png"

# Check if source image exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "Error: icon-source.png not found in icons folder"
    Write-Host "Please place your source icon image as 'icon-source.png' in the icons folder"
    exit 1
}

# Load source image
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
Write-Host "Loaded source image: $($sourceImage.Width)x$($sourceImage.Height)"

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)

    # High quality scaling
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Draw the source image scaled to the target size
    $g.DrawImage($sourceImage, 0, 0, $size, $size)

    $outputPath = Join-Path $PSScriptRoot "icon$size.png"
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()

    Write-Host "Created icon$size.png"
}

$sourceImage.Dispose()
Write-Host "All icons generated successfully!"
