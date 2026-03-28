import { useMemo, useRef, useEffect } from "react"
import ForceGraph3D from "react-force-graph-3d"
import { useVisualizationStore } from "../store/useVisualizationStore"

function getTableColor(tableName) {
  const colors = [
      '#6366f1', '#3b82f6', '#10b981',
      '#f59e0b', '#06b6d4', '#ec4899',
      '#8b5cf6', '#14b8a6', '#f43f5e',
      '#84cc16', '#eab308'
  ]
  const idx = String(tableName || '').charCodeAt(0) % colors.length
  return colors[idx >= 0 ? idx : 0]
}

function getQualityColor(score) {
  if (score >= 85) return "#22c55e"
  if (score >= 60) return "#f59e0b"
  return "#ef4444"
}

export default function DBViz3D() {
  const fgRef = useRef(null)
  const { tables, relationships, setSelectedNode, visualMode, queriedTables } = useVisualizationStore()

  const graphData = useMemo(() => {
    const nodes = (tables || []).map((t, idx) => ({
      id: String(t.id || t.name),
      name: String(t.name),
      rows: t.rows,
      columns: t.columns,
      qualityScore: t.qualityScore,
      group: t.group,
      val: Math.max(Math.cbrt(t.rows || 1) * 0.5, 2),
      idx,
    }))

    const nodeIds = new Set(nodes.map(n => n.id))

    // Fallbacks to handle slightly messy backend strings
    const resolveId = (idString) => {
       const cleaned = String(idString || '').trim()
       return cleaned
    }

    const links = (relationships || [])
      .map((r) => {
        const strictSrc = resolveId(r.source)
        const strictTgt = resolveId(r.target)
        return {
          source: strictSrc,
          target: strictTgt,
          type: r.type || 'explicit',
          label: r.sourceCol + ' -> ' + r.targetCol,
        }
      })
      .filter((l) => {
         const valid = nodeIds.has(l.source) && nodeIds.has(l.target);
         if (!valid) {
             console.warn("DBViz3D Dropping link due to missing node:", l.source, "->", l.target);
         }
         return valid;
      })

    return { nodes, links }
  }, [tables, relationships])

  useEffect(() => {
    if (!fgRef.current) return
    const timer = setTimeout(() => {
      fgRef.current?.d3Force("charge")?.strength(-300)
      fgRef.current?.d3Force("link")?.distance(140)
    }, 10)
    
    return () => {
      clearTimeout(timer)
    }
  }, [graphData])

  const nodeColor = (node) => {
    const nodeId = String(node.id || "").toLowerCase()
    const queried = queriedTables.includes(nodeId)

    if (visualMode === "quality") return getQualityColor(node.qualityScore || 0)
    if (visualMode === "ai-query" && queried) return "#fbbf24" // Brighter amber for query focus

    return getTableColor(node.name)
  }

  return (
    <div className="absolute inset-0">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        cooldownTicks={90}
        nodeColor={nodeColor}
        nodeVal={(n) => {
          const queried = queriedTables.includes(String(n.id || "").toLowerCase())
          return queried && visualMode === "ai-query" ? n.val * 2.5 : n.val * 2
        }}
        nodeResolution={32}
        nodeOpacity={1}
        linkOpacity={0.65}
        nodeLabel={(node) => {
          const quality = Math.round(node.qualityScore || 0)
          return "<div style=\"padding:8px;background:#111827;border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#f8fafc;font-family:Inter,sans-serif\"><b>" + node.name + "</b><br/>Rows: " + (node.rows || 0).toLocaleString() + "<br/>Quality: " + quality + "%</div>"
        }}
        linkColor={(link) => 
            link.type === 'implicit' 
            ? 'rgba(148, 163, 184, 0.4)' 
            : 'rgba(56, 189, 248, 0.75)' // More vibrant light blue for explicit links
        }
        linkWidth={(link) => (link.type === 'implicit' ? 1.5 : 2.5)}
        linkDirectionalParticles={(link) => (link.type === 'implicit' ? 2 : 5)}
        linkDirectionalParticleWidth={(link) => (link.type === 'implicit' ? 1.5 : 3.5)}
        linkDirectionalParticleResolution={16}
        linkDirectionalParticleSpeed={(link) => (link.type === 'implicit' ? 0.005 : 0.015)}
        linkDirectionalParticleColor={(link) => 
            link.type === 'implicit' ? '#cbd5e1' : '#38bdf8'
        }
        onNodeClick={(node) => {
          const picked = tables.find((t) => t.id === node.id)
          if (picked) setSelectedNode(picked)

          const distance = 130
          const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1)
          fgRef.current?.cameraPosition(
            { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
            node,
            800
          )
        }}
      />
    </div>
  )
}
