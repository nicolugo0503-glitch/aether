"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Trash2, ToggleLeft, ToggleRight, Brain, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  agentId: string;
  memoryEnabled: boolean;
  memoryContext: string;
  memoryUpdatedAt: Date | null;
  memoryRunCount: number;
  totalSuccessRuns: number;
}

const MIN_RUNS = 3;

export default function AgentMemoryPanel({
  agentId,
  memoryEnabled: initialEnabled,
  memoryContext: initialContext,
  memoryUpdatedAt: initialUpdatedAt,
  memoryRunCount: initialRunCount,
  totalSuccessRuns,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [context, setContext] = useState(initialContext);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(initialUpdatedAt);
  const [runCount, setRunCount] = useState(initialRunCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const canBuild = totalSuccessRuns >= MIN_RUNS;
  const hasMemory = context.trim().length > 0;

  async function handleRefresh() {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/memory`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refresh failed");
      setContext(data.memoryContext); setRunCount(data.runsAnalyzed);
      setUpdatedAt(new Date(data.memoryUpdatedAt)); setEnabled(true); setExpanded(true);
      setSuccess(`Memory built from ${data.runsAnalyzed} runs! Your agent will now improve with every task.`);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleToggle() {
    const newEnabled = !enabled; setEnabled(newEnabled); setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/memory`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", enabled: newEnabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    } catch (e: any) { setEnabled(!newEnabled); setError(e.message); }
  }

  async function handleClear() {
    if (!confirm("Clear this agent\'s memory? It will stop using learned patterns until you rebuild it.")) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/memory`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (!res.ok) throw new Error("Clear failed");
      setContext(""); setEnabled(false); setRunCount(0); setUpdatedAt(null);
      setSuccess("Memory cleared.");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="agent-section" style={{
      borderRadius: 16, padding: "22px 24px",
      background: hasMemory ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.025)",
      border: `1px solid ${hasMemory ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.07)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: hasMemory ? 16 : 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: hasMemory ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={15} color={hasMemory ? "#fff" : "#52525b"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Agent Memory</h2>
            {hasMemory && (
              <span style={{
                padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: enabled ? "rgba(16,185,129,0.15)" : "rgba(113,113,122,0.2)",
                color: enabled ? "#10b981" : "#71717a",
                border: `1px solid ${enabled ? "rgba(16,185,129,0.3)" : "rgba(113,113,122,0.2)"}`,
              }}>
                {enabled ? "Active" : "Paused"}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#52525b", margin: 0, marginTop: 1 }}>
            {hasMemory
              ? `Built from ${runCount} runs${updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleDateString()}` : ""}`
              : "AI learns from past runs to improve every future output"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {hasMemory && (
            <>
              <button onClick={handleToggle} title={enabled ? "Disable memory" : "Enable memory"}
                style={{ display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,
                  background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",
                  color: enabled ? "#a78bfa" : "#52525b" }}>
                {enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
              <button onClick={() => setExpanded(e => !e)} title={expanded ? "Collapse" : "View memory"}
                style={{ display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,
                  background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",color:"#71717a" }}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </>
          )}
          <button onClick={handleRefresh} disabled={loading || !canBuild}
            title={!canBuild ? `Need ${MIN_RUNS} successful runs (have ${totalSuccessRuns})` : "Rebuild memory from recent runs"}
            style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,
              background: canBuild ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.04)",
              color: canBuild ? "#fff" : "#52525b",
              border: canBuild ? "none" : "1px solid rgba(255,255,255,0.08)",
              cursor: canBuild && !loading ? "pointer" : "not-allowed", opacity: loading ? 0.7 : 1 }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Analyzing…" : hasMemory ? "Refresh" : "Build Memory"}
          </button>
          {hasMemory && (
            <button onClick={handleClear} disabled={loading} title="Clear memory"
              style={{ display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,
                background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",cursor:"pointer",color:"#ef4444" }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ marginTop:12,padding:"10px 14px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",fontSize:12,color:"#ef4444" }}>{error}</div>}
      {success && <div style={{ marginTop:12,padding:"10px 14px",borderRadius:8,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",fontSize:12,color:"#10b981" }}>{success}</div>}

      {!hasMemory && !error && !success && (
        <div style={{ marginTop:14,padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)" }}>
          {canBuild ? (
            <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
              <Brain size={16} color="#7c3aed" style={{ flexShrink:0,marginTop:1 }} />
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"#d4d4d8",marginBottom:4 }}>Ready to build memory</div>
                <p style={{ fontSize:12,color:"#71717a",margin:0,lineHeight:1.5 }}>
                  Aether will analyze your agent\'s {totalSuccessRuns} successful runs and extract patterns.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
              <Brain size={16} color="#52525b" style={{ flexShrink:0,marginTop:1 }} />
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"#71717a",marginBottom:4 }}>{totalSuccessRuns}/{MIN_RUNS} runs needed</div>
                <p style={{ fontSize:12,color:"#52525b",margin:0,lineHeight:1.5 }}>
                  Run this agent {MIN_RUNS - totalSuccessRuns} more time{MIN_RUNS - totalSuccessRuns !== 1 ? "s" : ""} successfully to unlock memory.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {hasMemory && expanded && (
        <div style={{ marginTop:14,padding:"16px",borderRadius:10,background:"rgba(0,0,0,0.2)",border:"1px solid rgba(124,58,237,0.15)" }}>
          <div style={{ fontSize:10,color:"#7c3aed",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>
            Memory Context (injected into every run)
          </div>
          <p style={{ fontSize:12,color:"#a1a1aa",lineHeight:1.7,margin:0,whiteSpace:"pre-wrap" }}>{context}</p>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
