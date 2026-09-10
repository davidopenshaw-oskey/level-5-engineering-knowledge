// swift-tools-version:5.9
import PackageDescription

// SwiftSyntax version is pinned to EXACT: "603.0.2" here because that is what
// matched the toolchain installed on the machine that built and verified this
// package (Xcode 26.6 / Swift 6.3.3, confirmed via `swift --version`) --
// SwiftSyntax's own release version tracks the compiler needed to BUILD it,
// not the Swift source dialect it can parse. Re-derive this pin against
// whatever toolchain is actually installed before rebuilding on a different
// machine; do not assume 603.0.2 is portable. See
// governance/roadmap/ios-oskey-dev/09-task1-decision-swiftsyntax-2026-09-09.md.
let package = Package(
    name: "swift-extractor",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(url: "https://github.com/apple/swift-syntax.git", exact: "603.0.2")
    ],
    targets: [
        .executableTarget(
            name: "swift-extractor",
            dependencies: [
                .product(name: "SwiftSyntax", package: "swift-syntax"),
                .product(name: "SwiftParser", package: "swift-syntax"),
                .product(name: "SwiftParserDiagnostics", package: "swift-syntax")
            ]
        )
    ]
)
