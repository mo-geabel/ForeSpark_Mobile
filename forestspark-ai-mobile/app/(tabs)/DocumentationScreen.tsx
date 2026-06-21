import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  BrainCircuit,
  Database,
  TriangleAlert,
  Zap,
  Cpu,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// ─── Data ────────────────────────────────
const trainingMetrics = [
  { epoch: "1", trainAcc: 96.5, valAcc: 97.9, trainLoss: 0.092, valLoss: 0.059 },
  { epoch: "2", trainAcc: 98.2, valAcc: 98.6, trainLoss: 0.046, valLoss: 0.040 },
  { epoch: "3", trainAcc: 98.8, valAcc: 99.1, trainLoss: 0.030, valLoss: 0.026 },
  { epoch: "4", trainAcc: 99.0, valAcc: 99.1, trainLoss: 0.026, valLoss: 0.027 },
  { epoch: "5", trainAcc: 99.1, valAcc: 99.1, trainLoss: 0.023, valLoss: 0.028 },
  { epoch: "6", trainAcc: 99.4, valAcc: 98.95, trainLoss: 0.018, valLoss: 0.024 },
  { epoch: "7", trainAcc: 99.45, valAcc: 99.3, trainLoss: 0.015, valLoss: 0.021 },
  { epoch: "8", trainAcc: 99.55, valAcc: 99.4, trainLoss: 0.012, valLoss: 0.019 },
  { epoch: "9", trainAcc: 99.65, valAcc: 99.35, trainLoss: 0.011, valLoss: 0.020 },
  { epoch: "10", trainAcc: 99.65, valAcc: 99.3, trainLoss: 0.011, valLoss: 0.021 },
];

const performanceMetrics = [
  { name: "Accuracy",  value: 99.46, color: "#10b981" },
  { name: "Precision", value: 99.57, color: "#3b82f6" },
  { name: "Recall",    value: 99.45, color: "#f59e0b" },
  { name: "F1-Score",  value: 99.51, color: "#ef4444" },
];

const gridWeights = [
  { label: "Corner", weight: "5%",  type: "corner" },
  { label: "Edge",   weight: "10%", type: "edge" },
  { label: "Corner", weight: "5%",  type: "corner" },
  { label: "Edge",   weight: "10%", type: "edge" },
  { label: "CENTER", weight: "40%", type: "center" },
  { label: "Edge",   weight: "10%", type: "edge" },
  { label: "Corner", weight: "5%",  type: "corner" },
  { label: "Edge",   weight: "10%", type: "edge" },
  { label: "Corner", weight: "5%",  type: "corner" },
];

const CELL = (width - 48 - 8) / 3;

