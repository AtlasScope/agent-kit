import AppKit
let a = CommandLine.arguments
let dir = a[1], out = a[2], from = Int(a[3])!, to = Int(a[4])!, cols = Int(a[5])!
var imgs: [CGImage] = []
for i in from...to { let p = String(format: "%@/f%03d.png", dir, i); if let im = NSImage(contentsOfFile: p)?.cgImage(forProposedRect: nil, context: nil, hints: nil) { imgs.append(im) } }
let w = imgs[0].width, h = imgs[0].height, rows = (imgs.count + cols - 1) / cols
let ctx = CGContext(data: nil, width: w * cols, height: (h + 14) * rows, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red: 0.3, green: 0.3, blue: 0.9, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: w * cols, height: (h + 14) * rows))
for (k, im) in imgs.enumerated() { let r = k / cols, c = k % cols; ctx.draw(im, in: CGRect(x: c * w, y: (rows - 1 - r) * (h + 14), width: w, height: h)) }
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
print(imgs.count, w, h)
