# Introduction

ExcaliBrain is a visual personal knowledge management (PKM) tool designed to provide a **structured, interactive mind map** of an Obsidian vault. It is primarily a **hierarchy visualiser** that transforms the associative, often cluttered "cloud" of a standard graph view into a spatially organised map based on defined relationships.

### Purpose and Philosophy
The plugin’s core purpose is to help users **navigate and understand the structure of their knowledge** by applying the **LATCH principle** (Location, Alphabet, Time, Category, and Hierarchy). It aims to move PKM from 3D (text and links) into **4D PKM**, where information is processed non-linearly and visually, making it easier to spot patterns and gaps in understanding. It serves as a "spatial orientation" tool, ensuring the same note always appears with the same structural layout, which aids cognitive recall.

### Logic of Graph Display
ExcaliBrain uses a **centralised spatial logic** to represent the "Thought" (note) currently in focus. The relationships are displayed in specific directions:
* **Parents (North):** Nodes that are broader categories or origins of the central idea.
* **Children (South):** Nodes that represent sub-topics, examples, or instances derived from the center.
* **Friends (West/Left):** Lateral connections representing similar or supporting ideas that are not hierarchical.
* **Next/Competing (East/Right):** Relationships that represent a sequence (the "next" step) or ideas that challenge/supercharge the central concept.
* **Siblings:** Found in the periphery, these are other children of the current node's parents.

### Transformation of Markdown Notes into a Graph
The plugin turns a vault into a graph by parsing Markdown files for three types of data:
1. **Inferred Relationships:** These are automatically derived from standard Obsidian links. A **forward link** is typically inferred as a child, a **backlink** as a parent, and **mutual links** (two files pointing to each other) are treated as friends.
2. **Explicit Relationships (Ontology):** Users can define specific **Dataview fields** (e.g., `author::`, `inspired_by::`, `supports::`) to dictate exactly where a node should appear on the graph. This creates a "link ontology"—a formal description of what a connection means.
3. **Virtual Nodes:** The graph displays "ghost" nodes for **unresolved links** (links to files that do not yet exist), allowing users to navigate and understand their vault’s future structure before creating the content.

### Key Features and Plugin Logic
* **Ontology Suggester:** A built-in UI tool that prompts users with valid Dataview fields as they write, ensuring consistent relationship mapping.
* **Customisable Node Styling:** Nodes can be styled (color, border, icons, prefixes) based on **tags** or **metadata**, allowing different "types" of notes (e.g., "Permanent Note" vs "Meeting Note") to be instantly recognisable.
* **Navigation Synchronisation:** The graph can be **pinned** to a specific workspace pane, so it either follows the user's active navigation or drives the navigation of a secondary pane.
* **Filtering:** Users can toggle the visibility of specific node types, such as **attachments, folders, tags, or virtual nodes**, to reduce clutter.
* **Snapshot Editing:** Users can take a "snapshot" of the current graph state to create a static drawing that can be manually annotated or expanded.

### Integration with Obsidian
ExcaliBrain integrates deeply with the Obsidian ecosystem by using **Dataview as its underlying engine** to parse file metadata in real-time. It respects Obsidian’s **starred/favorite files** and displays them as "Home" entry points. It also supports **hover previews**, allowing users to see the content of a node without leaving the graph. The plugin logic is designed to be **context-aware**, automatically updating the graph whenever the active file in the editor changes.

**Analogy for Understanding:**
Building a vault without a tool like ExcaliBrain is like **navigating a dense forest by looking only at the trees directly in front of you**. ExcaliBrain acts as a **GPS and compass**, mapping out exactly which way is "up" toward your broader goals and which way is "down" into the granular details, all while highlighting the "side paths" that connect your thoughts laterally.

