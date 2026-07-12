"use client";

// The guest canvas, rebuilt on the desktop ReactFlowCanvas template. Web
// differences: interaction is gated until the initial sync lands, pages get a
// tab strip (no desktop title bar), the camera fits synced content once, and
// cursor/presence broadcasting rides the wasm session.

import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./canvas/ReactFlowCanvas.css";
import "./canvas/nodes/node.css";
import "./canvas/nodes/theme/midnight.css";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { uiVisibilityAtom } from "./state";
import {
  cameraLockedAtom,
  edgesAtom,
  nodesAtom,
  placeModeAtom,
  viewportAtom,
} from "./canvas/state";
import { CanvasApiPublisher } from "./canvas/CanvasApiPublisher";
import { AgentNode } from "./canvas/nodes/Agent/AgentNode";
import { DrawNode } from "./canvas/nodes/Draw/DrawNode";
import { LiveStroke } from "./canvas/nodes/Draw/LiveStroke";
import { BarChartNode } from "./canvas/nodes/BarChart/BarChartNode";
import { TableDefinitionNode } from "./canvas/nodes/TableDefinition/TableDefinitionNode";
import { QueryErrorNode } from "./canvas/nodes/QueryError/QueryErrorNode";
import { QueryNode } from "./canvas/nodes/Query/QueryNode";
import { ResultNode } from "./canvas/nodes/Result/ResultNode";
import { ResultInsertFormNode } from "./canvas/nodes/ResultInsertForm/ResultInsertFormNode";
import { TextNode } from "./canvas/nodes/Text/TextNode";
import { VariableNode } from "./canvas/nodes/Variable/VariableNode";
import { RegionHalos } from "./canvas/wayfinding/RegionHalos";
import { WayfindingLayer } from "./canvas/wayfinding/WayfindingLayer";
import { HideUiDot } from "./canvas/ui/HideUiDot";
import { Toolbar } from "./canvas/ui/Toolbar";
import { ZoomIndicator } from "./canvas/ui/ZoomIndicator";
import { PeekKeyboardShortcuts } from "./canvas/ui/KeyboardShortcuts";
import { RemoteCursorsLayer } from "./multiplayer/RemoteCursorsLayer";
import { useGuestCursorBroadcast } from "./multiplayer/useGuestCursorBroadcast";
import { guestStatusAtom } from "./multiplayer/state";
import type { AppEdge, AppNode, AppNodeType } from "./canvas/types";
import { useCanvas } from "./canvas/hooks/useCanvas";
import { useDrawTool } from "./canvas/hooks/useDrawTool";
import { useInteractionState } from "./canvas/hooks/useInteractionState";
import { useMetaKeyHeld } from "./canvas/hooks/useMetaKeyHeld";
import { useNodeEntryAnimation } from "./canvas/hooks/useNodeEntryAnimation";
import { usePlaceTool } from "./canvas/hooks/usePlaceTool";
import { useRubberBandSelect } from "./canvas/hooks/useRubberBandSelect";
import { useSelectionHighlight } from "./canvas/hooks/useSelectionHighlight";
import { useViewportSync } from "./canvas/hooks/useViewportSync";
import { useZoomVariable } from "./canvas/hooks/useZoomVariable";
import { LassoOverlay } from "./canvas/LassoOverlay";
import { useConnectionDragHighlight } from "./canvas/hooks/useConnectionDragHighlight";
import { FloatingEdge } from "./canvas/edges/FloatingEdge";
import { MonacoManager } from "./canvas/nodes/Query/Editor/MonacoManager";
import { PageTabs } from "./PageTabs";
import { useGuestAutoFit } from "./useGuestAutoFit";
import styles from "./JoinCanvas.module.css";

const nodeTypes = {
  query: QueryNode,
  result: ResultNode,
  "result-insert-form": ResultInsertFormNode,
  agent: AgentNode,
  barchart: BarChartNode,
  "query-error": QueryErrorNode,
  "table-definition": TableDefinitionNode,
  text: TextNode,
  variable: VariableNode,
  draw: DrawNode,
};

const edgeTypes = { floating: FloatingEdge };

const defaultEdgeOptions = { type: "floating" };

const VARIABLE_CONNECTION_TARGETS: AppNodeType[] = ["query", "result", "result-insert-form"];

export function JoinCanvas() {
  return (
    <ReactFlowProvider>
      <JoinCanvasInner />
    </ReactFlowProvider>
  );
}