// ─── Sparkline bar ───────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const chartH = 48;
  return (
    <View style={{ height: chartH, flexDirection: "row", alignItems: "flex-end", gap: 3, marginVertical: 6 }}>
      {data.map((v, i) => {
        const pct = max === min ? 1 : (v - min) / (max - min);
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: Math.max(4, pct * chartH),
              backgroundColor: color,
              borderRadius: 3,
              opacity: 0.55 + 0.45 * pct,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Collapsible section ─────────────────
function Section({
  title,
  icon,
  accent,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.sectionHeader, { borderLeftColor: accent }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.75}
      >
        <View style={[styles.sectionIconBox, { backgroundColor: accent + "20" }]}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={{ marginLeft: "auto" }}>
          {open
            ? <ChevronDown size={18} color="#94a3b8" />
            : <ChevronRight size={18} color="#94a3b8" />}
        </View>
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// ─── Metric row ──────────────────────────
function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────
export default function DocumentationScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <BrainCircuit size={14} color="#059669" />
            <Text style={styles.heroBadgeText}>MODEL DOCUMENTATION</Text>
          </View>
          <Text style={styles.heroTitle}>Wildfire Risk{"\n"}Prediction AI</Text>
          <Text style={styles.heroSub}>
            MobileNetV2 · PyTorch · GradCAM++ · 9-Tile Spatial Aggregation
          </Text>

          {/* Key metric pills */}
          <View style={styles.pillRow}>
            {[
              { v: "99.46%", l: "Accuracy" },
              { v: "2.2M",   l: "Params" },
              { v: "42,850", l: "Images" },
              { v: "~8.7MB", l: "Model" },
            ].map((p) => (
              <View key={p.l} style={styles.pill}>
                <Text style={styles.pillVal}>{p.v}</Text>
                <Text style={styles.pillLabel}>{p.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION: System Overview ── */}
        <Section title="System Overview" icon={<Database size={16} color="#059669" />} accent="#059669" defaultOpen>
          {[
            {
              icon: <Database size={20} color="#059669" />,
              bg: "#ecfdf5",
              title: "Satellite Patches",
              text: "RGB image patches covering ~644×644 m extracted from forested regions via Mapbox at zoom level 15.",
            },
            {
              icon: <BrainCircuit size={20} color="#2563eb" />,
              bg: "#eff6ff",
              title: "MobileNetV2 Backbone",
              text: "2,226,434 trainable parameters implemented in PyTorch, optimized for efficient inference.",
            },
            {
              icon: <TriangleAlert size={20} color="#ea580c" />,
              bg: "#fff7ed",
              title: "Risk & Confidence Output",
              text: "Softmax(2) probabilities for 'risky' vs 'non-risky' classes — yields a discrete prediction and confidence score.",
            },
          ].map((item) => (
            <View key={item.title} style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.overviewTitle}>{item.title}</Text>
                <Text style={styles.overviewText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* ── SECTION: Training Dynamics ── */}
        <Section title="Training Dynamics" icon={<Zap size={16} color="#f59e0b" />} accent="#f59e0b">
          <Text style={styles.chartLabel}>Train Accuracy (green)</Text>
          <Sparkline data={trainingMetrics.map((m) => m.trainAcc)} color="#10b981" />
          <Text style={styles.chartHint}>Epochs 1–10 · 96.5% → 99.65%</Text>

          <Text style={[styles.chartLabel, { marginTop: 14 }]}>Validation Accuracy (blue)</Text>
          <Sparkline data={trainingMetrics.map((m) => m.valAcc)} color="#3b82f6" />
          <Text style={styles.chartHint}>Epochs 1–10 · 97.9% → 99.30%</Text>

          <Text style={[styles.chartLabel, { marginTop: 14 }]}>Train Loss (red)</Text>
          <Sparkline data={trainingMetrics.map((m) => m.trainLoss)} color="#ef4444" />
          <Text style={styles.chartHint}>0.092 → 0.011 — strong convergence</Text>

          {/* Epoch table */}
          <View style={styles.epochTable}>
            <View style={[styles.epochRow, styles.epochHeader]}>
              <Text style={styles.epochHead}>Epoch</Text>
              <Text style={styles.epochHead}>Train Acc</Text>
              <Text style={styles.epochHead}>Val Acc</Text>
              <Text style={styles.epochHead}>Loss</Text>
            </View>
            {trainingMetrics.map((m) => (
              <View key={m.epoch} style={styles.epochRow}>
                <Text style={styles.epochCell}>{m.epoch}</Text>
                <Text style={[styles.epochCell, { color: "#10b981" }]}>{m.trainAcc}%</Text>
                <Text style={[styles.epochCell, { color: "#3b82f6" }]}>{m.valAcc}%</Text>
                <Text style={[styles.epochCell, { color: "#ef4444" }]}>{m.trainLoss}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ── SECTION: Performance Metrics ── */}
        <Section title="Test Set Performance" icon={<Cpu size={16} color="#2563eb" />} accent="#2563eb">
          {/* Bar chart */}
          <View style={styles.barChartRow}>
            {performanceMetrics.map((m) => {
              const pct = ((m.value - 97) / 3) * 100;
              return (
                <View key={m.name} style={styles.barCol}>
                  <Text style={[styles.barVal, { color: m.color }]}>{m.value}%</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: m.color }]} />
                  </View>
                  <Text style={styles.barName}>{m.name}</Text>
                </View>
              );
            })}
          </View>

          {/* Dataset split */}
          <Text style={[styles.chartLabel, { marginTop: 16 }]}>Dataset Composition</Text>
          {[
            { name: "Training",   value: 70, color: "#10b981" },
            { name: "Validation", value: 15, color: "#3b82f6" },
            { name: "Test",       value: 15, color: "#f59e0b" },
          ].map((d) => (
            <View key={d.name} style={styles.dataRow}>
              <View style={[styles.dataDot, { backgroundColor: d.color }]} />
              <Text style={styles.dataName}>{d.name}</Text>
              <View style={styles.dataTrack}>
                <View style={[styles.dataFill, { width: `${d.value}%`, backgroundColor: d.color }]} />
              </View>
              <Text style={[styles.dataPct, { color: d.color }]}>{d.value}%</Text>
            </View>
          ))}

          {/* Dataset stats */}
          <View style={[styles.statsGrid, { marginTop: 14 }]}>
            {[
              { l: "Total Images", v: "42,850" },
              { l: "Wildfire",     v: "22,710", c: "#ea580c" },
              { l: "Non-Wildfire", v: "20,140", c: "#059669" },
              { l: "Source",       v: "Kaggle" },
              { l: "Region",       v: "Canada" },
              { l: "Balance",      v: "53:47", c: "#2563eb" },
            ].map((s) => (
              <View key={s.l} style={styles.statCell}>
                <Text style={styles.statCellLabel}>{s.l}</Text>
                <Text style={[styles.statCellVal, s.c ? { color: s.c } : {}]}>{s.v}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ── SECTION: Spatial Aggregation ── */}
        <Section title="Spatial Aggregation" icon={<Layers size={16} color="#8b5cf6" />} accent="#8b5cf6">
          <Text style={styles.overviewText}>
            Instead of analyzing one patch, the system evaluates a 3×3 grid around the selected location. Each tile is weighted by proximity to the center.
          </Text>

          {/* 3×3 grid */}
          <View style={styles.weightGrid}>
            {gridWeights.map((cell, i) => (
              <View
                key={i}
                style={[
                  styles.weightCell,
                  cell.type === "center" && styles.weightCellCenter,
                  cell.type === "edge"   && styles.weightCellEdge,
                  cell.type === "corner" && styles.weightCellCorner,
                ]}
              >
                <Text style={[styles.weightPct, cell.type === "center" && { color: "#fff", fontSize: 16 }]}>
                  {cell.weight}
                </Text>
                <Text style={[styles.weightLabel, cell.type === "center" && { color: "#fed7aa" }]}>
                  {cell.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.wLegend}>
            {[
              { color: "#fb923c", label: "Center — 40%" },
              { color: "#34d399", label: "Edge — 10% each" },
              { color: "#93c5fd", label: "Corner — 5% each" },
            ].map((l) => (
              <View key={l.label} style={styles.wLegendItem}>
                <View style={[styles.wDot, { backgroundColor: l.color }]} />
                <Text style={styles.wLegendText}>{l.label}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          {[
            { n: "1", title: "Spatial Context", text: "9 satellite tiles fetched around the target — total coverage ~3.7 km²." },
            { n: "2", title: "Weighted Aggregation", text: "Center=40%, Edge neighbors=10%, Corners=5%. Sums to 100%." },
            { n: "3", title: "Robust Predictions", text: "Reduces noise from single-tile bias and incorporates environmental context." },
          ].map((s) => (
            <View key={s.n} style={styles.step}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* ── SECTION: Architecture ── */}
        <Section title="Architecture Pipeline" icon={<Cpu size={16} color="#0891b2" />} accent="#0891b2">
          {/* Flow */}
          <View style={styles.pipeline}>
            {[
              { bg: "#eff6ff", border: "#93c5fd", icon: <Cpu size={18} color="#2563eb" />,       label: "Input",      sub: "224×224×3 RGB" },
              { bg: "#ecfdf5", border: "#6ee7b7", icon: <BrainCircuit size={18} color="#059669" />, label: "MobileNetV2", sub: "2.2M params" },
              { bg: "#fff7ed", border: "#fdba74", icon: <Zap size={18} color="#ea580c" />,        label: "Softmax(2)", sub: "Risk / Safe" },
            ].map((box, i) => (
              <React.Fragment key={box.label}>
                <View style={[styles.pipeBox, { backgroundColor: box.bg, borderColor: box.border }]}>
                  {box.icon}
                  <Text style={styles.pipeLabel}>{box.label}</Text>
                  <Text style={styles.pipeSub}>{box.sub}</Text>
                </View>
                {i < 2 && <Text style={styles.pipeArrow}>›</Text>}
              </React.Fragment>
            ))}
          </View>

          {/* Model specs table */}
          <View style={styles.specsTable}>
            {[
              { l: "Architecture", v: "MobileNetV2" },
              { l: "Input Size",   v: "224×224×3" },
              { l: "Parameters",   v: "2,226,434" },
              { l: "Framework",    v: "PyTorch" },
              { l: "Classes",      v: "2 (Risk / Safe)" },
              { l: "Model Size",   v: "~8.7 MB", c: "#059669" },
              { l: "XAI Method",   v: "GradCAM++", c: "#8b5cf6" },
              { l: "Optimizer",    v: "Adam" },
            ].map((r) => (
              <MetricRow key={r.l} label={r.l} value={r.v} color={(r as any).c} />
            ))}
          </View>
        </Section>

        {/* ── SECTION: Tech Stack ── */}
        <Section title="Technology Stack" icon={<Layers size={16} color="#1d4ed8" />} accent="#1d4ed8">
          <View style={styles.techGrid}>
            {[
              { cat: "Backend",    color: "#dbeafe", tc: "#1e40af", items: ["Express.js", "Flask", "PyTorch"] },
              { cat: "Frontend",   color: "#ecfdf5", tc: "#065f46", items: ["React", "TypeScript", "Tailwind"] },
              { cat: "Data",       color: "#fef9c3", tc: "#78350f", items: ["MongoDB", "Satellite Imagery", "Mapbox"] },
              { cat: "Deployment", color: "#fce7f3", tc: "#831843", items: ["ONNX", "Mobile Optimized", "Real-time"] },
            ].map((col) => (
              <View key={col.cat} style={[styles.techCard, { backgroundColor: col.color }]}>
                <Text style={[styles.techCat, { color: col.tc }]}>{col.cat}</Text>
                {col.items.map((item) => (
                  <Text key={item} style={styles.techItem}>· {item}</Text>
                ))}
              </View>
            ))}
          </View>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>FORESTSPARK</Text>
          <Text style={styles.footerSub}>© 2026 Protecting our Green Future</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { paddingBottom: 40 },

  // ─── Hero ───
  hero: {
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ecfdf5", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: { fontSize: 9, fontWeight: "900", color: "#059669", letterSpacing: 1.5 },
  heroTitle: { fontSize: 28, fontWeight: "900", color: "#0f172a", lineHeight: 34, marginBottom: 6 },
  heroSub: { fontSize: 11, color: "#64748b", lineHeight: 17, marginBottom: 20 },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1, backgroundColor: "#f8fafc", borderRadius: 14,
    padding: 10, alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  pillVal: { fontSize: 13, fontWeight: "900", color: "#0f172a" },
  pillLabel: { fontSize: 9, color: "#94a3b8", marginTop: 2 },

  // ─── Sections ───
  section: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#fff", borderRadius: 20,
    borderWidth: 1, borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 16, borderLeftWidth: 4,
  },
  sectionIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", flex: 1 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#f8fafc" },

  // ─── Overview cards ───
  overviewCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  overviewIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  overviewTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", marginBottom: 3 },
  overviewText: { fontSize: 12, color: "#64748b", lineHeight: 18, flex: 1 },

  // ─── Charts ───
  chartLabel: { fontSize: 11, fontWeight: "700", color: "#475569", marginBottom: 2 },
  chartHint: { fontSize: 9, color: "#94a3b8", marginBottom: 2 },

  // Epoch table
  epochTable: { marginTop: 14, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#f1f5f9" },
  epochRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  epochHeader: { backgroundColor: "#f8fafc" },
  epochHead: { flex: 1, fontSize: 9, fontWeight: "900", color: "#94a3b8", letterSpacing: 1 },
  epochCell: { flex: 1, fontSize: 11, color: "#334155" },

  // Bar chart
  barChartRow: { flexDirection: "row", gap: 8, height: 110, marginVertical: 8 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barVal: { fontSize: 9, fontWeight: "900", marginBottom: 4, textAlign: "center" },
  barTrack: { width: "100%", height: 70, backgroundColor: "#f1f5f9", borderRadius: 8, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 8 },
  barName: { fontSize: 8, color: "#94a3b8", marginTop: 4, textAlign: "center" },

  // Dataset
  dataRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 5 },
  dataDot: { width: 8, height: 8, borderRadius: 4 },
  dataName: { fontSize: 12, color: "#475569", width: 76 },
  dataTrack: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  dataFill: { height: "100%", borderRadius: 3 },
  dataPct: { fontSize: 11, fontWeight: "800", width: 34, textAlign: "right" },

  // Stats grid (2 col)
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCell: {
    width: "47%", backgroundColor: "#f8fafc",
    borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  statCellLabel: { fontSize: 9, color: "#94a3b8", marginBottom: 3 },
  statCellVal: { fontSize: 14, fontWeight: "800", color: "#0f172a" },

  // ─── Spatial grid ───
  weightGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginVertical: 14 },
  weightCell: {
    width: CELL, height: CELL, borderRadius: 12,
    borderWidth: 2, justifyContent: "center", alignItems: "center",
  },
  weightCellCenter: { backgroundColor: "#fb923c", borderColor: "#ea580c" },
  weightCellEdge:   { backgroundColor: "#bbf7d0", borderColor: "#34d399" },
  weightCellCorner: { backgroundColor: "#bfdbfe", borderColor: "#60a5fa" },
  weightPct: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  weightLabel: { fontSize: 8, fontWeight: "700", color: "#475569", marginTop: 2 },
  wLegend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  wLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  wDot: { width: 10, height: 10, borderRadius: 3 },
  wLegendText: { fontSize: 11, color: "#475569", fontWeight: "600" },

  // Steps
  step: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stepNum: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  stepNumText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  stepTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  stepText: { fontSize: 12, color: "#64748b", lineHeight: 17 },

  // ─── Pipeline ───
  pipeline: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  pipeBox: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    padding: 10, alignItems: "center", gap: 4,
  },
  pipeLabel: { fontSize: 10, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  pipeSub: { fontSize: 8, color: "#64748b", textAlign: "center" },
  pipeArrow: { fontSize: 22, color: "#cbd5e1" },

  // Specs table
  specsTable: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#f1f5f9" },
  metricRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 9, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: "#f8fafc",
  },
  metricLabel: { fontSize: 12, color: "#64748b" },
  metricValue: { fontSize: 12, fontWeight: "700", color: "#0f172a" },

  // ─── Tech grid ───
  techGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  techCard: { width: "47%", borderRadius: 14, padding: 12 },
  techCat: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 },
  techItem: { fontSize: 12, color: "#334155", marginBottom: 3 },

  // ─── Footer ───
  footer: { alignItems: "center", marginTop: 28, paddingVertical: 20 },
  footerBrand: { fontSize: 14, fontWeight: "900", color: "#059669", letterSpacing: 3, marginBottom: 4 },
  footerSub: { fontSize: 9, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase" },
});
