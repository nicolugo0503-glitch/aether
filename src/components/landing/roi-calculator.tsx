"use client";
import { useState, useMemo } from "react";
import { ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";

export function ROICalculator() {
  const [teamSize, setTeamSize] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(35);

  const roi = useMemo(() => {
    const weeklyHoursSaved = hoursPerWeek * teamSize;
    const yearlyHoursSaved = weeklyHoursSaved * 52;
    const yearlyCostSaved = yearlyHoursSaved * hourlyRate;
    const aetherCost = 149 * 12; // Growth plan yearly
    const netSavings = yearlyCostSaved - aetherCost;
    const roiPercent = Math.round((netSavings / aetherCost) * 100);
    return {
      weeklyHours: Math.round(weeklyHoursSaved),
      yearlyHours: Math.round(yearlyHoursSaved),
      yearlySavings: Math.round(yearlyCostSaved),
      netSavings: Math.max(0, Math.round(netSavings)),
      roiPercent: Math.max(0, roiPercent),
    };
  }, [teamSize, hoursPerWeek, hourlyRate]);

  const sliderStyle = (val: number, min: number, max: number) => {
    const pct = ((val - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, #7c3aed ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
    };
  };

  return (
    <section className="py-24 md:py-40 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.07), transparent)" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5"
            style={{ background: "rgba(124,58,237,0.05)" }}>
            <Calculator className="h-3.5 w-3.5" />
            ROI Calculator
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
            How much is <span className="gradient-text">manual work costing you?</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            Move the sliders to see exactly how many hours — and dollars — Aether saves your team every year.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Sliders */}
          <div className="rounded-3xl p-8 md:p-10" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-white font-bold text-lg mb-8">Your team profile</h3>

            {[
              { label: "Team members doing manual marketing", value: teamSize, min: 1, max: 20, step: 1, unit: "people", setter: setTeamSize },
              { label: "Hours/week spent on repetitive marketing tasks", value: hoursPerWeek, min: 1, max: 40, step: 1, unit: "hrs/wk", setter: setHoursPerWeek },
              { label: "Average fully-loaded hourly cost per person", value: hourlyRate, min: 15, max: 150, step: 5, unit: `$${hourlyRate}/hr`, setter: setHourlyRate },
            ].map((s) => (
              <div key={s.label} className="mb-8 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-zinc-400 text-sm leading-snug max-w-[75%]">{s.label}</label>
                  <span className="text-white font-bold text-sm shrink-0">{s.unit}</span>
                </div>
                <input
                  type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                  onChange={e => s.setter(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
                  style={{ ...sliderStyle(s.value, s.min, s.max) }}
                />
                <div className="flex justify-between text-xs text-zinc-700 mt-1.5">
                  <span>{s.min}{s.label.includes("cost") ? "" : ""}</span>
                  <span>{s.max}{s.label.includes("cost") ? "" : ""}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-5">
            {/* Main ROI card */}
            <div className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(109,40,217,0.08))",
                border: "1px solid rgba(124,58,237,0.4)",
                boxShadow: "0 0 60px rgba(124,58,237,0.12)",
              }}>
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />

              <div className="text-zinc-400 text-sm mb-2">Estimated yearly net savings with Aether</div>
              <div className="text-5xl md:text-6xl font-black gradient-text mb-1">
                ${roi.netSavings.toLocaleString()}
              </div>
              <div className="text-zinc-500 text-sm mb-6">after Aether subscription cost</div>

              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {roi.roiPercent}× ROI on Aether investment
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Hours saved per week", value: `${roi.weeklyHours}`, unit: "hrs" },
                { label: "Hours saved per year", value: `${roi.yearlyHours.toLocaleString()}`, unit: "hrs" },
                { label: "Gross cost recovered", value: `$${roi.yearlySavings.toLocaleString()}`, unit: "/yr" },
                { label: "Aether cost (Growth)", value: "$1,788", unit: "/yr" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-zinc-500 text-xs mb-2 leading-snug">{stat.label}</div>
                  <div className="text-white font-black text-2xl">
                    {stat.value}<span className="text-zinc-600 text-sm font-normal ml-0.5">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/signup"
              className="group w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base btn-shine"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
              Start saving {roi.weeklyHours} hrs/week — free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
