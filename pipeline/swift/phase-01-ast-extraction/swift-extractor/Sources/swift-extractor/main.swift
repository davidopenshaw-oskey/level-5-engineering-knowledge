// **version:** 2.0.0 (P1 build tasklist Task 5 -- real declaration/call facts)
// **location:** level-5 phase 1, Swift extractor subprocess
// © Oskey SAS. All rights reserved.
//
// Real, compiled Swift executable invoked from this repo's Node/TS pipeline
// via child_process (see ../01-extract-ast-evidence.ts). Exists because
// SwiftSyntax, unlike ts-morph/tree-sitter-kotlin, is not an npm-consumable
// library -- it needs an actual Swift compiler to build and run.
//
// CHANGELOG (2.0.0): extends Task 3's wiring-proof version (which only
// reported per-file diagnostic counts) with real declaration-level and
// call-expression facts -- classes, structs, enums, protocols, extensions,
// functions, properties, imports, calls. Deliberately emits RAW per-file
// facts only, with no cross-file resolution -- the import-aware/same-target
// symbol table (resolved_via_import / resolved_via_same_target / unresolved)
// is built in TypeScript by 01-extract-ast-evidence.ts, operating on this
// binary's JSON output, not here. This split keeps the Swift-toolchain
// dependency confined to the one thing that genuinely needs it (parsing),
// while the resolution logic -- pure name/string matching across files,
// nothing SwiftSyntax-specific -- stays in the same language as every other
// repo's resolver, per governance/roadmap/ios-oskey-dev/09-task1-decision-
// swiftsyntax-2026-09-09.md's "Deployment implications" section.
//
// Usage: swift-extractor <rootDir> <outputJsonPath>

import Foundation
import SwiftSyntax
import SwiftParser
import SwiftParserDiagnostics

struct ImportFact: Codable {
    let module: String
    let line: Int
}

struct EnumCaseFact: Codable {
    let name: String
    let rawValue: String?
    let associatedValues: [String]
}

struct DeclFact: Codable {
    let name: String
    let line: Int
    let visibility: String
    let extendsTypes: [String]
    let parentType: String?
    // Always empty for class/struct/protocol/extension -- only enums
    // populate this. Real, high-value fact found while building Task 8
    // (description enrichment): this repo's own real enums are raw-value
    // wire-protocol enums (`case unlock = 0x02`, `case locked = 0x00`), the
    // same closed-set-value pattern this project has repeatedly found to be
    // its single highest-value fact kind (USB wire constants, Kotlin enum
    // members) -- captured from day one here rather than left as a gap for
    // a future retrieval-quality investigation to rediscover.
    let cases: [EnumCaseFact]
}

struct FunctionFact: Codable {
    let name: String
    let line: Int
    let visibility: String
    let isStatic: Bool
    let parentType: String?
}

struct PropertyFact: Codable {
    let name: String
    let line: Int
    let visibility: String
    let isStatic: Bool
    let isLet: Bool
    let parentType: String?
}

struct CallFact: Codable {
    let calleeExpression: String
    let rootIdentifier: String
    let line: Int
    let callerFunction: String?
    let callerType: String?
    let arguments: [String]
}

struct FileFacts: Codable {
    let path: String
    let diagnosticCount: Int
    let diagnosticMessages: [String]
    let imports: [ImportFact]
    let classes: [DeclFact]
    let structs: [DeclFact]
    let enums: [DeclFact]
    let protocols: [DeclFact]
    let extensions: [DeclFact]
    let functions: [FunctionFact]
    let properties: [PropertyFact]
    let calls: [CallFact]
}

struct ExtractionResult: Codable {
    let schemaVersion: String
    let generatedAt: String
    let rootDir: String
    let totalFiles: Int
    let filesWithDiagnostics: Int
    let totalDiagnostics: Int
    let files: [FileFacts]
}

/// Real, honest scope note: does NOT attempt to resolve `parentType` for
/// declarations nested inside an `extension` the same way it does for a
/// `class`/`struct`/`enum` body -- extensions add members to an EXISTING
/// type, so a call/property found inside one is correctly attributed to the
/// extended type's name, which this visitor's typeStack already handles
/// uniformly (an extension pushes its extended type's name just like a class
/// pushes its own).
final class FactExtractor: SyntaxVisitor {
    var imports: [ImportFact] = []
    var classes: [DeclFact] = []
    var structs: [DeclFact] = []
    var enums: [DeclFact] = []
    var protocols: [DeclFact] = []
    var extensions: [DeclFact] = []
    var functions: [FunctionFact] = []
    var properties: [PropertyFact] = []
    var calls: [CallFact] = []

