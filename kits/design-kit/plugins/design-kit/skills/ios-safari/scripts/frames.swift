import AVFoundation
import AppKit
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1]); let out = args[2]
let fps = Double(args[3]) ?? 10
let crop = args.count > 4 ? Double(args[4])! : 1.0  // fraction of height from top to keep
let asset = AVURLAsset(url: url)
let dur = CMTimeGetSeconds(asset.duration)
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
gen.maximumSize = CGSize(width: 402, height: 874)
var t = 0.0; var i = 0
while t < dur {
  if let img = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) {
    let h = Int(Double(img.height) * crop)
    let c = img.cropping(to: CGRect(x: 0, y: 0, width: img.width, height: h))!
    let rep = NSBitmapImageRep(cgImage: c)
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: String(format: "%@/f%03d.png", out, i)))
  }
  t += 1.0 / fps; i += 1
}
print("duration", dur, "frames", i)