function JoinCanvasInner() {
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const viewport = useAtomValue(viewportAtom);
  const setViewport = useSetAtom(viewportAtom);
  const placeMode = useAtomValue(placeModeAtom);
  const uiVisible = useAtomValue(uiVisibilityAtom);
  const cameraLocked = useAtomValue(cameraLockedAtom);
  const status = useAtomValue(guestStatusAtom);
  const live = status === "live" || status === "disconnected";
  const rf = useReactFlow<AppNode, AppEdge>();
  const canvas = useCanvas();
  const interaction = useInteractionState();

  useViewportSync();
  const { livePoints, strokeWidth: drawStrokeWidth, color: drawColor } = useDrawTool();
  usePlaceTool();
  const { rectRef: selectionRectRef } = useRubberBandSelect();
  useZoomVariable();
  useGuestCursorBroadcast();
  useGuestAutoFit(live);
  const metaHeld = useMetaKeyHeld();

  const onNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) => {
      if (changes.some(c => c.type === "dimensions" && c.resizing)) {
        interaction.begin();
        interaction.endDebounced();
      }
      setNodes(ns => applyNodeChanges(changes, ns));
    },
    [setNodes, interaction],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<AppEdge>[]) => {
      setEdges(es => applyEdgeChanges(changes, es));
    },
    [setEdges],
  );

  const isValidConnection = useCallback<IsValidConnection<AppEdge>>(
    connection => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return false;
      }
      const source = rf.getNode(connection.source);
      const target = rf.getNode(connection.target);
      if (!source || !target) {
        return false;
      }
      if (source.type === "variable" && VARIABLE_CONNECTION_TARGETS.includes(target.type)) {
        return true;
      }
      if (source.type === "result" && target.type === "agent") {
        return true;
      }
      return false;
    },
    [rf],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !isValidConnection(c)) {
        return;
      }
      canvas.connect(c.source, c.target);
    },
    [canvas, isValidConnection],
  );

  const connectionDrag = useConnectionDragHighlight();

  const enteringNodes = useNodeEntryAnimation(nodes);
  const { styledNodes, styledEdges } = useSelectionHighlight(enteringNodes, edges);

  // Node drags flip `data-interacting` too, so heavy bodies freeze while moving.
  const onNodeDragStart = useCallback(() => interaction.begin(), [interaction]);
  const onNodeDragStop = useCallback(() => interaction.endDebounced(), [interaction]);

  return (
    <div className={styles.canvas}>
      <PageTabs />
      <ReactFlow<AppNode, AppEdge>
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={connectionDrag.onConnectStart}
        onConnectEnd={connectionDrag.onConnectEnd}
        isValidConnection={isValidConnection}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onMoveStart={interaction.begin}
        onMoveEnd={(_, vp) => {
          setViewport(vp);
          interaction.endDebounced();
        }}
        defaultViewport={viewport}
        colorMode={"dark"}
        deleteKeyCode={live ? ["Backspace", "Delete"] : null}
        multiSelectionKeyCode='Shift'
        onlyRenderVisibleElements
        selectionKeyCode={null}
        selectionOnDrag={false}
        noDragClassName={metaHeld ? "nodrag-disabled" : "nodrag"}
        nodesDraggable={placeMode === null && live}
        nodesConnectable={live}
        elementsSelectable={placeMode === null && live}
        selectionMode={SelectionMode.Partial}
        panOnDrag={cameraLocked ? false : [1, 2]}
        panOnScroll={!cameraLocked}
        zoomOnScroll={false}
        zoomOnPinch={!cameraLocked}
        zoomOnDoubleClick={false}
        panActivationKeyCode={cameraLocked ? null : "Space"}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={4}
        className={
          [
            placeMode === "draw"
              ? "place-mode-active draw-mode-active"
              : placeMode
                ? "place-mode-active"
                : "",
            connectionDrag.sourceHint ?? "",
            connectionDrag.connecting ? "connecting" : "",
            metaHeld ? "drag-anywhere" : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
      >
        <Background
          variant={BackgroundVariant.Dots}
          bgColor='transparent'
          color='rgba(255, 255, 255, 0.18)'
          gap={28}
          size={1}
        />
        {uiVisible && live && <Toolbar />}
        {uiVisible && <ZoomIndicator />}
        <RegionHalos />
        <WayfindingLayer />
        {!uiVisible && <HideUiDot />}
        <RemoteCursorsLayer />
      </ReactFlow>
      <LiveStroke
        points={livePoints}
        strokeWidth={drawStrokeWidth}
        color={drawColor}
        zoom={rf.getViewport().zoom}
      />
      <div ref={selectionRectRef} className='rubber-band-rect' />
      <LassoOverlay />
      <CanvasApiPublisher />
      <PeekKeyboardShortcuts />
      <MonacoManager />
    </div>
  );
}
