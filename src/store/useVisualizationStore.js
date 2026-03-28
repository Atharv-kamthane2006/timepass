import { create } from "zustand"

export const useVisualizationStore = create((set, get) => ({
  tables: [],
  relationships: [],
  selectedNode: null,
  queriedTables: [],
  visualMode: "default", // default | quality | ai-query
  viewMode: "3d", // 3d | 2d | analytics
  loading: false,
  error: "",

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setViewMode: (viewMode) => set({ viewMode }),
  setVisualMode: (visualMode) => set({ visualMode }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),

  setGraphData: ({ tables, relationships }) =>
    set({
      tables: Array.isArray(tables) ? tables : [],
      relationships: Array.isArray(relationships) ? relationships : [],
    }),

  highlightQueriedTables: (tableIds) => {
    if (!Array.isArray(tableIds) || tableIds.length === 0) return

    const normalized = tableIds.map((t) => String(t).toLowerCase())
    set({ visualMode: "ai-query", queriedTables: normalized })

    setTimeout(() => {
      if (get().visualMode === "ai-query") {
        set({ visualMode: "default", queriedTables: [] })
      }
    }, 5000)
  },

  resetVisualization: () =>
    set({
      tables: [],
      relationships: [],
      selectedNode: null,
      queriedTables: [],
      visualMode: "default",
      viewMode: "3d",
      loading: false,
      error: "",
    }),
}))
