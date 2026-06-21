import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BrainCircuit,
  Database,
  TriangleAlert,
  Zap,
  Cpu,
  Layers,
  CheckCircle2,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const trainingMetrics = [
  { epoch: "1",  trainAcc: 96.5, valAcc: 97.9, trainLoss: 0.092, valLoss: 0.059 },
  { epoch: "2",  trainAcc: 98.2, valAcc: 98.6, trainLoss: 0.046, valLoss: 0.040 },
  { epoch: "3",  trainAcc: 98.8, valAcc: 99.1, trainLoss: 0.030, valLoss: 0.026 },
  { epoch: "4",  trainAcc: 99.0, valAcc: 99.1, trainLoss: 0.026, valLoss: 0.027 },
  { epoch: "5",  trainAcc: 99.1, valAcc: 99.1, trainLoss: 0.023, valLoss: 0.028 },
  { epoch: "6",  trainAcc: 99.4, valAcc: 98.95, trainLoss: 0.018, valLoss: 0.024 },
  { epoch: "7",  trainAcc: 99.45, valAcc: 99.3, trainLoss: 0.015, valLoss: 0.021 },
  { epoch: "8",  trainAcc: 99.55, valAcc: 99.4, trainLoss: 0.012, valLoss: 0.019 },
  { epoch: "9",  trainAcc: 99.65, valAcc: 99.35, trainLoss: 0.011, valLoss: 0.020 },
  { epoch: "10", trainAcc: 99.65, valAcc: 99.3, trainLoss: 0.011, valLoss: 0.021 },
];

const performanceMetrics = [
  { name: "Accuracy",  value: 99.46, color: "#10b981" },
  { name: "Precision", value: 99.57, color: "#3b82f6" },
  { name: "Recall",    value: 99.45, color: "#f59e0b" },
  { name: "F1-Score",  value: 99.51, color: "#ef4444" },
];

const datasetComposition = [
  { name: "Training",   value: 70, color: "#10b981" },
  { name: "Validation", value: 15, color: "#3b82f6" },
  { name: "Test",       value: 15, color: "#f59e0b" },
];

// 3×3 grid weights data
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

const CELL = (width - 48 - 12) / 3;

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

// Mini bar chart using Views
function MiniBarChart() {
  const maxVal = 100;
  const minVal = 97;
  return (
    <View style={styles.barChart}>
      {performanceMetrics.map((m, i) => {
        const pct = ((m.value - minVal) / (maxVal - minVal)) * 100;
        return (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barValue}>{m.value}%</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: m.color }]} />
            </View>
            <Text style={styles.barLabel}>{m.name}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Mini line chart using Views (sparkline style)
function EpochSparkline({ dataKey, color }: { dataKey: "trainAcc" | "valAcc" | "trainLoss" | "valLoss"; color: string }) {
  const values = trainingMetrics.map((m) => m[dataKey] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const chartW = width - 80;
  const chartH = 60;

  return (
    <View style={{ height: chartH, flexDirection: "row", alignItems: "flex-end", gap: 2, paddingVertical: 4 }}>
      {values.map((v, i) => {
        const pct = max === min ? 1 : (v - min) / (max - min);
        const barH = Math.max(4, pct * chartH);
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: barH,
              backgroundColor: color,
              borderRadius: 3,
              opacity: 0.7 + 0.3 * pct,
            }}
          />
        );
      })}
    </View>
  );
}

