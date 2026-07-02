// ============================================================================
// ARCHITECTURE DATA — the buildouts the canvas (architecture.html) renders.
// REPO-AGNOSTIC schema (the renderer knows nothing about your app).
//
//   buildout: { name, description, groups: [Group] }
//   Group:    { id, label, nodes: [Node] }   — an ordered LANE (left → right);
//                                              nodes stack top → bottom.
//   Node: {
//     id:     string                — unique within the buildout
//     kind:   "surface" | "engine" | "store" | "inlet" | "external" | "job"
//     label:  string                — one line (truncates; full text in panel)
//     sub?:   string                — one quiet line
//     refs?:  string[]              — file paths / routes (detail panel)
//     targets?: [ id | { id, label } ]  — edges auto-generate from these
//   }
//
// LAYOUT IS COMPUTED — no positions in data. The renderer lays groups out as
// equal-height lanes on a fixed grid, picks entry/exit sides automatically,
// and centers each lane.
//
// THIS IS A SEED. Replace these nodes with YOUR app's real architecture and
// keep it current as the system moves — it's the "Architecture" tab, the one
// living map. Add a buildout per subsystem when one view gets too dense.
// ============================================================================

export const ARCHITECTURES = [
  {
    name: "System overview",
    description: "Replace with one line on how your app flows, left to right.",
    groups: [
      { id: "inlets", label: "Inlets", nodes: [
        { id: "ui",  kind: "surface", label: "Web UI", sub: "where users act", refs: ["app/"], targets: ["api"] },
        { id: "cli", kind: "inlet",   label: "CLI / jobs", sub: "scheduled + manual", targets: ["api"] },
      ]},
      { id: "core", label: "Core", nodes: [
        { id: "api",    kind: "engine", label: "API / server", sub: "the one engine", refs: ["server/"], targets: ["db", "ext"] },
        { id: "worker", kind: "job",    label: "Background worker", sub: "async work", targets: ["db"] },
      ]},
      { id: "data", label: "Data + external", nodes: [
        { id: "db",  kind: "store",    label: "Database", sub: "source of truth", refs: ["db/schema"] },
        { id: "ext", kind: "external", label: "Third-party API", sub: "external dependency" },
      ]},
    ],
  },
];
