import { NodeProps, NodeResizer } from "@xyflow/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconChartArea, IconChartBar, IconChartLine } from "@tabler/icons-react";
import { HiddenHandles } from "../HiddenHandles";
import { NodeHeader } from "../NodeHeader";
import { NodeIndicator } from "../NodeIndicator";
import { Tooltip } from "../../../components/Tooltip/Tooltip";
import { useCanvas } from "../../hooks/useCanvas";
import type { BarChartData, BarChartNode as BarChartNodeT, ChartType } from "../../types";
import "./BarChart.css";

const DEFAULT_W = 460;
const DEFAULT_H = 290;

const seriesColors = [
  "var(--pk-accent)",
  "var(--pk-blue)",
  "var(--pk-green)",
  "var(--pk-yellow)",
  "var(--pk-red)",
];

const CHART_TYPE_OPTIONS: {
  type: ChartType;
  label: string;
  Icon: typeof IconChartBar;
}[] = [
  { type: "bar", label: "Bar", Icon: IconChartBar },
  { type: "line", label: "Line", Icon: IconChartLine },
  { type: "area", label: "Area", Icon: IconChartArea },
];

const AXIS_TICK = { fontSize: 11, fill: "var(--pk-fg-subtle)" };
const AXIS_LINE = { stroke: "var(--pk-node-border)" };
const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: -12 };

export function BarChartNode({ id, data, selected, width, height }: NodeProps<BarChartNodeT>) {
  const canvas = useCanvas();
  const w = width ?? DEFAULT_W;
  const h = height ?? DEFAULT_H;
  const chartType: ChartType = data.chartType ?? "bar";

  const setChartType = (next: ChartType) => {
    if (next === chartType) {
      return;
    }
    canvas.updateNodeData<BarChartData>(id, { chartType: next });
  };

  if (data.data.length === 0) {
    return (
      <>
        <NodeResizer isVisible={!!selected} minWidth={300} minHeight={200} />
        <HiddenHandles />
        <div className={`app-node ${selected ? "selected" : ""}`} style={{ width: w, height: h }}>
          <NodeHeader nodeId={id} name='empty' indicator={<NodeIndicator kind='barchart' />} />
          <div className='chart-body'>No results</div>
        </div>
      </>
    );
  }

  const [dataKey] = Object.entries(data.data[0]).find(([, value]) => typeof value === "string") ?? [
    "name",
  ];

  const series = Object.entries(data.data[0])
    .filter(([key, value]) => typeof value === "number" && key !== "id" && !key.endsWith("_id"))
    .map(([key], i) => ({
      name: key,
      color: seriesColors[i % seriesColors.length],
    }));

  const seriesName = series[0]?.name ?? "value";

  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={300} minHeight={200} />
      <HiddenHandles />
      <div className={`app-node ${selected ? "selected" : ""}`} style={{ width: w, height: h }}>
        <NodeHeader
          nodeId={id}
          name={`${seriesName} by ${dataKey}`}
          indicator={<NodeIndicator kind='barchart' />}
        />
        <div className='chart-body nodrag'>
          <div className='chart-title'>
            <span>{seriesName}</span>
            <div className='chart-type-toggle'>
              {CHART_TYPE_OPTIONS.map(({ type, label, Icon }) => (
                <Tooltip key={type} label={label}>
                  <button
                    type='button'
                    className={`chart-type-btn ${chartType === type ? "active" : ""}`}
                    onClick={() => setChartType(type)}
                  >
                    <Icon size={14} />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
          <div className='chart-sub'>
            by {dataKey} · {data.data.length} points
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width='100%' height='100%'>
              {chartType === "bar" ? (
                <BarChart data={data.data} margin={CHART_MARGIN}>
                  <CartesianGrid
                    vertical={false}
                    stroke='var(--pk-node-border)'
                    strokeDasharray='3 3'
                  />
                  <XAxis dataKey={dataKey} tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                  <YAxis tick={AXIS_TICK} tickLine={AXIS_LINE} axisLine={false} width={40} />
                  <RechartsTooltip cursor={{ fill: "var(--pk-node-bg-2)" }} />
                  {series.map(s => (
                    <Bar key={s.name} dataKey={s.name} fill={s.color} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={data.data} margin={CHART_MARGIN}>
                  <CartesianGrid
                    vertical={false}
                    stroke='var(--pk-node-border)'
                    strokeDasharray='3 3'
                  />
                  <XAxis dataKey={dataKey} tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                  <YAxis tick={AXIS_TICK} tickLine={AXIS_LINE} axisLine={false} width={40} />
                  <RechartsTooltip />
                  {series.map(s => (
                    <Line
                      key={s.name}
                      type='monotone'
                      dataKey={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={data.data} margin={CHART_MARGIN}>
                  <CartesianGrid
                    vertical={false}
                    stroke='var(--pk-node-border)'
                    strokeDasharray='3 3'
                  />
                  <XAxis dataKey={dataKey} tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                  <YAxis tick={AXIS_TICK} tickLine={AXIS_LINE} axisLine={false} width={40} />
                  <RechartsTooltip />
                  {series.map(s => (
                    <Area
                      key={s.name}
                      type='monotone'
                      dataKey={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={s.color}
                      fillOpacity={0.18}
                      dot={false}
                    />
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