    private var typeStack: [String] = []
    private var functionStack: [String] = []
    private let converter: SourceLocationConverter

    init(converter: SourceLocationConverter) {
        self.converter = converter
        super.init(viewMode: .sourceAccurate)
    }

    private func line(_ node: some SyntaxProtocol) -> Int {
        node.startLocation(converter: converter).line
    }

    private func visibilityOf(_ modifiers: DeclModifierListSyntax) -> String {
        for m in modifiers {
            let name = m.name.text
            if ["public", "private", "internal", "fileprivate", "open"].contains(name) {
                return name
            }
        }
        return "internal" // Swift's real default access level when unspecified.
    }

    private func isStaticOrClassModifier(_ modifiers: DeclModifierListSyntax) -> Bool {
        modifiers.contains { $0.name.text == "static" || $0.name.text == "class" }
    }

    private func extendsTypesOf(_ clause: InheritanceClauseSyntax?) -> [String] {
        guard let clause else { return [] }
        return clause.inheritedTypes.map { $0.type.trimmedDescription }
    }

    /// Real structural root-identifier resolution for a call's callee
    /// expression -- recurses through the ACTUAL syntax tree shape rather
    /// than splitting rendered text, so it stays correct for a chain of any
    /// depth (`Text(...).font(...).foregroundColor` correctly walks down to
    /// "Text", not whatever token happens to precede the first "."
    /// character in the whole blob of text). Returns "" (never a guess) for
    /// an implicit member expression (`.signUp(...)`, no real base at all --
    /// a syntax-only tool cannot know its inferred receiver type) or any
    /// expression shape not explicitly handled here -- an honest gap, not a
    /// silently wrong answer.
    private func rootIdentifierOf(_ expr: ExprSyntax) -> String {
        if let call = expr.as(FunctionCallExprSyntax.self) {
            return rootIdentifierOf(call.calledExpression)
        }
        if let member = expr.as(MemberAccessExprSyntax.self) {
            guard let base = member.base else { return "" } // implicit member expression
            return rootIdentifierOf(base)
        }
        if let generic = expr.as(GenericSpecializationExprSyntax.self) {
            return rootIdentifierOf(generic.expression)
        }
        if let optionalChain = expr.as(OptionalChainingExprSyntax.self) {
            return rootIdentifierOf(optionalChain.expression)
        }
        if let forceUnwrap = expr.as(ForceUnwrapExprSyntax.self) {
            return rootIdentifierOf(forceUnwrap.expression)
        }
        if let declRef = expr.as(DeclReferenceExprSyntax.self) {
            return declRef.baseName.text
        }
        return ""
    }

    override func visit(_ node: ImportDeclSyntax) -> SyntaxVisitorContinueKind {
        imports.append(ImportFact(module: node.path.trimmedDescription, line: line(node)))
        return .visitChildren
    }

    // Real bug found and fixed 2026-09-10, while validating the shared
    // pipeline against swift-cloud-kit-oskey-dev's real code: an `#if`
    // clause's CONDITION (`canImport(FirebaseFirestore)`, `os(iOS)`,
    // `swift(>=5.9)`, etc.) is syntactically shaped exactly like a function
    // call, so the generic FunctionCallExprSyntax visitor below was sweeping
    // it up as a real call -- 121 of 979 real calls in that one repo alone
    // (12.4%), pure noise: these are compile-time predicates, never
    // executable code, and carry no import information of their own (the
    // real `import` statements they guard are a separate, already-correct
    // extraction path -- verified directly, not assumed, before writing this
    // fix: every import inside a real `#if canImport(...)` block in that
    // repo was already present in `imports`, this bug never caused data
    // loss, only mis-categorized noise in `calls`).
    //
    // Fixed structurally, not by name-matching known compiler-directive
    // identifiers (canImport/os/arch/swift/compiler/...) -- that would be a
    // guess at an unbounded, Swift-version-dependent list. Instead: walk
    // every child of an `IfConfigClauseSyntax` EXCEPT its own `condition`
    // (identified by real node identity, not text) -- the guarded code
    // itself (`elements`, wherever a real import/declaration/call actually
    // lives) is still visited normally, only the condition expression is
    // skipped.
    override func visit(_ node: IfConfigClauseSyntax) -> SyntaxVisitorContinueKind {
        for child in node.children(viewMode: .sourceAccurate) {
            if let condition = node.condition, child.id == condition.id {
                continue
            }
            walk(child)
        }
        return .skipChildren
    }

