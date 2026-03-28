import React, { useEffect, useRef, useMemo } from 'react';
import mermaid from 'mermaid';
import { useVisualizationStore } from '../store/useVisualizationStore';

const toEntityName = (name) => String(name || '').replace(/[^a-zA-Z0-9_]/g, '_');
const cleanLabel = (value) => String(value || 'relates_to').replace(/"/g, "'").replace(/\n/g, ' ').trim();

const MermaidER = ({ erDefinition }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        darkMode: true,
        background: '#080c14',
        primaryColor: '#111827',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#94a3b8',
        tertiaryColor: '#0d1220',
      },
      er: {
        useMaxWidth: true,
      },
    });
  }, []);

  useEffect(() => {
    if (erDefinition && containerRef.current) {
      const renderId = `er-diagram-svg-${Date.now()}`;
      mermaid.render(renderId, erDefinition).then((result) => {
        containerRef.current.innerHTML = result.svg;
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.maxWidth = '100%';
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
      }).catch(err => {
        console.error("Mermaid parsing error: ", err);
        containerRef.current.innerHTML = '<div class="text-xs text-[var(--warning)]">Unable to render ER diagram from current relationship payload.</div>';
      });
    }
  }, [erDefinition]);

  return <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4" />;
};

export default function ERDiagram2D() {
  const { tables, relationships } = useVisualizationStore();

  const erDiagramString = useMemo(() => {
    let definition = 'erDiagram\n';

    // Output all tables with their columns (especially PKs/FKs)
    tables.forEach(table => {
      const entityName = toEntityName(table.id || table.name);
      definition += `  ${entityName} {\n`;
      (table.columns || []).forEach(col => {
        const type = String(col.type || 'string').replace(/[^a-zA-Z0-9_]/g, '');
        const colName = String(col.name || '').replace(/[^a-zA-Z0-9_]/g, '');
        let keys = '';
        if (col.is_pk || col.is_primary_key) keys += ' PK';
        if (col.is_fk || col.is_foreign_key) keys += ' FK';
        definition += `    ${type} ${colName}${keys}\n`;
      });
      definition += `  }\n`;
    });

    // Output all relationships
    relationships.forEach(rel => {
      const source = toEntityName(rel.source);
      const target = toEntityName(rel.target);
      if (!source || !target) return;
      
      // Determine cardinality based on prompt logic if provided by backend,
      // fallback to basic if not present.
      let operatorLeft = '||';
      let operatorRight = 'o{';
      
      if (rel.cardinality === 'one_to_one') {
        operatorLeft = '||'; operatorRight = '||';
      } else if (rel.cardinality === 'many_to_many') {
        operatorLeft = '}o'; operatorRight = 'o{';
      } else {
        // default one to many: one source contains many targets
        operatorLeft = '||'; operatorRight = 'o{';
      }

      const label = cleanLabel(rel.label || rel.sourceCol || rel.targetCol || 'relates_to');
      // Mermaid ER syntax: Entity1 ||--o{ Entity2 : "Label"
      // If we only have explicit relationship:
      definition += `  ${source} ${operatorLeft}--${operatorRight} ${target} : "${label}"\n`;
    });

    return definition;
  }, [tables, relationships]);

  return (
    <div className="absolute inset-0 z-0 overflow-auto p-3 pt-16">
      {relationships.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="max-w-md rounded-[var(--radius-md)] border border-[rgba(245,158,11,0.35)] bg-[var(--warning-dim)] px-4 py-3 text-center text-sm text-[var(--warning)]">
            No relationships were returned by backend for current upload. Re-upload all related CSVs and reload.
          </div>
        </div>
      ) : (
        <MermaidER erDefinition={erDiagramString} />
      )}
    </div>
  );
}