# ExcaliBrain Detailed Technical Specification

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Data Structures](#core-data-structures)
3. [Graph Construction & Indexing](#graph-construction--indexing)
4. [Relationship System](#relationship-system)
5. [HTTP Link Parsing](#http-link-parsing)
6. [Ontology System](#ontology-system)
7. [Ghost Nodes (Unresolved Links)](#ghost-nodes-unresolved-links)
8. [Inferred Relationships](#inferred-relationships)
9. [Node Styling & Customization](#node-styling--customization)
10. [Rendering & Layout](#rendering--layout)
11. [Scene Management & Navigation](#scene-management--navigation)

---

## Architecture Overview

### High-Level Design
ExcaliBrain functions as a graph visualization layer built on top of Obsidian's metadata cache and the Dataview plugin. The system consists of three primary tiers:

1. **Index Tier** (`Pages` class): Maintains a centralized graph of `Page` objects representing all indexable content in the vault
2. **Relationship Tier** (`Page` class): Manages neighbor relationships and applies transformation logic to determine role (parent, child, friend, etc.)
3. **Visualization Tier** (`Scene`, `Node`, `Link` classes): Renders the graph using Excalidraw's API with customizable styling

### Core Dependencies
- **Obsidian API**: File system, metadata cache, workspace management
- **DataView Plugin**: Parses YAML/inline frontmatter fields for explicit relationship definitions
- **Excalidraw Plugin**: Rendering engine, shape management, API integration

### Plugin Lifecycle
1. **Initialization** (`onload()`): Validates dependencies (Dataview, Excalidraw), registers commands, sets up event handlers
2. **Index Creation** (`createIndex()`): Waits for Dataview to complete indexing, then builds the complete graph
3. **Scene Initialization** (`Scene.initializeScene()`): Prepares Excalidraw canvas, adds initial UI elements
4. **Rendering** (`Scene.render()`): Transforms graph into visual representation based on central node selection

---

## Core Data Structures

### Page Class
The fundamental unit of the graph. Represents any indexable item in the vault.

```typescript
Page {
  path: string                          // Unique identifier (file path, "folder:...", "tag:...", or URL)
  file: TFile | null                    // Obsidian file object (null for virtual/URL nodes)
  name: string                          // Display name
  url: string | null                    // HTTP URL (non-null for URL nodes)
  isFolder: boolean                     // Directory node
  isTag: boolean                        // Tag node
  
  // Relationship management
  neighbours: Map<string, Relation>     // All connected pages with relationship metadata
  
  // Dataview integration
  dvPage: Record<string, Literal>       // Parsed Dataview metadata
  dvIndexReady: boolean                 // Flag indicating DV parsing completion
  
  // Styling
  primaryStyleTag: string               // Primary tag (from config.primaryTagField)
  styleTags: string[]                   // Additional tags for styling
  maxLabelLength: number                // Character limit for node label
  mtime: number                         // File modification time
}
```

### Relation Type
Represents a directional relationship between two pages.

```typescript
Relation {
  target: Page
  direction: LinkDirection              // TO, FROM, or BOTH
  isHidden: boolean                     // Excluded from display
  
  // Parent relationship
  isParent: boolean
  parentType: RelationType              // DEFINED or INFERRED
  parentTypeDefinition: string          // Source field name(s)
  
  // Child relationship
  isChild: boolean
  childType: RelationType
  childTypeDefinition: string
  
  // Left friend relationship (lateral, supporting)
  isLeftFriend: boolean
  leftFriendType: RelationType
  leftFriendTypeDefinition: string
  
  // Right friend relationship (challenging, opposing)
  isRightFriend: boolean
  rightFriendType: RelationType
  rightFriendTypeDefinition: string
  
  // Previous friend relationship (chronological sequencing)
  isPreviousFriend: boolean
  previousFriendType: RelationType
  previousFriendTypeDefinition: string
  
  // Next friend relationship (sequential progression)
  isNextFriend: boolean
  nextFriendType: RelationType
  nextFriendTypeDefinition: string
}
```

### RelationType Enum
```typescript
enum RelationType {
  DEFINED = 1    // Explicitly set via Dataview fields (ontology)
  INFERRED = 2   // Automatically derived from standard Obsidian links
}
```

### LinkDirection Enum
```typescript
enum LinkDirection {
  TO = 1      // Unidirectional link toward target (source → target)
  FROM = 2    // Backlink from target (target → source)
  BOTH = 3    // Bidirectional relationship (mutual links)
}
```

### Pages Class
Central index managing all Page objects.

```typescript
Pages {
  private pages: Map<string, Page>
  
  // Core operations
  add(path: string, page: Page): void
  get(path: string): Page | undefined
  delete(path: string): void
  
  // Relationship population
  addResolvedLinks(page?: Page): void           // Standard Obsidian links
  addUnresolvedLinks(page?: Page): void         // Links to non-existent files
  addPageURLs(): void                            // HTTP links from URLParser
}
```

---

## Graph Construction & Indexing

### Index Creation Process

The `createIndex()` method orchestrates the complete graph build in this order:

#### Phase 1: Structural Foundation
```
1. Wait for Dataview API readiness
2. Wait for URLParser completion
3. Add host origins as URL nodes
4. Add file system structure:
   - Root folder node
   - Recursively add folders with parent-child relationships (file-tree)
   - Add markdown files under respective folders
5. Add tag hierarchy:
   - Parse all tags from metadata cache
   - Create tag nodes (tag:parent/child/name)
   - Link parent-child tags
```

#### Phase 2: Relationship Population
```
1. addUnresolvedLinks():     Links to non-existent files
2. addResolvedLinks():        Standard wiki/markdown links (inferred)
3. addPageURLs():             HTTP links and their origins
```

#### Phase 3: Metadata Enrichment
```
1. Load starred/bookmarked files as home entry points
2. Cache lowercase paths (case-sensitivity workaround)
3. Mark index as ready
```

### Index Maintenance

The index updates reactively through multiple mechanisms:

1. **Vault Events**:
   - `vault.on('create')`: Creates new Page, adds to index
   - `vault.on('modify')`: Updates existing Page, triggers re-render
   - `vault.on('delete')`: Removes Page and cleans up neighbor references
   - `vault.on('rename')`: Updates path mappings

2. **Dataview Index Changes**:
   - Polls `DVAPI.index.importer.reloadQueue` to detect metadata changes
   - Triggers index recreation on significant changes

3. **Manual Updates**:
   - `Scene.reRender(updateIndex: true)` forces complete index rebuild

### Path Case Sensitivity Handling

Obsidian stores paths with case-sensitivity inconsistencies. ExcaliBrain maintains a lowercase path map:

```typescript
lowercasePathMap: Map<string, string>
// Maps lowercase path → proper-case path
// Used when resolving links with case mismatches
```

---

## Relationship System

### Relationship Determination Logic

The core logic in `Page` methods determines how each relationship is classified based on the relation vector:

```typescript
getRelationVector(relation: Relation) {
  return {
    pi: isParent && INFERRED,          // Parent Inferred
    pd: isParent && DEFINED,           // Parent Defined
    ci: isChild && INFERRED,           // Child Inferred
    cd: isChild && DEFINED,            // Child Defined
    lfd: isLeftFriend && DEFINED,      // Left Friend Defined
    rfd: isRightFriend && DEFINED,     // Right Friend Defined
    pfd: isPreviousFriend && DEFINED,  // Previous Friend Defined
    nfd: isNextFriend && DEFINED,      // Next Friend Defined
  }
}
```

### Role Classification Methods

Each role has specific logic for determining whether a relationship is DEFINED, INFERRED, or NULL:

#### isChild()
- **DEFINED**: Child defined AND no other explicit relationships
- **INFERRED**: Parent inferred (but no parent defined) AND child inferred
- Handles the `inferAllLinksAsFriends` mode exception

#### isParent()
- **DEFINED**: Parent defined AND no child defined
- **INFERRED**: Parent inferred with no parent/child explicitly set

#### isLeftFriend()
- **DEFINED**: Explicit left friend relationship
- **INFERRED**: 
  - Both parent AND child inferred (both directions)
  - Multiple defined relationship types (suggests lateral connection)

#### isRightFriend()
- **DEFINED**: Explicit right friend relationship only

#### isPreviousFriend() / isNextFriend()
- **DEFINED**: Explicit field only

### Multiple Relationship Handling

When a page has multiple relationship types with the same neighbor:

```typescript
relationTypeToSet(current: RelationType, new: RelationType) {
  // DEFINED always takes precedence over INFERRED
  if(current === DEFINED) return DEFINED;
  if(new === DEFINED) return DEFINED;
  return INFERRED;
}

directionToSet(current: LinkDirection, new: LinkDirection) {
  // TO/FROM merge into BOTH
  if(current === BOTH || current === new) return current;
  return BOTH;
}
```

### Relationship Addition Methods

Pages build their neighbor graph through these methods:

```typescript
addParent(page, relationType, direction, definition)
addChild(page, relationType, direction, definition)
addLeftFriend(page, relationType, direction, definition)
addRightFriend(page, relationType, direction, definition)
addPreviousFriend(page, relationType, direction, definition)
addNextFriend(page, relationType, direction, definition)
addHidden(page)  // Excluded from display
```

Each method:
1. Validates that target ≠ self or excalibrain file
2. Updates existing Relation if present
3. Creates new Relation entry if not present
4. Preserves defined relationships (doesn't downgrade to inferred)

---

## HTTP Link Parsing

### URLParser Architecture

The `URLParser` class indexes all HTTP(S) links in the vault:

```typescript
URLParser {
  fileToUrlMap: Map<TFile, FileURL[]>     // File → URLs it contains
  fileUrlInverseMap: Map<URL, FileURLData> // URL → files referencing it
  hosts: string[]                         // Unique URL origins
  initialized: boolean
}
```

### Link Extraction Process

#### Regex Patterns
```typescript
// Markdown links: [label](url)
linkRegex = /(?:\[([^[\]]+)\]\()((?:(?:ftp|https?|sftp|shttp|tftp):...)\))|...\b/gi

// Also matches common formats:
// - [label](https://example.com)
// - Direct URLs: https://example.com
// - www. prefix: www.example.com
```

#### Initialization
1. Scan all markdown files in vault
2. Extract all HTTP links using regex
3. Parse URL origin (protocol + domain)
4. Build bidirectional maps
5. Register file watch events

#### FileURL Structure
```typescript
FileURL {
  url: string       // Full URL
  alias: string     // Link text/label
  origin: string    // Protocol + domain
}
```

### URL Node Creation

During `addPageURLs()`:

1. **For each URL found**:
   - Create or reuse URL node: `new Page(path: url, url: url, name: alias)`
   - Update alias if better label found
   - Link URL as child of source file

2. **For each unique origin**:
   - Create origin node: `new Page(path: origin, url: origin)`
   - Link URL as child of origin
   - Enables hierarchical browsing of web references

### Link Update Handling

URLParser maintains index as files change:

```typescript
registerFileEvents() {
  vault.on('create', modifyEventHandler)  // Parse new files
  vault.on('modify', modifyEventHandler)  // Re-parse changed files
  vault.on('delete', deleteEventHandler)  // Remove old URLs
}
```

---

## Ontology System

### Ontology Definition

The ontology is a mapping of custom Dataview fields to relationship types:

```typescript
Hierarchy {
  hidden: string[]        // Fields to exclude from graph
  parents: string[]       // Fields indicating parent relationships
  children: string[]      // Fields indicating child relationships
  leftFriends: string[]   // Fields for lateral connections
  rightFriends: string[]  // Fields for opposing concepts
  previous: string[]      // Fields for prior sequence
  next: string[]          // Fields for subsequent sequence
  exclusions: string[]    // Meta fields to ignore (excalidraw-*)
}
```

### Default Ontology
```
Parents:      ["Parent", "Parents", "up", "u", "North", "origin", "inception"]
Children:     ["Children", "Child", "down", "d", "South", "leads to", "contributes to"]
LeftFriends:  ["Friends", "Friend", "similar", "supports", "alternatives", "advantages"]
RightFriends: ["opposes", "disadvantages", "missing", "cons"]
Previous:     ["Previous", "Prev", "West", "w", "Before"]
Next:         ["Next", "n", "East", "e", "After"]
Hidden:       ["hidden"]
```

### Field Parsing

The system is case-insensitive and normalizes spaces to hyphens:

```typescript
hierarchyLowerCase {
  parents: ["parent", "up", "north", ...],
  // etc.
}
// Used for matching against DV field names (lowercase, space→hyphen)
```

### Dataview Field Extraction

`getDVFieldLinksForPage()` extracts links from specified fields:

#### Supported Field Value Types

1. **List of Links** `[file1, file2]`:
   ```
   children:: [[file1]] [[file2]]
   parents:: [link1, link2]
   ```

2. **Single Link**:
   ```
   parent:: [[MainConcept]]
   ```

3. **String with Embedded Links**:
   ```
   related:: [[note1]] and [[note2]] are similar
   ```

4. **Dataview Link Objects**:
   ```typescript
   field.values() // Iterates link objects
   field.path     // Single link path
   ```

5. **Daily Note References**:
   ```
   timeline:: [2024-01-15, 2024-01-16]
   // Converted using daily note format settings
   ```

### Runtime Ontology Management

Users can add fields to the ontology via:

1. **Context Menu**: Right-click on a field → "Add to ExcaliBrain Ontology"
2. **Modal Dialog**: Select desired relationship type
3. **Commands**: `excalibrain-addParentField`, etc.
4. **Modal**: `AddToOntologyModal` handles persistence

Updates trigger:
```typescript
await plugin.saveSettings()        // Persist hierarchy changes
plugin.scene.vaultFileChanged = true // Flag for re-render
```

### Ontology Suggester

Real-time UI assist as users type:

```typescript
OntologySuggester {
  trigger: string                   // Default: "::"
  midSentenceTrigger: string       // Default: "("
  
  parentTrigger: "::p"
  childTrigger: "::c"
  leftFriendTrigger: "::l"
  rightFriendTrigger: "::r"
  previousTrigger: "::e"
  nextTrigger: "::n"
}
```

When typing a field name followed by trigger, suggester:
1. Provides autocompletion for field names
2. Shows relationship type hints
3. Prepends appropriate field syntax

---

## Ghost Nodes (Unresolved Links)

### Definition & Purpose

Ghost nodes represent links to files that **do not yet exist**. They enable users to:
- Visualize future structure before content creation
- Scaffold knowledge without intermediate steps
- Identify gaps in vault completeness

### Creation & Identification

#### Unresolved Link Detection

```typescript
addUnresolvedLinks(page?: Page) {
  const unresolvedLinks = app.metadataCache.unresolvedLinks
  // Maps: filePath → { linkedPath → count }
  
  Object.keys(unresolvedLinks).forEach(parentPath => {
    const parent = pages.get(parentPath)
    Object.keys(unresolvedLinks[parentPath]).forEach(childPath => {
      addUnresolvedPage(childPath, parent, plugin, pages)
    })
  })
}
```

#### Ghost Page Creation

```typescript
addUnresolvedPage(childPath: string, parent: Page, plugin, pages) {
  const ghostPage = pages.get(childPath) ?? 
    new Page(pages, childPath, null, plugin)
  
  // Link as inferred relationship
  if(plugin.settings.inferAllLinksAsFriends) {
    ghostPage.addLeftFriend(parent, INFERRED, TO)
    parent.addLeftFriend(ghostPage, INFERRED, FROM)
  } else {
    ghostPage.addParent(parent, INFERRED, TO)
    parent.addChild(ghostPage, INFERRED, FROM)
  }
  
  pages.add(childPath, ghostPage)
  return ghostPage
}
```

### Virtual Page Detection

```typescript
Page.get isVirtual() {
  return (this.file === null) && 
         !this.isFolder && 
         !this.isTag && 
         !this.isURL
}
```

### Styling

Virtual nodes have distinct styling by default:

```typescript
virtualNodeStyle: {
  backgroundColor: "#ff000066",    // Semi-transparent red
  fillStyle: "hachure",            // Hatched fill
  textColor: "#ffffffff",
  // User can customize
}
```

### Filtering

Users can toggle virtual node visibility:

```typescript
settings.showVirtualNodes: boolean
// Applied during neighbor retrieval in Scene.getNeighbors()
```

### Lifecycle

Ghost nodes persist **only while referenced**:

1. When file is created: Ghost node is replaced by real file
2. When last reference is deleted: Ghost node is removed from index

```typescript
Pages.delete(toBeDeletedPath) {
  // Unlink from all neighbors
  page.neighbours.forEach((relation, neighbourPath) => {
    const neighbour = pages.get(neighbourPath)
    neighbour.unlinkNeighbour(toBeDeletedPath)
    
    // Clean up unresolved links with no references
    if(!neighbour.file && neighbour.neighbours.size === 0) {
      pages.delete(neighbourPath)
    }
  })
}
```

---

## Inferred Relationships

### Inference Rules

Inferred relationships are derived from standard Obsidian links without explicit ontology fields.

#### Forward Link Interpretation
```
File A links to File B → Inference based on settings.inverseInfer:
  - Normal mode (false):     A → child of B
  - Inverse mode (true):     A → parent of B
```

#### Backlink Interpretation
The reverse direction of a forward link.

#### Mutual Link Handling
When A links to B AND B links to A:
```
// Standard mode
A.addLeftFriend(B, INFERRED, BOTH)  // Bidirectional lateral
B.addLeftFriend(A, INFERRED, BOTH)
```

### Inference Settings

```typescript
settings {
  inverseInfer: boolean         // Flip parent/child interpretation
  inverseArrowDirection: boolean // Flip arrow directions in visualization
  inferAllLinksAsFriends: boolean // Treat all inferred links as lateral friends
}
```

### Relationship Merging

When both inferred and defined relationships exist:

1. **Inferred-first rule**: Defined relationships always take precedence
   ```typescript
   relationTypeToSet(current, new) {
     if(current === DEFINED) return DEFINED
     if(new === DEFINED) return DEFINED
     return INFERRED
   }
   ```

2. **Bidirectional accumulation**: Multiple inference types merge
   ```
   A → B (inferred child)
   A ← B (inferred parent)
   Result: Bidirectional friend relationship
   ```

### Filtering Inferred Nodes

Users can hide inferred relationships:

```typescript
settings.showInferredNodes: boolean

// Applied in relationship retrieval:
getChildren() {
  return neighbours
    .filter(x => {
      const relationType = isChild(x)
      return (relationType && showInferredNodes) || 
             (relationType === DEFINED)
    })
}
```

---

## Node Styling & Customization

### Style Inheritance Hierarchy

Styles are applied in precedence order (later overrides earlier):

```
1. baseNodeStyle
2. [inferredNodeStyle | urlNodeStyle | virtualNodeStyle]
3. [folderNodeStyle | tagNodeStyle]
4. [centralNodeStyle | siblingNodeStyle]
5. tagNodeStyles[primaryTag]
6. Dynamically computed from metadata
```

### NodeStyle Properties

```typescript
NodeStyle {
  // Visual properties
  prefix?: string                    // Text prefix (e.g., "🌐 ")
  backgroundColor?: string           // Hex color with alpha
  textColor?: string
  borderColor?: string
  fillStyle?: FillStyle              // "solid" | "hachure" | "cross-hatch"
  
  // Typography
  fontSize?: number
  fontFamily?: number
  maxLabelLength?: number            // Character limit before "..."
  
  // Geometry
  strokeWidth?: number
  strokeStyle?: StrokeStyle          // "solid" | "dashed" | "dotted"
  roughness?: number                 // Sketch effect amount
  strokeSharpness?: StrokeRoundness  // "round" | "sharp"
  padding?: number                   // Internal padding
  
  // Gate (neighbor count indicators)
  gateRadius?: number                // Circular indicator size
  gateOffset?: number                // Distance from node
  gateStrokeColor?: string
  gateBackgroundColor?: string
  gateFillStyle?: FillStyle
  
  // Embedding
  embedWidth?: number
  embedHeight?: number
}
```

### Tag-Based Styling

Primary tag determines default style; additional tags add prefixes:

```typescript
getPrimaryTag(dvPage, settings) {
  // Check primaryTagField (default: "Note type")
  const primaryTag = dvPage[settings.primaryTagFieldLowerCase]
  const styleTags = settings.tagStyleList
  
  return [
    tags.find(t => styleTags.includes(t)) || firstTag,
    otherTags
  ]
}

getTagStyle(tags, settings) {
  const [primary, others] = tags
  let style = settings.tagNodeStyles[primary]
  
  // Combine prefixes if displayAllStylePrefixes enabled
  if(settings.displayAllStylePrefixes) {
    style.prefix = [style.prefix, otherTags.prefixes].join("")
  }
  
  return style
}
```

### Central Node Styling

Central node gets special treatment:

```typescript
// Central node combines:
baseNodeStyle +
centralNodeStyle +           // Overrides base
[inferredNodeStyle?] +       // If inferred
[tagNodeStyle?] +            // Tag-based
[specificTagStyle?]          // Tag-specific override
```

### Sibling Node Styling

Siblings in parent rows use reduced font:

```typescript
siblingNodeStyle: {
  fontSize: 15  // Smaller than central node's 30
}
```

### Node Type Specific Styles

```typescript
// Folder nodes
folderNodeStyle: {
  prefix: "📂 ",
  borderColor: "#ffd700ff",
  textColor: "#ffd700ff"
}

// Tag nodes
tagNodeStyle: {
  prefix: "#",
  borderColor: "#4682b4ff"
}

// URL nodes
urlNodeStyle: {
  prefix: "🌐 "
}

// Virtual (unresolved) nodes
virtualNodeStyle: {
  backgroundColor: "#ff000066",
  fillStyle: "hachure"
}

// Inferred relationship nodes
inferredNodeStyle: {
  backgroundColor: "#000005b3",
  textColor: "#95c7f3ff"
}

// Attachments
attachmentNodeStyle: {
  prefix: "📎 "
}
```

---

## Rendering & Layout

### Node Rendering Process

#### 1. Node Creation
```typescript
const node = new Node({
  ea: ExcalidrawAutomate,
  page: Page,
  isInferred: boolean,
  isCentral: boolean,
  isSibling: boolean,
  friendGateOnLeft: boolean
})
```

#### 2. Style Resolution
Combines applicable styles based on page type and position.

#### 3. Text Measurement
```typescript
setBaseLayoutParams() {
  const style = baseStyle + centralNodeStyle
  this.textSize = ea.measureText("m".repeat(maxLabelLength))
  this.nodeWidth = textSize.width + 2 * padding
  this.nodeHeight = 2 * (textSize.height + 2 * padding)
}
```

#### 4. Label Rendering
```typescript
renderText(): Dimensions {
  // Apply maxLabelLength truncation
  const label = displayText()  // Prefix + title, truncated
  const id = ea.addText(x, y, label, {
    wrapAt: maxLabelLength,
    textAlign: "center",
    box: true,
    boxPadding: padding
  })
  const box = ea.getElement(id)
  box.link = isURL ? url : `[[filePath]]`  // Obsidian link
  box.backgroundColor = style.backgroundColor
  // ... apply other styles
}
```

#### 5. Gate Rendering
Circular indicators showing neighbor counts:

```
        ▯ (parentGate)
        │
▯ ─── ■ ─── ▯ (friendGates)
(left)│(central)(right)
        │
        ▯ (childGate)
```

```typescript
// Parent gate (top)
parentGateId = ea.addEllipse(
  centerX - gateRadius - gateOffset,
  centerY - gateDiameter - padding - labelHeight/2,
  gateDiameter,
  gateDiameter
)

// Sibling gates (left and right)
friendGateId = ea.addEllipse(
  friendGateOnLeft ? centerX - gateDiameter - padding - labelWidth/2 : centerX + padding + labelWidth/2,
  centerY - gateRadius,
  gateDiameter,
  gateDiameter
)
```

### Layout Algorithm

#### Area Calculation
The layout positions neighborhoods in predefined areas:

```
          [PARENTS]
    
[LEFT FRIENDS]  [CENTRAL]  [RIGHT FRIENDS]
                
          [CHILDREN]
```

#### Grid Layout
Each area uses a grid layout calculated by `Layout.layout()`:

```typescript
layout(columns) {
  // Determine items per row based on total count
  const rowCount = Math.ceil(itemCount / columns)
  
  // For even items: centered distribution
  // For odd items: special odd-centered layout
  
  // Sort nodes alphabetically within area
  // Render in grid position
}
```

#### Spacing Constraints
```
compactView: boolean       // Reduces spacing
compactingFactor: number   // Multiplier (default: 1.5)
minLinkLength: number      // Minimum link distance
```

#### Full Render Cycle
```typescript
async render(retainCentralNode = false) {
  // 1. Get central page relationships
  const {parents, children, leftFriends, rightFriends, siblings} 
    = getNeighbors(centralPage)
  
  // 2. Create layout specs for each area
  const parentLayout = new Layout(parentSpec)
  const childLayout = new Layout(childSpec)
  // ... etc
  
  // 3. Add nodes to layouts
  addNodes({neighbours: parents, layout: parentLayout, ...})
  addNodes({neighbours: children, layout: childLayout, ...})
  // ... etc
  
  // 4. Render all layouts
  await parentLayout.render()
  await childLayout.render()
  // ... etc
  
  // 5. Render links between nodes
  links.render(linksToHide)
}
```

### Link Rendering

```typescript
Link.render(hide: boolean) {
  // Determine source and target gates based on role
  const gateA = getRoleGate(nodeA, roleBRole)
  const gateB = getRoleGate(nodeB, roleBRole)
  
  const linkId = ea.connectObjects(gateA, null, gateB, null, {
    startArrowHead: style.startArrowHead,
    endArrowHead: style.endArrowHead
  })
  
  // Optional label
  if(style.showLabel && hierarchyDefinition) {
    ea.addLabelToLine(linkId, hierarchyDefinition)
  }
  
  // Hide if filtered
  if(hide) {
    ea.style.opacity = 10
  }
}
```

### Link Styling

```typescript
LinkStyle {
  strokeColor?: string
  strokeWidth?: number
  strokeStyle?: StrokeStyle    // "solid" | "dashed" | "dotted"
  roughness?: number
  
  // Arrow styling
  startArrowHead?: Arrowhead
  endArrowHead?: Arrowhead
  
  // Label styling
  showLabel?: boolean
  fontSize?: number
  textColor?: string
}
```

#### Hierarchy-Based Link Styles
```typescript
hierarchyLinkStyles: {
  "parent": { strokeColor: "#...", ... },
  "children": { ... },
  "file-tree": { strokeColor: "#ffd700ff" },
  "tag-tree": { strokeColor: "#4682b4ff" }
}
```

---

## Scene Management & Navigation

### Scene Class Overview

The `Scene` class coordinates the complete visualization experience:

```typescript
Scene {
  ea: ExcalidrawAutomate
  plugin: ExcaliBrain
  leaf: WorkspaceLeaf              // Excalidraw pane
  
  centralPagePath: string          // Currently displayed node
  centralPageFile: TFile
  _centralLeaf: WorkspaceLeaf      // Adjacent pane with central file
  
  nodesMap: Map<string, Node>      // Current rendering nodes
  links: Links                     // Current rendering links
  
  toolsPanel: ToolsPanel           // Search, filters, controls
  historyPanel: HistoryPanel       // Navigation history UI
}
```

### Scene Initialization

```typescript
initialize(focusSearchAfterInitiation: boolean) {
  initializeScene()  // Prepare Excalidraw canvas
  // - Clear existing elements
  // - Set view mode
  // - Disable mobile
  // - Register event handlers
  // - Show welcome message
}
```

### Rendering Trigger Points

#### Manual Triggers
- User clicks node or search result
- User navigates to different file in editor

#### Automatic Triggers
- Active file in editor changes (via `activeLeafChange` event)
- Vault file modified (via `metadataCache.changed` event)
- Settings changed

#### Debouncing
```typescript
blockUpdateTimer: boolean
disregardLeafChangeTimer: NodeJS.Timeout

// Prevents multiple renders during rapid file changes
```

### Navigation Modes

#### Auto-Follow Mode (Default)
- Central graph follows currently active editor
- Updates whenever user switches files
- Respects `pinLeaf` setting

#### Pinned Mode
- Central graph stays on selected file
- Editor navigation doesn't affect graph
- User can explore relationships independently

#### Synchronization
```typescript
centralLeaf: WorkspaceLeaf  // Synced editor pane

// When pinned:
// Graph changes → central file opens in adjacent pane
// User can read content without losing graph context
```

### Auto-Opening Central Document

```typescript
settings.autoOpenCentralDocument: boolean

// When enabled:
// - Opening graph from search creates/reveals central document pane
// - Maintains cognitive focus on current concept
// - Can be toggled per-render
```

### Snapshot & Editing

Users can create static Excalidraw drawings from graph snapshots:

```
Graph View → "Take Snapshot" → Static Drawing
            → Edit/Annotate
            → Save as separate file
```

### Event Handlers

The scene registers multiple event types:

```typescript
registerEvent(
  app.workspace.on('active-leaf-change', handleLeafChange)
)

registerEvent(
  app.metadataCache.on('changed', handleFileChange)
)

registerEvent(
  app.vault.on('create', handleFileCreate)
)

// Dataview index change detection
// Settings change detection
// Plugin enable/disable
```

### Starred/Bookmarked Home Entry Points

The plugin integrates with Obsidian's bookmarks:

```typescript
// During index creation:
const bookmarks = bookmarksPlugin.instance.items
const starred = groupElements(bookmarks)  // Recursive extraction

// Starred files become quick-access entry points
// Users can click to navigate to any bookmarked location
```

---

## Summary of Integration Points

### Key Flows

1. **File Creation**:
   Vault event → Index update → New ghost nodes auto-populate

2. **Link Addition**:
   Markdown link detected → Unresolved link → Ghost node → File creation → Node resolves

3. **Ontology Field Addition**:
   User types field → Suggester prompts → User selects role → Settings saved → Re-render

4. **Central Node Change**:
   User selects file → Scene renders neighbors → Layout positions nodes → Links drawn

5. **Filtering**:
   User toggles setting → Scene re-renders → Filter applied during neighbor retrieval

### Reconciliation of Relationship Types

When ExcaliBrain processes relationships, it reconciles:
- **File hierarchy** (folders)
- **Tag hierarchy** (tag-tree)
- **Explicit ontology** (Dataview fields → DEFINED)
- **Inferred links** (Standard Obsidian links → INFERRED)
- **HTTP links** (URLParser → INFERRED)

All are unified in the `Relation` structure, allowing sophisticated querying and filtering.

### Performance Considerations

- **Lazy evaluation**: DV fields parsed only when page is viewed (`dvIndexReady` flag)
- **Neighbor filtering**: Applied during retrieval, not at storage
- **Link deduplication**: Map-based storage prevents duplicates
- **Case-sensitivity handling**: Lowercase map lookup for cross-platform consistency
- **Debounced rendering**: Multiple rapid changes coalesce into single render