    override func visit(_ node: ClassDeclSyntax) -> SyntaxVisitorContinueKind {
        classes.append(DeclFact(
            name: node.name.text,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            extendsTypes: extendsTypesOf(node.inheritanceClause),
            parentType: typeStack.last,
            cases: []
        ))
        typeStack.append(node.name.text)
        return .visitChildren
    }
    override func visitPost(_ node: ClassDeclSyntax) { typeStack.removeLast() }

    override func visit(_ node: StructDeclSyntax) -> SyntaxVisitorContinueKind {
        structs.append(DeclFact(
            name: node.name.text,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            extendsTypes: extendsTypesOf(node.inheritanceClause),
            parentType: typeStack.last,
            cases: []
        ))
        typeStack.append(node.name.text)
        return .visitChildren
    }
    override func visitPost(_ node: StructDeclSyntax) { typeStack.removeLast() }

    // Enums are handled differently from class/struct/protocol/extension:
    // the fact isn't appended until visitPost, once its real `case`
    // declarations (visited as children, via the EnumCaseDeclSyntax override
    // below) have been collected onto `pendingEnumCases`. Appending
    // immediately on `visit` (like every other decl kind here) would mean
    // the enum's own DeclFact already exists in `enums` with an empty
    // `cases` array before its children are ever visited -- Swift's
    // value-type structs can't be mutated in place inside an array via a
    // stored reference the way a class instance could.
    private var pendingEnumCases: [[EnumCaseFact]] = []

    override func visit(_ node: EnumDeclSyntax) -> SyntaxVisitorContinueKind {
        pendingEnumCases.append([])
        typeStack.append(node.name.text)
        return .visitChildren
    }
    override func visitPost(_ node: EnumDeclSyntax) {
        typeStack.removeLast()
        let cases = pendingEnumCases.removeLast()
        enums.append(DeclFact(
            name: node.name.text,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            extendsTypes: extendsTypesOf(node.inheritanceClause),
            parentType: typeStack.last,
            cases: cases
        ))
    }

    override func visit(_ node: EnumCaseDeclSyntax) -> SyntaxVisitorContinueKind {
        guard !pendingEnumCases.isEmpty else { return .visitChildren }
        for element in node.elements {
            let rawValue = element.rawValue?.value.trimmedDescription
            let associatedValues = element.parameterClause?.parameters.map { $0.type.trimmedDescription } ?? []
            pendingEnumCases[pendingEnumCases.count - 1].append(
                EnumCaseFact(name: element.name.text, rawValue: rawValue, associatedValues: associatedValues)
            )
        }
        return .visitChildren
    }

    override func visit(_ node: ProtocolDeclSyntax) -> SyntaxVisitorContinueKind {
        protocols.append(DeclFact(
            name: node.name.text,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            extendsTypes: extendsTypesOf(node.inheritanceClause),
            parentType: typeStack.last,
            cases: []
        ))
        typeStack.append(node.name.text)
        return .visitChildren
    }
    override func visitPost(_ node: ProtocolDeclSyntax) { typeStack.removeLast() }

    override func visit(_ node: ExtensionDeclSyntax) -> SyntaxVisitorContinueKind {
        let extendedTypeName = node.extendedType.trimmedDescription
        extensions.append(DeclFact(
            name: extendedTypeName,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            extendsTypes: extendsTypesOf(node.inheritanceClause),
            parentType: typeStack.last,
            cases: []
        ))
        typeStack.append(extendedTypeName)
        return .visitChildren
    }
    override func visitPost(_ node: ExtensionDeclSyntax) { typeStack.removeLast() }

    override func visit(_ node: FunctionDeclSyntax) -> SyntaxVisitorContinueKind {
        functions.append(FunctionFact(
            name: node.name.text,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            isStatic: isStaticOrClassModifier(node.modifiers),
            parentType: typeStack.last
        ))
        functionStack.append(node.name.text)
        return .visitChildren
    }
    override func visitPost(_ node: FunctionDeclSyntax) { functionStack.removeLast() }

