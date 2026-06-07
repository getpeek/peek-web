"use client";

import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode } from "./AgentNode/AgentNode";
import { QueryNode } from "./QueryNode/QueryNode";
import { ResultNode } from "./ResultNode/ResultNode";
import { ChartNode } from "./ChartNode/ChartNode";
import { VariableNode } from "./VariableNode/VariableNode";
import { CollabOverlay } from "./RemoteCursor/CollabOverlay";
import { Toolbar } from "./Toolbar/Toolbar";
import { FloatingEdge } from "./FloatingEdge";
import { useDemoFlow } from "./useDemoFlow";
import { ANNA } from "./data";
import styles from "./DemoCanvas.module.css";

const nodeTypes = {
  agent: AgentNode,
  query: QueryNode,
  result: ResultNode,
  chart: ChartNode,
  variable: VariableNode,
};
const edgeTypes = { floating: FloatingEdge };

const FIT_VIEW_OPTIONS = { padding: 0.4, maxZoom: 1 };

export function DemoCanvas() {
  return (
    <section className={styles.section}>
      <div className={styles.stage}>
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
    </section>
  );
}

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, reset, collabJoined, cursor } = useDemoFlow();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      minZoom={0.4}
      maxZoom={1.8}
      panOnScroll
      zoomOnScroll={false}
      zoomOnPinch
      zoomOnDoubleClick={false}
      nodesConnectable={false}
      nodesDraggable
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={28}
        size={1}
        color='rgba(255, 255, 255, 0.07)'
        bgColor='transparent'
      />
      <CollabOverlay cursor={cursor} />
      <CanvasChrome onReset={reset} collabJoined={collabJoined} />
    </ReactFlow>
  );
}

function CanvasChrome({ onReset, collabJoined }: { onReset: () => void; collabJoined: boolean }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const recenter = () => fitView({ ...FIT_VIEW_OPTIONS, duration: 500 });

  return (
    <>
      <Panel position='top-right'>
        <div className={styles.tabCluster}>
          {collabJoined ? (
            <span
              className={styles.avatar}
              style={{ background: "var(--pk-collab-anna)" }}
              aria-label={`${ANNA.name} (guest)`}
              title={`${ANNA.name} · guest`}
            >
              {ANNA.initials}
            </span>
          ) : null}
          <div className={styles.canvasTab}>
            <span className={styles.liveDot} />
            <span className={styles.conn}>analytics_db</span>
            <span className={styles.sub}>· postgres</span>
          </div>
        </div>
      </Panel>

      <Panel position='top-left'>
        <button type='button' className={styles.resetBtn} onClick={onReset}>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2.2}
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M3 12a9 9 0 1 0 3-6.7L3 8' />
            <path d='M3 3v5h5' />
          </svg>
          Reset
        </button>
      </Panel>

      <Panel position='bottom-left'>
        <div className={styles.zoomCluster}>
          <button type='button' onClick={() => zoomOut()} aria-label='Zoom out'>
            −
          </button>
          <span className={styles.lvl}>{Math.round(zoom * 100)}%</span>
          <button type='button' onClick={() => zoomIn()} aria-label='Zoom in'>
            +
          </button>
          <button type='button' onClick={recenter} aria-label='Fit view'>
            <svg
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4' />
            </svg>
          </button>
        </div>
      </Panel>

      <Panel position='bottom-right'>
        <div className={styles.panHint}>drag to pan · scroll to zoom</div>
      </Panel>

      <Toolbar />
    </>
  );
}