export default function DocumentationScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#1e293b" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Model Docs</Text>
          <Text style={styles.headerSub}>Wildfire Risk Prediction</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── SYSTEM OVERVIEW ── */}
        <SectionTitle>System Overview</SectionTitle>
        <View style={styles.overviewGrid}>
          <Card style={styles.overviewCard}>
            <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
              <Database size={24} color="#059669" />
            </View>
            <Text style={styles.overviewCardTitle}>Satellite Patches</Text>
            <Text style={styles.overviewCardText}>
              RGB image patches covering ~644×644 m extracted from forested regions.
            </Text>
          </Card>

          <Card style={styles.overviewCard}>
            <View style={[styles.iconBox, { backgroundColor: "#dbeafe" }]}>
              <BrainCircuit size={24} color="#2563eb" />
            </View>
            <Text style={styles.overviewCardTitle}>MobileNetV2</Text>
            <Text style={styles.overviewCardText}>
              2,226,434 trainable parameters, optimized for efficient on-device inference.
            </Text>
          </Card>

          <Card style={styles.overviewCard}>
            <View style={[styles.iconBox, { backgroundColor: "#ffedd5" }]}>
              <TriangleAlert size={24} color="#ea580c" />
            </View>
            <Text style={styles.overviewCardTitle}>Risk Output</Text>
            <Text style={styles.overviewCardText}>
              Softmax (2) produces "risky" vs "non-risky" probability and confidence.
            </Text>
          </Card>
        </View>

        {/* ── TRAINING DYNAMICS ── */}
        <SectionTitle>Training Dynamics</SectionTitle>
        <Card>
          <Text style={styles.chartTitle}>Accuracy Over 10 Epochs</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#10b981" }]} /><Text style={styles.legendText}>Train Acc</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#3b82f6" }]} /><Text style={styles.legendText}>Val Acc</Text></View>
          </View>
          <EpochSparkline dataKey="trainAcc" color="#10b981" />
          <Text style={[styles.chartNote, { marginTop: 6 }]}>Train accuracy (green bars) — final: 99.65%</Text>
          <EpochSparkline dataKey="valAcc" color="#3b82f6" />
          <Text style={styles.chartNote}>Validation accuracy (blue bars) — final: 99.30%</Text>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.chartTitle}>Loss Over 10 Epochs</Text>
          <EpochSparkline dataKey="trainLoss" color="#ef4444" />
          <Text style={[styles.chartNote, { marginTop: 6 }]}>Train loss (red) — converges from 0.092 → 0.011</Text>
          <EpochSparkline dataKey="valLoss" color="#f59e0b" />
          <Text style={styles.chartNote}>Val loss (amber) — converges from 0.059 → 0.021</Text>
        </Card>

        {/* ── TEST SET PERFORMANCE ── */}
        <SectionTitle>Test Set Performance</SectionTitle>
        <Card>
          <Text style={styles.chartTitle}>MobileNetV2 Metrics (97–100% scale)</Text>
          <MiniBarChart />
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.chartTitle}>Dataset Composition</Text>
          {datasetComposition.map((d, i) => (
            <View key={i} style={styles.datasetRow}>
              <View style={[styles.datasetDot, { backgroundColor: d.color }]} />
              <Text style={styles.datasetLabel}>{d.name}</Text>
              <View style={styles.datasetTrack}>
                <View style={[styles.datasetFill, { width: `${d.value}%`, backgroundColor: d.color }]} />
              </View>
              <Text style={styles.datasetPct}>{d.value}%</Text>
            </View>
          ))}
        </Card>

        {/* ── SPATIAL AGGREGATION ── */}
        <SectionTitle>Spatial Aggregation</SectionTitle>
        <Card>
          <Text style={styles.chartTitle}>3×3 Weighted Patch Grid</Text>
          <Text style={styles.overviewCardText}>The model evaluates 9 surrounding tiles with position-based weights:</Text>

          {/* 3×3 mini grid */}
          <View style={styles.miniGrid}>
            {gridWeights.map((cell, i) => (
              <View
                key={i}
                style={[
                  styles.miniCell,
                  cell.type === "center" && styles.miniCellCenter,
                  cell.type === "edge"   && styles.miniCellEdge,
                  cell.type === "corner" && styles.miniCellCorner,
                ]}
              >
                <Text style={[styles.miniCellWeight, cell.type === "center" && { color: "#fff", fontSize: 14 }]}>
                  {cell.weight}
                </Text>
                <Text style={[styles.miniCellLabel, cell.type === "center" && { color: "#fed7aa" }]}>
                  {cell.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.gridLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#f97316", width: 14, height: 14, borderRadius: 3 }]} />
              <Text style={styles.legendText}>Center 40%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#bbf7d0", width: 14, height: 14, borderRadius: 3 }]} />
              <Text style={styles.legendText}>Edge 10%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#bfdbfe", width: 14, height: 14, borderRadius: 3 }]} />
              <Text style={styles.legendText}>Corner 5%</Text>
            </View>
          </View>
        </Card>

        {/* ── HOW IT WORKS ── */}
        <SectionTitle>How It Works</SectionTitle>
        {[
          { n: "1", title: "Spatial Context", text: "Instead of one patch, the system evaluates a 3×3 grid around the selected location." },
          { n: "2", title: "Weighted Aggregation", text: "Center patch = 40%, edge neighbors = 10% each, corners = 5% each. Total = 100%." },
          { n: "3", title: "Robust Predictions", text: "Covers ~3.7 km² total area, reducing noise and incorporating environmental context." },
        ].map((step) => (
          <View key={step.n} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{step.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}

        {/* ── ARCHITECTURE PIPELINE ── */}
        <SectionTitle>Architecture Pipeline</SectionTitle>
        <Card>
          <View style={styles.pipeline}>
            <View style={[styles.pipeBox, { backgroundColor: "#eff6ff", borderColor: "#93c5fd" }]}>
              <Cpu size={20} color="#2563eb" />
              <Text style={styles.pipeLabel}>Input</Text>
              <Text style={styles.pipeSub}>224×224×3</Text>
            </View>
            <Text style={styles.pipeArrow}>→</Text>
            <View style={[styles.pipeBox, { backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" }]}>
              <BrainCircuit size={20} color="#059669" />
              <Text style={styles.pipeLabel}>MobileNetV2</Text>
              <Text style={styles.pipeSub}>2.2M params</Text>
            </View>
            <Text style={styles.pipeArrow}>→</Text>
            <View style={[styles.pipeBox, { backgroundColor: "#fff7ed", borderColor: "#fdba74" }]}>
              <Zap size={20} color="#ea580c" />
              <Text style={styles.pipeLabel}>Output</Text>
              <Text style={styles.pipeSub}>Softmax(2)</Text>
            </View>
          </View>
        </Card>

        {/* ── MODEL SPECS ── */}
        <SectionTitle>Technical Specifications</SectionTitle>
        <View style={styles.specsRow}>
          <Card style={styles.specCard}>
            <View style={styles.specCardHeader}>
              <BrainCircuit size={18} color="#2563eb" />
              <Text style={styles.specCardTitle}>Model</Text>
            </View>
            <StatRow label="Architecture" value="MobileNetV2" />
            <StatRow label="Input"        value="224×224×3" />
            <StatRow label="Parameters"   value="2.2M" />
            <StatRow label="Framework"    value="PyTorch" />
            <StatRow label="Classes"      value="2 (Risk/Safe)" />
            <StatRow label="Model Size"   value="~8.7 MB" valueColor="#059669" />
          </Card>

          <Card style={styles.specCard}>
            <View style={styles.specCardHeader}>
              <Database size={18} color="#059669" />
              <Text style={styles.specCardTitle}>Dataset</Text>
            </View>
            <StatRow label="Total Images" value="42,850" />
            <StatRow label="Wildfire"     value="22,710" valueColor="#ea580c" />
            <StatRow label="Non-Wildfire" value="20,140" valueColor="#059669" />
            <StatRow label="Source"       value="Kaggle" />
            <StatRow label="Region"       value="Canada" />
            <StatRow label="Balance"      value="53:47" valueColor="#2563eb" />
          </Card>
        </View>

        {/* ── TECH STACK ── */}
        <Card style={styles.techStack}>
          <View style={styles.techHeader}>
            <Layers size={20} color="#fff" />
            <Text style={styles.techTitle}>Technology Stack</Text>
          </View>
          <View style={styles.techGrid}>
            {[
              { cat: "Backend",    items: ["Express.js", "Flask", "PyTorch"] },
              { cat: "Frontend",   items: ["React", "TypeScript", "Tailwind CSS"] },
              { cat: "Data",       items: ["MongoDB", "Satellite Imagery", "Mapbox API"] },
              { cat: "Deployment", items: ["ONNX", "Mobile Optimized", "Real-time"] },
            ].map((col) => (
              <View key={col.cat} style={styles.techCol}>
                <Text style={styles.techCat}>{col.cat}</Text>
                {col.items.map((item) => (
                  <Text key={item} style={styles.techItem}>• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        </Card>

        {/* ── FOOTER ── */}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  headerSub: { fontSize: 10, color: "#94a3b8", marginTop: 1 },

  content: { padding: 20, paddingBottom: 60 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 28,
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Overview grid
  overviewGrid: { gap: 12 },
  overviewCard: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  overviewCardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 3 },
  overviewCardText: { fontSize: 12, color: "#64748b", lineHeight: 18, flex: 1 },

  // Charts
  chartTitle: { fontSize: 13, fontWeight: "800", color: "#334155", marginBottom: 12, textAlign: "center" },
  chartNote: { fontSize: 10, color: "#94a3b8", marginBottom: 8 },
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  dot: { width: 10, height: 10, borderRadius: 5 },

  // Bar chart
  barChart: { flexDirection: "row", height: 120, gap: 8, marginVertical: 8 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barValue: { fontSize: 8, fontWeight: "800", color: "#334155", marginBottom: 4, textAlign: "center" },
  barTrack: { width: "100%", height: 80, backgroundColor: "#f1f5f9", borderRadius: 6, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 8, color: "#94a3b8", marginTop: 4, textAlign: "center" },

  // Dataset rows
  datasetRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 5 },
  datasetDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  datasetLabel: { fontSize: 12, color: "#475569", width: 72 },
  datasetTrack: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  datasetFill: { height: "100%", borderRadius: 3 },
  datasetPct: { fontSize: 11, fontWeight: "800", color: "#334155", width: 32, textAlign: "right" },

  // 3×3 grid
  miniGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginVertical: 14 },
  miniCell: {
    width: CELL, height: CELL,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center", alignItems: "center",
  },
  miniCellCenter: { backgroundColor: "#fb923c", borderColor: "#ea580c" },
  miniCellEdge: { backgroundColor: "#bbf7d0", borderColor: "#34d399" },
  miniCellCorner: { backgroundColor: "#bfdbfe", borderColor: "#60a5fa" },
  miniCellWeight: { fontSize: 13, fontWeight: "900", color: "#0f172a" },
  miniCellLabel: { fontSize: 8, fontWeight: "700", color: "#475569", marginTop: 2 },
  gridLegend: { flexDirection: "row", gap: 14, flexWrap: "wrap", marginTop: 4 },

  // Steps
  stepRow: { flexDirection: "row", gap: 14, marginBottom: 14 },
  stepNum: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  stepNumText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  stepTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 3 },
  stepText: { fontSize: 12, color: "#64748b", lineHeight: 18 },

  // Pipeline
  pipeline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  pipeBox: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    padding: 12, alignItems: "center", gap: 4,
  },
  pipeLabel: { fontSize: 11, fontWeight: "800", color: "#0f172a" },
  pipeSub: { fontSize: 9, color: "#64748b", textAlign: "center" },
  pipeArrow: { fontSize: 20, color: "#94a3b8" },

  // Specs
  specsRow: { flexDirection: "row", gap: 12 },
  specCard: { flex: 1 },
  specCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  specCardTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  statLabel: { fontSize: 10, color: "#64748b" },
  statValue: { fontSize: 11, fontWeight: "700", color: "#0f172a" },

  // Tech stack
  techStack: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8", marginTop: 12 },
  techHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  techTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  techGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  techCol: { width: "45%" },
  techCat: { fontSize: 10, fontWeight: "900", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  techItem: { fontSize: 12, color: "#fff", marginBottom: 3 },

  // Footer
  footer: { alignItems: "center", marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  footerBrand: { fontSize: 16, fontWeight: "900", color: "#059669", letterSpacing: 3, marginBottom: 4 },
  footerSub: { fontSize: 9, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase" },
});