    // Real gap found and fixed 2026-09-10, while cross-checking this project's
    // own TS/Kotlin pipeline history for transferable script-01 problems
    // (governance/roadmap/ios-oskey-dev/11-cross-pipeline-lessons-checked-
    // against-swift-2026-09-10.md): only visiting FunctionDeclSyntax means
    // every real `init`/`deinit` declaration was completely invisible to the
    // `functions` fact list -- the same "walker tuned to one syntactic shape
    // misses a semantically-equivalent sibling" failure class as Kotlin's own
    // constructor-promoted-properties gap (406 missing, ~26%), different
    // mechanism. Confirmed real and non-trivial before fixing: 16 real
    // `init` and 4 real `deinit` declarations in this repo alone. Also fixes
    // a related, quieter bug: without pushing onto `functionStack` here,
    // every call made INSIDE an initializer's own body (a common place for
    // real dependency-injection assignment, e.g. `self.repository = x`-style
    // wiring) was mis-attributed with `callerFunction: null` instead of
    // "init".
    override func visit(_ node: InitializerDeclSyntax) -> SyntaxVisitorContinueKind {
        functions.append(FunctionFact(
            name: "init",
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            isStatic: false,
            parentType: typeStack.last
        ))
        functionStack.append("init")
        return .visitChildren
    }
    override func visitPost(_ node: InitializerDeclSyntax) { functionStack.removeLast() }

    override func visit(_ node: DeinitializerDeclSyntax) -> SyntaxVisitorContinueKind {
        functions.append(FunctionFact(
            name: "deinit",
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            isStatic: false,
            parentType: typeStack.last
        ))
        functionStack.append("deinit")
        return .visitChildren
    }
    override func visitPost(_ node: DeinitializerDeclSyntax) { functionStack.removeLast() }

    override func visit(_ node: VariableDeclSyntax) -> SyntaxVisitorContinueKind {
        let isLet = node.bindingSpecifier.tokenKind == .keyword(.let)
        let isStatic = isStaticOrClassModifier(node.modifiers)
        let visibility = visibilityOf(node.modifiers)
        for binding in node.bindings {
            guard let name = binding.pattern.as(IdentifierPatternSyntax.self)?.identifier.text else { continue }
            properties.append(PropertyFact(
                name: name,
                line: line(node),
                visibility: visibility,
                isStatic: isStatic,
                isLet: isLet,
                parentType: typeStack.last
            ))
        }
        return .visitChildren
    }

    override func visit(_ node: FunctionCallExprSyntax) -> SyntaxVisitorContinueKind {
        let calleeText = node.calledExpression.trimmedDescription
        // Fourth real gap found and fixed the same day (2026-09-10), the
        // most consequential of the four found while designing Task 9's own
        // 04-build-resolved-graph.ts (governance/roadmap/ios-oskey-dev/
        // 10-p1-build-tasklist-2026-09-10.md): the first three fixes below
        // were all patches to a STRING-SPLITTING approach on calleeText,
        // which breaks down completely for a call more than ~2 hops into a
        // chain -- confirmed directly, real example from swift-ui-kit-
        // oskey-dev: `Text("Verify your identity").font(...).foregroundColor`
        // is the REAL calleeText for the outermost `.foregroundColor(...)`
        // call, because `node.calledExpression` for a member-access-based
        // call is the WHOLE preceding chain, not just its immediate base --
        // `.trimmedDescription` only trims leading/trailing trivia, it does
        // not collapse or summarize a large multi-line base expression.
        // Splitting that text on the first "." found "Text" as the "root"
        // purely because it happened to be the first dot-free token in the
        // whole blob, not because of any real structural analysis -- and
        // "Text" then coincidentally collided with this file's own
        // NOISY_CALL_ROOTS-adjacent assumption that "Text" always means
        // SwiftUI's builtin view (swift-ui-kit-oskey-dev turns out to
        // define its own real, distinct `Text`-named declaration, 122 real
        // call sites resolving to it "successfully" only by name
        // coincidence, not real chain analysis).
        //
        // Replaced entirely with a real structural walk of the syntax tree
        // (rootIdentifierOf(_:), below) instead of patching the string
        // approach a fifth time -- recurses through MemberAccessExprSyntax/
        // FunctionCallExprSyntax/optional-chaining/force-unwrap to the
        // REAL innermost base expression, however deep the chain, and
        // returns "" (never a guess) for any expression shape it doesn't
        // recognize -- an honest gap, not a silent wrong answer.
        let rootIdentifier = rootIdentifierOf(node.calledExpression)
        // Raw source text per argument (label included when present, e.g.
        // "string: \"daecd178-...\""), no evaluation of literals -- same
        // convention Kotlin's own resolver already established for its
        // `callArguments` field.
        let arguments = node.arguments.map { arg -> String in
            if let label = arg.label {
                return "\(label.text): \(arg.expression.trimmedDescription)"
            }
            return arg.expression.trimmedDescription
        }
        calls.append(CallFact(
            calleeExpression: calleeText,
            rootIdentifier: rootIdentifier,
            line: line(node),
            callerFunction: functionStack.last,
            callerType: typeStack.last,
            arguments: arguments
        ))
        return .visitChildren
    }
}

