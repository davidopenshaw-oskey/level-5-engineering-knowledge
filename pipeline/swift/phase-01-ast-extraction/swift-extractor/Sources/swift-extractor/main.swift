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

/// One computed `String` property's literal for one enum case, e.g.
/// `var string: String { switch self { case let .user(userId): "/users/\(userId)" } }`
/// yields property "string", template "/users/{userId}", rawTemplate
/// "/users/\(userId)". Added 2026-09-26 (W4c, doc 43): additive only, the
/// existing EnumCaseFact fields are unchanged and this field is omitted
/// (nil is not encoded) for any enum with no such property.
struct ComputedStringFact: Codable {
    let property: String
    /// Literal with each `\(x)` replaced by `{name}`; nil when the case's
    /// body is not a single string literal (see `reason`).
    let template: String?
    let rawTemplate: String?
    let reason: String?
}

struct EnumCaseFact: Codable {
    let name: String
    let rawValue: String?
    let associatedValues: [String]
    var computedStrings: [ComputedStringFact]? = nil
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

// Member-level call resolution (call-resolution-same-repo-edges/01-build-spec,
// Lane S, 2026-10-01): every field below marked "raw" is added for step 01's
// (type, member) resolution. All are additive and omitted when nil; the
// pre-existing fields are untouched, so fact IDs and the legacy resolution
// built from them cannot change.

/// One declared parameter: external label ("_" when unlabeled) and whether it
/// has a default value. Raw: used to pick between overloads by argument labels.
struct ParamFact: Codable {
    let label: String
    let hasDefault: Bool
}

struct FunctionFact: Codable {
    let name: String
    let line: Int
    let visibility: String
    let isStatic: Bool
    let parentType: String?
    var parameters: [ParamFact]? = nil
    /// "member" (declared in a type/extension member block), "local" (inside a
    /// body) or "top_level". Raw.
    var scope: String? = nil
    /// Access modifier of the enclosing `extension`, when there is one: a member
    /// of a `public extension` is public by default although `visibility`
    /// records "internal". Raw.
    var extensionVisibility: String? = nil
    /// Kind of the declaration a member sits in: "class" | "struct" | "enum" |
    /// "protocol" | "actor" | "extension". "protocol" = a protocol
    /// requirement; a member of `extension SomeProtocol` is "extension" (a
    /// default implementation). Raw.
    var containerKind: String? = nil
}

struct PropertyFact: Codable {
    let name: String
    let line: Int
    let visibility: String
    let isStatic: Bool
    let isLet: Bool
    let parentType: String?
    /// Base nominal type name of the type annotation (optionality, generic
    /// arguments, attributes, `any`/`some` stripped); nil without an annotation
    /// or for a collection/tuple/function type. Raw.
    var annotationBaseType: String? = nil
    /// Initializer `Name(...)` / `Name<T>(...)` / `A.Name.init(...)`: the name
    /// called. Whether it is a type is decided in step 01 against the declared
    /// types, not here. Raw.
    var initializerCalledName: String? = nil
    /// Initializer that is a pure dotted path (`T.shared`, `T.a.b`). Raw.
    var initializerPath: [String]? = nil
    var scope: String? = nil
    var extensionVisibility: String? = nil
}

struct CallFact: Codable {
    let calleeExpression: String
    let rootIdentifier: String
    let line: Int
    let callerFunction: String?
    let callerType: String?
    let arguments: [String]
    /// Last segment of a member-access callee (`a.b.member(...)` -> "member").
    var calleeMember: String? = nil
    /// The callee's base when it is a pure dotted identifier path
    /// (`self.a`, `T.shared`, `a?.b`); nil when the base contains a call,
    /// subscript or other expression. Raw.
    var calleeBasePath: [String]? = nil
    /// "bare" | "member_of_path" | "member_of_expression" | "implicit_member" | "other". Raw.
    var calleeShape: String? = nil
    /// Enclosing member of the call site, including computed properties,
    /// accessors and property initializers; local bindings are skipped.
    var callerMember: String? = nil
    var callerMemberKind: String? = nil
    /// Argument labels in order ("_" for unlabeled) and trailing-closure count. Raw.
    var argumentLabels: [String]? = nil
    var trailingClosures: Int? = nil
    /// True when the root identifier is bound locally at the call site (a
    /// parameter, closure parameter, earlier local declaration or optional
    /// binding), so it cannot be read as a member property or type. Raw.
    var rootIsLocal: Bool? = nil
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
        pendingEnumComputed.append([:])
        pendingEnumLabels.append([:])
        typeStack.append(node.name.text)
        return .visitChildren
    }
    override func visitPost(_ node: EnumDeclSyntax) {
        typeStack.removeLast()
        let computed = pendingEnumComputed.removeLast()
        _ = pendingEnumLabels.removeLast()
        let cases = pendingEnumCases.removeLast().map { c -> EnumCaseFact in
            var withComputed = c
            if let strings = computed[c.name] { withComputed.computedStrings = strings }
            return withComputed
        }
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
            // Declared labels by position (nil for an unlabeled value), used
            // to name `{placeholders}` in a computed-string template.
            pendingEnumLabels[pendingEnumLabels.count - 1][element.name.text] =
                element.parameterClause?.parameters.map { $0.firstName.flatMap { $0.text == "_" ? nil : $0.text } } ?? []
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
        let (scope, extensionVisibility, containerKind) = scopeAndContainerOf(node)
        functions.append(FunctionFact(
            name: node.name.text,
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            isStatic: isStaticOrClassModifier(node.modifiers),
            parentType: typeStack.last,
            parameters: parametersOf(node.signature.parameterClause),
            scope: scope,
            extensionVisibility: extensionVisibility,
            containerKind: containerKind
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
        let (scope, extensionVisibility, containerKind) = scopeAndContainerOf(node)
        functions.append(FunctionFact(
            name: "init",
            line: line(node),
            visibility: visibilityOf(node.modifiers),
            isStatic: false,
            parentType: typeStack.last,
            parameters: parametersOf(node.signature.parameterClause),
            scope: scope,
            extensionVisibility: extensionVisibility,
            containerKind: containerKind
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
        let (scope, extensionVisibility) = scopeOf(node)
        for binding in node.bindings {
            guard let name = binding.pattern.as(IdentifierPatternSyntax.self)?.identifier.text else { continue }
            var fact = PropertyFact(
                name: name,
                line: line(node),
                visibility: visibility,
                isStatic: isStatic,
                isLet: isLet,
                parentType: typeStack.last
            )
            // `var a, b: Int` -- the annotation sits on the last binding of the group.
            let annotation = binding.typeAnnotation?.type
                ?? node.bindings.drop(while: { $0.id != binding.id }).first(where: { $0.typeAnnotation != nil })?.typeAnnotation?.type
            if let annotation { fact.annotationBaseType = baseTypeName(annotation) }
            if let value = binding.initializer?.value {
                if let call = value.as(FunctionCallExprSyntax.self) {
                    fact.initializerCalledName = initializerCalledName(call.calledExpression)
                } else {
                    fact.initializerPath = dottedPath(value)
                }
            }
            fact.scope = scope
            fact.extensionVisibility = extensionVisibility
            properties.append(fact)
        }
        captureComputedStrings(node)
        return .visitChildren
    }

    // W4c (doc 43, 2026-09-26): an enum's computed `String` property whose
    // body is `switch self` with one string literal per case (the shape of
    // swift-cloud-kit's Firestore path enums, but matched structurally, not
    // by enum/property name). Recorded per case as `computedStrings`; which
    // enums are actually Firestore path enums is decided later, in
    // 01-extract-ast-evidence.ts, not here.
    private var pendingEnumComputed: [[String: [ComputedStringFact]]] = []
    private var pendingEnumLabels: [[String: [String?]]] = []

    /// True only for a stored/computed member declared directly in an enum's
    /// member block (through any `#if`), not inside a function/accessor/
    /// closure body and not in a nested type.
    private func isDirectEnumMember(_ node: VariableDeclSyntax) -> Bool {
        var current: Syntax? = node.parent
        while let c = current {
            if c.is(EnumDeclSyntax.self) { return true }
            if c.is(ClassDeclSyntax.self) || c.is(StructDeclSyntax.self) || c.is(ExtensionDeclSyntax.self)
                || c.is(ProtocolDeclSyntax.self) || c.is(ActorDeclSyntax.self)
                || c.is(CodeBlockSyntax.self) || c.is(ClosureExprSyntax.self) || c.is(AccessorBlockSyntax.self) {
                return false
            }
            current = c.parent
        }
        return false
    }

    private func captureComputedStrings(_ node: VariableDeclSyntax) {
        guard !pendingEnumComputed.isEmpty, isDirectEnumMember(node) else { return }
        for binding in node.bindings {
            guard let property = binding.pattern.as(IdentifierPatternSyntax.self)?.identifier.text,
                  binding.typeAnnotation?.type.trimmedDescription == "String",
                  let accessorBlock = binding.accessorBlock else { continue }
            var body: CodeBlockItemListSyntax?
            switch accessorBlock.accessors {
            case .getter(let items):
                body = items
            case .accessors(let list):
                body = list.first(where: { $0.accessorSpecifier.tokenKind == .keyword(.get) })?.body?.statements
            }
            guard let items = body, let switchExpr = switchExprOf(items) else { continue }
            for caseItem in switchExpr.cases {
                guard case .switchCase(let switchCase) = caseItem,
                      case .case(let label) = switchCase.label else { continue }
                let literal = stringLiteralOf(switchCase.statements)
                for item in label.caseItems {
                    guard let (caseName, boundNames) = caseNameAndBindings(item.pattern) else { continue }
                    var fact: ComputedStringFact
                    if let literal {
                        let declared = pendingEnumLabels[pendingEnumLabels.count - 1][caseName] ?? []
                        let (template, raw) = templateOf(literal, boundNames: boundNames, declaredLabels: declared)
                        fact = ComputedStringFact(property: property, template: template, rawTemplate: raw, reason: nil)
                    } else {
                        fact = ComputedStringFact(property: property, template: nil, rawTemplate: nil,
                                                  reason: "case body is not a single string literal")
                    }
                    pendingEnumComputed[pendingEnumComputed.count - 1][caseName, default: []].append(fact)
                }
            }
        }
    }

    /// `switch self { ... }` as the sole statement, as an implicit return,
    /// an explicit `return switch`, or the statement itself.
    private func switchExprOf(_ items: CodeBlockItemListSyntax) -> SwitchExprSyntax? {
        guard items.count == 1, let only = items.first else { return nil }
        if let expr = only.item.as(SwitchExprSyntax.self) { return expr }
        if let ret = only.item.as(ReturnStmtSyntax.self), let expr = ret.expression?.as(SwitchExprSyntax.self) { return expr }
        if let stmtExpr = only.item.as(ExpressionStmtSyntax.self), let expr = stmtExpr.expression.as(SwitchExprSyntax.self) { return expr }
        return nil
    }

    private func stringLiteralOf(_ items: CodeBlockItemListSyntax) -> StringLiteralExprSyntax? {
        guard items.count == 1, let only = items.first else { return nil }
        if let lit = only.item.as(StringLiteralExprSyntax.self) { return lit }
        if let ret = only.item.as(ReturnStmtSyntax.self) { return ret.expression?.as(StringLiteralExprSyntax.self) }
        return nil
    }

    /// `.users`, `.user(userId)`, `let .user(userId)`, `.user(userId: userId)`
    /// -> (case name, bound names by position; label ignored, the bound
    /// name is what the literal's `\(...)` refers to).
    private func caseNameAndBindings(_ pattern: PatternSyntax) -> (String, [String])? {
        var inner: PatternSyntax = pattern
        if let bound = pattern.as(ValueBindingPatternSyntax.self) { inner = bound.pattern }
        guard let exprPattern = inner.as(ExpressionPatternSyntax.self) else { return nil }
        let expr = exprPattern.expression
        if let member = expr.as(MemberAccessExprSyntax.self), member.base == nil {
            return (member.declName.baseName.text, [])
        }
        if let call = expr.as(FunctionCallExprSyntax.self),
           let member = call.calledExpression.as(MemberAccessExprSyntax.self), member.base == nil {
            let names = call.arguments.map { arg -> String in
                var text = arg.expression.trimmedDescription
                for prefix in ["let ", "var "] where text.hasPrefix(prefix) { text.removeFirst(prefix.count) }
                return text
            }
            return (member.declName.baseName.text, names)
        }
        return nil
    }

    /// Template with each `\(x)` as `{name}`. A bound name at position i maps
    /// to the case's declared label at position i when there is one (the
    /// switch may bind different names than the declaration, and the
    /// declared label is the stable one); any other expression keeps its
    /// source text.
    private func templateOf(_ literal: StringLiteralExprSyntax, boundNames: [String], declaredLabels: [String?]) -> (String, String) {
        var template = ""
        var raw = ""
        for segment in literal.segments {
            if let text = segment.as(StringSegmentSyntax.self) {
                template += text.content.text
                raw += text.content.text
            } else if let interpolation = segment.as(ExpressionSegmentSyntax.self) {
                let exprText = interpolation.expressions.trimmedDescription
                var name = exprText
                if let idx = boundNames.firstIndex(of: exprText), idx < declaredLabels.count, let label = declaredLabels[idx] {
                    name = label
                }
                template += "{\(name)}"
                raw += "\\(\(exprText))"
            }
        }
        return (template, raw)
    }

    // ---- Member-level call resolution helpers (Lane S, 2026-10-01) ----

    private func parametersOf(_ clause: FunctionParameterClauseSyntax) -> [ParamFact] {
        clause.parameters.map { ParamFact(label: $0.firstName.text, hasDefault: $0.defaultValue != nil) }
    }

    /// Where a declaration sits: directly in a type/extension member block
    /// ("member", plus the extension's own access modifier if any), inside any
    /// body ("local"), or at file level ("top_level").
    private func scopeOf(_ node: some SyntaxProtocol) -> (String, String?) {
        let (scope, extensionVisibility, _) = scopeAndContainerOf(node)
        return (scope, extensionVisibility)
    }

    /// scopeOf plus the kind of the enclosing declaration for a member.
    private func scopeAndContainerOf(_ node: some SyntaxProtocol) -> (String, String?, String?) {
        var current: Syntax? = Syntax(node).parent
        while let c = current {
            if c.is(CodeBlockSyntax.self) || c.is(ClosureExprSyntax.self) || c.is(AccessorBlockSyntax.self) { return ("local", nil, nil) }
            if let ext = c.as(ExtensionDeclSyntax.self) {
                let modifier = ext.modifiers.first(where: { ["public", "open", "internal", "fileprivate", "private"].contains($0.name.text) })
                return ("member", modifier?.name.text, "extension")
            }
            if c.is(ClassDeclSyntax.self) { return ("member", nil, "class") }
            if c.is(StructDeclSyntax.self) { return ("member", nil, "struct") }
            if c.is(EnumDeclSyntax.self) { return ("member", nil, "enum") }
            if c.is(ProtocolDeclSyntax.self) { return ("member", nil, "protocol") }
            if c.is(ActorDeclSyntax.self) { return ("member", nil, "actor") }
            current = c.parent
        }
        return ("top_level", nil, nil)
    }

    /// Base nominal type name: optionality, generic arguments, attributes and
    /// `any`/`some` stripped; a member type `A.B` -> "B" (the name a nested
    /// type's own declaration and `parentType` use). Collection, dictionary,
    /// tuple and function types -> nil (no guess).
    private func baseTypeName(_ type: TypeSyntax) -> String? {
        if let t = type.as(IdentifierTypeSyntax.self) { return t.name.text }
        if let t = type.as(OptionalTypeSyntax.self) { return baseTypeName(t.wrappedType) }
        if let t = type.as(ImplicitlyUnwrappedOptionalTypeSyntax.self) { return baseTypeName(t.wrappedType) }
        if let t = type.as(MemberTypeSyntax.self) { return t.name.text }
        if let t = type.as(AttributedTypeSyntax.self) { return baseTypeName(t.baseType) }
        if let t = type.as(SomeOrAnyTypeSyntax.self) { return baseTypeName(t.constraint) }
        return nil
    }

    /// A pure dotted identifier path (`a`, `self.a`, `T.shared.b`, `a?.b`,
    /// `T<X>.shared`), else nil.
    private func dottedPath(_ expr: ExprSyntax) -> [String]? {
        if let d = expr.as(DeclReferenceExprSyntax.self) { return [d.baseName.text] }
        if expr.is(SuperExprSyntax.self) { return ["super"] }
        if let o = expr.as(OptionalChainingExprSyntax.self) { return dottedPath(o.expression) }
        if let f = expr.as(ForceUnwrapExprSyntax.self) { return dottedPath(f.expression) }
        if let g = expr.as(GenericSpecializationExprSyntax.self) { return dottedPath(g.expression) }
        if let m = expr.as(MemberAccessExprSyntax.self) {
            guard let base = m.base, let basePath = dottedPath(base) else { return nil }
            return basePath + [m.declName.baseName.text]
        }
        return nil
    }

    /// The name an initializer expression `X(...)` calls: `Name(...)`,
    /// `Name<T>(...)`, `A.Name(...)`, `Name.init(...)`. nil for `.init(...)`,
    /// a closure call or a call on a computed base.
    private func initializerCalledName(_ callee: ExprSyntax) -> String? {
        guard let path = dottedPath(callee), path.first != "self", path.first != "super" else { return nil }
        if path.last == "init" { return path.count >= 2 ? path[path.count - 2] : nil }
        return path.last
    }

    /// Nearest enclosing member of a call site. A property initializer or
    /// accessor counts only when the property is a member (or top-level); a
    /// local `let x = ...` inside a body is skipped, so the call reports the
    /// enclosing function instead.
    private func enclosingMember(_ node: some SyntaxProtocol) -> (String, String)? {
        var current: Syntax? = Syntax(node).parent
        var sawClosure = false
        while let c = current {
            if c.is(ClosureExprSyntax.self) { sawClosure = true }
            if let f = c.as(FunctionDeclSyntax.self) { return (f.name.text, "function") }
            if c.is(InitializerDeclSyntax.self) { return ("init", "init") }
            if c.is(DeinitializerDeclSyntax.self) { return ("deinit", "deinit") }
            if c.is(SubscriptDeclSyntax.self) { return ("subscript", "subscript") }
            if let accessor = c.as(AccessorDeclSyntax.self), let (binding, decl) = owningBinding(c), scopeOf(decl).0 != "local" {
                let name = binding.pattern.as(IdentifierPatternSyntax.self)?.identifier.text ?? binding.pattern.trimmedDescription
                switch accessor.accessorSpecifier.tokenKind {
                case .keyword(.get): return (name, "computed_property")
                case .keyword(.willSet), .keyword(.didSet): return (name, "property_observer")
                default: return (name, "property_setter")
                }
            }
            if let binding = c.as(PatternBindingSyntax.self), let decl = binding.parent?.parent?.as(VariableDeclSyntax.self), scopeOf(decl).0 != "local" {
                let name = binding.pattern.as(IdentifierPatternSyntax.self)?.identifier.text ?? binding.pattern.trimmedDescription
                if binding.initializer == nil && binding.accessorBlock != nil { return (name, "computed_property") }
                return (name, sawClosure ? "closure_in_property" : "property_initializer")
            }
            if c.is(ClassDeclSyntax.self) || c.is(StructDeclSyntax.self) || c.is(EnumDeclSyntax.self)
                || c.is(ExtensionDeclSyntax.self) || c.is(ProtocolDeclSyntax.self) || c.is(ActorDeclSyntax.self) {
                return nil
            }
            current = c.parent
        }
        return nil
    }

    private func owningBinding(_ node: Syntax) -> (PatternBindingSyntax, VariableDeclSyntax)? {
        var current: Syntax? = node.parent
        while let c = current {
            if let binding = c.as(PatternBindingSyntax.self), let decl = binding.parent?.parent?.as(VariableDeclSyntax.self) { return (binding, decl) }
            if c.is(MemberBlockSyntax.self) || c.is(CodeBlockSyntax.self) { return nil }
            current = c.parent
        }
        return nil
    }

    /// True when `name` is bound locally where `node` sits: an enclosing
    /// function/initializer/subscript/closure parameter, a closure capture, a
    /// declaration earlier in an enclosing code block (variable, local
    /// function, `guard let`), an `if`/`while`/`for`/`case`/`catch` binding,
    /// or an accessor's implicit `newValue`/`oldValue`. Walks the real syntax up
    /// to the enclosing type, no name list.
    private func isLocallyBound(_ name: String, at node: some SyntaxProtocol) -> Bool {
        var child: Syntax = Syntax(node)
        var current: Syntax? = child.parent
        while let c = current {
            if c.is(ClassDeclSyntax.self) || c.is(StructDeclSyntax.self) || c.is(EnumDeclSyntax.self)
                || c.is(ExtensionDeclSyntax.self) || c.is(ProtocolDeclSyntax.self) || c.is(ActorDeclSyntax.self) {
                return false
            }
            if let items = c.as(CodeBlockItemListSyntax.self) {
                for item in items {
                    if item.id == child.id { break }
                    if let v = item.item.as(VariableDeclSyntax.self), v.bindings.contains(where: { bindsName($0.pattern, name) }) { return true }
                    if let f = item.item.as(FunctionDeclSyntax.self), f.name.text == name { return true }
                    if let g = item.item.as(GuardStmtSyntax.self), conditionsBind(g.conditions, name) { return true }
                }
            }
            if let ifExpr = c.as(IfExprSyntax.self), child.id == ifExpr.body.id, conditionsBind(ifExpr.conditions, name) { return true }
            if let w = c.as(WhileStmtSyntax.self), child.id == w.body.id, conditionsBind(w.conditions, name) { return true }
            if let f = c.as(ForStmtSyntax.self), child.id == f.body.id, bindsName(f.pattern, name) { return true }
            if let sc = c.as(SwitchCaseSyntax.self), case .case(let label) = sc.label,
               label.caseItems.contains(where: { bindsName($0.pattern, name) }) { return true }
            if let cc = c.as(CatchClauseSyntax.self) {
                if cc.catchItems.isEmpty && name == "error" { return true }
                if cc.catchItems.contains(where: { $0.pattern.map { bindsName($0, name) } ?? false }) { return true }
            }
            if let closure = c.as(ClosureExprSyntax.self), let signature = closure.signature {
                if let captures = signature.capture?.items, captures.contains(where: { $0.name.text == name }) { return true }
                switch signature.parameterClause {
                case .simpleInput(let list): if list.contains(where: { $0.name.text == name }) { return true }
                case .parameterClause(let clause): if clause.parameters.contains(where: { ($0.secondName ?? $0.firstName).text == name }) { return true }
                case nil: break
                }
            }
            if let f = c.as(FunctionDeclSyntax.self), f.signature.parameterClause.parameters.contains(where: { ($0.secondName ?? $0.firstName).text == name }) { return true }
            if let i = c.as(InitializerDeclSyntax.self), i.signature.parameterClause.parameters.contains(where: { ($0.secondName ?? $0.firstName).text == name }) { return true }
            if let s = c.as(SubscriptDeclSyntax.self), s.parameterClause.parameters.contains(where: { ($0.secondName ?? $0.firstName).text == name }) { return true }
            if let a = c.as(AccessorDeclSyntax.self) {
                if let p = a.parameters, p.name.text == name { return true }
                switch a.accessorSpecifier.tokenKind {
                case .keyword(.set), .keyword(.willSet): if a.parameters == nil && name == "newValue" { return true }
                case .keyword(.didSet): if a.parameters == nil && name == "oldValue" { return true }
                default: break
                }
            }
            child = c
            current = c.parent
        }
        return false
    }

    private func conditionsBind(_ conditions: ConditionElementListSyntax, _ name: String) -> Bool {
        conditions.contains { element in
            switch element.condition {
            case .optionalBinding(let b): return bindsName(b.pattern, name)
            case .matchingPattern(let m): return bindsName(m.pattern, name)
            default: return false
            }
        }
    }

    /// Any identifier pattern named `name` inside a pattern (tuples, `let`/`var`, enum-case payloads).
    private func bindsName(_ pattern: some SyntaxProtocol, _ name: String) -> Bool {
        if let id = Syntax(pattern).as(IdentifierPatternSyntax.self) { return id.identifier.text == name }
        if Syntax(pattern).is(ClosureExprSyntax.self) || Syntax(pattern).is(CodeBlockSyntax.self) { return false }
        for child in Syntax(pattern).children(viewMode: .sourceAccurate) where bindsName(child, name) { return true }
        // `case .x(let value)` binds through an expression pattern whose leaf is a DeclReference.
        if let d = Syntax(pattern).as(DeclReferenceExprSyntax.self), d.baseName.text == name,
           Syntax(pattern).ancestorOrSelf(mapping: { $0.as(ValueBindingPatternSyntax.self) }) != nil {
            return true
        }
        return false
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
        var fact = CallFact(
            calleeExpression: calleeText,
            rootIdentifier: rootIdentifier,
            line: line(node),
            callerFunction: functionStack.last,
            callerType: typeStack.last,
            arguments: arguments
        )
        var callee = node.calledExpression
        if let generic = callee.as(GenericSpecializationExprSyntax.self) { callee = generic.expression }
        if let member = callee.as(MemberAccessExprSyntax.self) {
            fact.calleeMember = member.declName.baseName.text
            if let base = member.base {
                fact.calleeBasePath = dottedPath(base)
                fact.calleeShape = fact.calleeBasePath == nil ? "member_of_expression" : "member_of_path"
            } else {
                fact.calleeShape = "implicit_member"
            }
        } else if callee.is(DeclReferenceExprSyntax.self) {
            fact.calleeShape = "bare"
        } else {
            fact.calleeShape = "other"
        }
        if let (member, kind) = enclosingMember(node) {
            fact.callerMember = member
            fact.callerMemberKind = kind
        }
        fact.argumentLabels = node.arguments.map { $0.label?.text ?? "_" }
        let trailing = (node.trailingClosure == nil ? 0 : 1) + node.additionalTrailingClosures.count
        if trailing > 0 { fact.trailingClosures = trailing }
        if !rootIdentifier.isEmpty, rootIdentifier != "self", rootIdentifier != "super",
           isLocallyBound(rootIdentifier, at: node) {
            fact.rootIsLocal = true
        }
        calls.append(fact)
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
    // 3.1.0 (2026-10-01): additive raw fields for member-level call resolution.
    schemaVersion: "3.1.0",
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