let args = CommandLine.arguments
guard args.count == 3 else {
    FileHandle.standardError.write("usage: swift-extractor <rootDir> <outputJsonPath>\n".data(using: .utf8)!)
    exit(1)
}

let rootDir = args[1]
let outputPath = args[2]

let fm = FileManager.default
guard let enumerator = fm.enumerator(atPath: rootDir) else {
    FileHandle.standardError.write("[Fail-Closed] could not enumerate rootDir '\(rootDir)'\n".data(using: .utf8)!)
    exit(1)
}

var swiftFiles: [String] = []
for case let relPath as String in enumerator {
    if relPath.hasSuffix(".swift") {
        swiftFiles.append(relPath)
    }
}
swiftFiles.sort()

var fileResults: [FileFacts] = []
var filesWithDiagnostics = 0
var totalDiagnostics = 0

for relPath in swiftFiles {
    let fullPath = (rootDir as NSString).appendingPathComponent(relPath)
    guard let source = try? String(contentsOfFile: fullPath, encoding: .utf8) else {
        FileHandle.standardError.write("[Fail-Closed] could not read file '\(fullPath)'\n".data(using: .utf8)!)
        exit(1)
    }

    let tree = Parser.parse(source: source)
    let diags = ParseDiagnosticsGenerator.diagnostics(for: tree)
    if !diags.isEmpty {
        filesWithDiagnostics += 1
        totalDiagnostics += diags.count
    }

    let converter = SourceLocationConverter(fileName: relPath, tree: tree)
    let extractor = FactExtractor(converter: converter)
    extractor.walk(tree)

    fileResults.append(FileFacts(
        path: relPath,
        diagnosticCount: diags.count,
        diagnosticMessages: diags.prefix(5).map { "\($0.message)" },
        imports: extractor.imports,
        classes: extractor.classes,
        structs: extractor.structs,
        enums: extractor.enums,
        protocols: extractor.protocols,
        extensions: extractor.extensions,
        functions: extractor.functions,
        properties: extractor.properties,
        calls: extractor.calls
    ))
}

let isoFormatter = ISO8601DateFormatter()
let result = ExtractionResult(
    schemaVersion: "3.0.0",
    generatedAt: isoFormatter.string(from: Date()),
    rootDir: rootDir,
    totalFiles: swiftFiles.count,
    filesWithDiagnostics: filesWithDiagnostics,
    totalDiagnostics: totalDiagnostics,
    files: fileResults
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
guard let jsonData = try? encoder.encode(result) else {
    FileHandle.standardError.write("[Fail-Closed] could not encode result to JSON\n".data(using: .utf8)!)
    exit(1)
}

let outputDir = (outputPath as NSString).deletingLastPathComponent
try? fm.createDirectory(atPath: outputDir, withIntermediateDirectories: true)
do {
    try jsonData.write(to: URL(fileURLWithPath: outputPath))
} catch {
    FileHandle.standardError.write("[Fail-Closed] could not write output file '\(outputPath)': \(error)\n".data(using: .utf8)!)
    exit(1)
}

print("swift-extractor: \(swiftFiles.count) files, \(filesWithDiagnostics) with diagnostics, \(totalDiagnostics) total diagnostics -> \(outputPath)")
