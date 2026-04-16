"""
GigShield BCR Report Generator
Reads stress_test_report.json and produces:
1. BCR_Chart.png  — chart for pitch deck
2. GigShield_BCR_Report.pdf — full professional PDF report
Run: python data/generate_bcr_report.py
"""

import json
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

BASE_DIR    = os.path.dirname(__file__)
REPORT_JSON = os.path.join(BASE_DIR, "stress_test_report.json")
CHART_PNG   = os.path.join(BASE_DIR, "BCR_Chart.png")
PDF_OUT     = os.path.join(BASE_DIR, "GigShield_BCR_Report.pdf")

# Brand colors
BRAND_PURPLE = "#534AB7"
BRAND_TEAL   = "#1D9E75"
BRAND_CORAL  = "#D85A30"
BRAND_GRAY   = "#5F5E5A"
LIGHT_GRAY   = "#F1EFE8"

def load_report() -> dict:
    with open(REPORT_JSON) as f:
        return json.load(f)

def generate_charts(report: dict):
    """Generates 3 charts and saves as a single PNG"""
    stress     = report.get("stress_test", {})
    zones      = report.get("zone_analysis", [])
    daily_log  = stress.get("daily_log", [])

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.patch.set_facecolor("#FAFAFA")

    # ── Chart 1: 14-day pool balance ──────────────────────────────
    ax1   = axes[0]
    days = [d.get("day", i+1) for i, d in enumerate(daily_log)]
    pool = [d.get("pool_remaining", 0) for d in daily_log]
    claims = [d.get("claims", 0) for d in daily_log]
   

    ax1.fill_between(days, pool, alpha=0.15, color=BRAND_TEAL)
    ax1.plot(days, pool, color=BRAND_TEAL, linewidth=2.5, label="Pool balance")
    ax1.bar(days, claims, alpha=0.4, color=BRAND_CORAL, label="Daily claims")
    ax1.axhline(y=0, color=BRAND_CORAL, linestyle="--", linewidth=1, alpha=0.7)
    ax1.set_title("14-Day Monsoon Stress Test", fontsize=13, fontweight="bold", pad=12)
    ax1.set_xlabel("Day", fontsize=11)
    ax1.set_ylabel("Amount (₹)", fontsize=11)
    ax1.legend(fontsize=9)
    ax1.grid(axis="y", alpha=0.3)
    ax1.set_facecolor(LIGHT_GRAY)
    ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"₹{x/1000:.0f}K"))

    # ── Chart 2: Zone BCR comparison ─────────────────────────────
    ax2        = axes[1]
    zone_names = [z["zone"].replace("_", "\n") for z in zones]
    zone_bcrs = [z.get("zone_bcr", 0) for z in zones]
    bar_colors = [BRAND_TEAL if b <= 0.65 else BRAND_CORAL for b in zone_bcrs]

    bars = ax2.bar(range(len(zone_names)), zone_bcrs, color=bar_colors, alpha=0.85, width=0.6)
    ax2.axhline(y=0.65, color=BRAND_GRAY, linestyle="--", linewidth=1.5,
                label="Target BCR (0.65)", alpha=0.8)
    ax2.set_xticks(range(len(zone_names)))
    ax2.set_xticklabels(zone_names, fontsize=8)
    ax2.set_title("Zone BCR vs Target", fontsize=13, fontweight="bold", pad=12)
    ax2.set_ylabel("BCR", fontsize=11)
    ax2.set_ylim(0, 1.0)
    ax2.legend(fontsize=9)
    ax2.grid(axis="y", alpha=0.3)
    ax2.set_facecolor(LIGHT_GRAY)

    for bar, val in zip(bars, zone_bcrs):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02,
                 f"{val:.2f}", ha="center", va="bottom", fontsize=8, fontweight="bold")

    safe   = mpatches.Patch(color=BRAND_TEAL,  alpha=0.85, label="Within target")
    risky  = mpatches.Patch(color=BRAND_CORAL, alpha=0.85, label="Above target")
    ax2.legend(handles=[safe, risky], fontsize=8)

    # ── Chart 3: Trigger frequency per zone ──────────────────────
    ax3          = axes[2]
    zone_short   = [z["zone"].split("_")[0].capitalize() for z in zones]
    rain_days    = [z.get("rain_days", 0) for z in zones]
    heat_days    = [z.get("heat_days", 0) for z in zones]
    fog_days     = [z.get("fog_days", 0) for z in zones]

    x     = range(len(zone_short))
    width = 0.25
    ax3.bar([i - width for i in x], rain_days, width, label="Rain", color=BRAND_TEAL,   alpha=0.85)
    ax3.bar([i         for i in x], heat_days, width, label="Heat", color=BRAND_CORAL,  alpha=0.85)
    ax3.bar([i + width for i in x], fog_days,  width, label="Fog",  color=BRAND_PURPLE, alpha=0.85)

    ax3.set_xticks(list(x))
    ax3.set_xticklabels(zone_short, fontsize=9)
    ax3.set_title("Real Trigger Days (3-Year History)", fontsize=13, fontweight="bold", pad=12)
    ax3.set_ylabel("Trigger Days", fontsize=11)
    ax3.legend(fontsize=9)
    ax3.grid(axis="y", alpha=0.3)
    ax3.set_facecolor(LIGHT_GRAY)

    plt.tight_layout(pad=3.0)
    plt.savefig(CHART_PNG, dpi=150, bbox_inches="tight", facecolor="#FAFAFA")
    plt.close()
    print(f"Chart saved: {CHART_PNG}")

def generate_pdf(report: dict):
    """Generates professional PDF report"""
    doc   = SimpleDocTemplate(
        PDF_OUT,
        pagesize=A4,
        rightMargin=20*mm, leftMargin=20*mm,
        topMargin=20*mm,   bottomMargin=20*mm,
    )
    styles  = getSampleStyleSheet()
    story   = []
    stress  = report.get("stress_test", {})
    zones   = report.get("zone_analysis", [])
    daily_log = stress.get("daily_log", [])
    meta    = report.get("metadata", {})
    ss      = report.get("ss_code_analysis", {})

    # Custom styles
    title_style = ParagraphStyle(
        "title", parent=styles["Title"],
        fontSize=22, textColor=colors.HexColor(BRAND_PURPLE),
        spaceAfter=4, alignment=TA_CENTER, fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "subtitle", parent=styles["Normal"],
        fontSize=11, textColor=colors.HexColor(BRAND_GRAY),
        spaceAfter=2, alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "section", parent=styles["Heading2"],
        fontSize=13, textColor=colors.HexColor(BRAND_PURPLE),
        spaceBefore=12, spaceAfter=6, fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "body", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor(BRAND_GRAY),
        spaceAfter=4, leading=16,
    )
    metric_style = ParagraphStyle(
        "metric", parent=styles["Normal"],
        fontSize=18, textColor=colors.HexColor(BRAND_TEAL),
        alignment=TA_CENTER, fontName="Helvetica-Bold",
    )
    label_style = ParagraphStyle(
        "label", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor(BRAND_GRAY),
        alignment=TA_CENTER,
    )

    # ── Header ───────────────────────────────────────────────────
    story.append(Paragraph("GigShield", title_style))
    story.append(Paragraph("Financial Viability Report — Stress Test Results", subtitle_style))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%d %B %Y %H:%M')} | "
        f"Data: Open-Meteo 3-Year Historical Archive | "
        f"Workers: {meta.get('total_workers', 500)} across {meta.get('zones', 7)} zones",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor(BRAND_PURPLE), spaceAfter=10))

    # ── Key metrics row ──────────────────────────────────────────
    bcr         = stress.get("bcr", 0)
    bcr_color   = BRAND_TEAL if bcr <= 0.65 else BRAND_CORAL
    bcr_status  = "WITHIN TARGET" if bcr <= 0.65 else "ABOVE TARGET"
    pool_ok     = stress.get("pool_survived", False)

    metrics_data = [
        [
            Paragraph(f"{bcr:.3f}", ParagraphStyle("m", parent=styles["Normal"], fontSize=24,
                textColor=colors.HexColor(bcr_color), alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(f"₹{stress.get('total_weekly_premium',0):,.0f}", metric_style),
            Paragraph("SURVIVED" if pool_ok else "DEPLETED", ParagraphStyle("m", parent=styles["Normal"],
                fontSize=18, textColor=colors.HexColor(BRAND_TEAL if pool_ok else BRAND_CORAL),
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(f"{ss.get('pct_at_risk', 0):.1f}%", metric_style),
        ],
        [
            Paragraph(f"BCR ({bcr_status})", label_style),
            Paragraph("Weekly Premium Pool", label_style),
            Paragraph("14-Day Monsoon Pool", label_style),
            Paragraph("Workers at SS Risk", label_style),
        ]
    ]
    metrics_table = Table(metrics_data, colWidths=[42*mm, 42*mm, 42*mm, 42*mm])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor(LIGHT_GRAY)),
        ("BACKGROUND", (0,1), (-1,1), colors.white),
        ("BOX",        (0,0), (-1,-1), 0.5, colors.HexColor(BRAND_GRAY)),
        ("INNERGRID",  (0,0), (-1,-1), 0.5, colors.HexColor("#D3D1C7")),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 12))

    # ── Charts ───────────────────────────────────────────────────
    story.append(Paragraph("Stress Test Visualisation", section_style))
    story.append(Image(CHART_PNG, width=170*mm, height=57*mm))
    story.append(Spacer(1, 8))

    # ── Verdict box ──────────────────────────────────────────────
    verdict_style = ParagraphStyle(
        "verdict", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor(BRAND_TEAL),
        backColor=colors.HexColor("#E1F5EE"),
        borderColor=colors.HexColor(BRAND_TEAL),
        borderWidth=1, borderPadding=8,
        leading=16,
    )
    story.append(Paragraph(
        f"VERDICT: {report.get('verdict', 'Pool survived the stress test.')}",
        verdict_style
    ))
    story.append(Spacer(1, 10))

    # ── Zone analysis table ──────────────────────────────────────
    story.append(Paragraph("Zone-by-Zone Analysis (Real 3-Year Historical Data)", section_style))
    story.append(Paragraph(
        "Trigger counts derived from actual Open-Meteo daily weather records. "
        "BCR = expected claims / weekly premium collected per zone.",
        body_style
    ))

    zone_header = ["Zone", "City", "Workers", "Trigger Days", "Rate %", "Avg/Week", "BCR"]
    zone_rows   = [zone_header]
    for z in zones:
        bcr_val   = z["zone_bcr"]
        bcr_cell  = f"{bcr_val:.3f}"
        zone_rows.append([
            z["zone"].replace("_", " ").title(),
            z["city"].capitalize(),
            str(z["workers"]),
            f"{z['trigger_days_3yr']} / {z['total_days']}",
            f"{z['trigger_rate_pct']}%",
            f"{z['avg_trigger_wk']:.2f}",
            bcr_cell,
        ])

    zone_table = Table(zone_rows, colWidths=[40*mm, 22*mm, 18*mm, 28*mm, 16*mm, 20*mm, 16*mm])
    zone_style = TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), colors.HexColor(BRAND_PURPLE)),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [colors.white, colors.HexColor(LIGHT_GRAY)]),
        ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#D3D1C7")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ALIGN",         (2,0), (-1,-1), "CENTER"),
    ])
    for i, z in enumerate(zones, start=1):
        if z["zone_bcr"] > 0.65:
            zone_style.add("TEXTCOLOR", (6, i), (6, i), colors.HexColor(BRAND_CORAL))
            zone_style.add("FONTNAME",  (6, i), (6, i), "Helvetica-Bold")
        else:
            zone_style.add("TEXTCOLOR", (6, i), (6, i), colors.HexColor(BRAND_TEAL))
            zone_style.add("FONTNAME",  (6, i), (6, i), "Helvetica-Bold")
    zone_table.setStyle(zone_style)
    story.append(zone_table)
    story.append(Spacer(1, 10))

    # ── SS Code analysis ─────────────────────────────────────────
    story.append(Paragraph("Social Security Code 90/120-Day Eligibility Impact", section_style))
    ss_text = (
        f"Based on {meta.get('total_workers',500)} workers across {meta.get('zones',7)} zones, "
        f"an average of {ss.get('avg_disruption_days_per_year', 0):.0f} disruption days per year "
        f"puts approximately <b>{ss.get('workers_at_risk_below_90days',0)} workers "
        f"({ss.get('pct_at_risk',0):.1f}%)</b> at risk of falling below the 90-day single-platform "
        f"threshold required for SS Code eligibility. GigShield's income protection directly "
        f"reduces the financial pressure that forces workers to work through disruptions — "
        f"improving both safety outcomes and SS Code qualification rates."
    )
    story.append(Paragraph(ss_text, body_style))
    story.append(Spacer(1, 8))

    # ── Methodology ──────────────────────────────────────────────
    story.append(Paragraph("Methodology & Data Sources", section_style))
    methodology = [
        ["Component", "Source", "Detail"],
        ["Weather history", "Open-Meteo Archive API", "3 years daily — precipitation, temperature, visibility"],
        ["Trigger thresholds", "GigShield product spec", "Rain ≥25mm/day · Heat ≥44°C · Fog ≤100m"],
        ["Premium model", "XGBoost ML engine", "11 risk features · zone multiplier · affordability cap"],
        ["BCR formula", "Actuarial standard", "Expected claims / Premiums collected"],
        ["Reinsurance", "Industry standard", "50% cover above 80% pool drain threshold"],
        ["Liquidity reserve", "Regulatory guidance", "30% of weekly premium pool held in reserve"],
    ]
    meth_table = Table(methodology, colWidths=[45*mm, 50*mm, 75*mm])
    meth_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), colors.HexColor(BRAND_GRAY)),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [colors.white, colors.HexColor(LIGHT_GRAY)]),
        ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#D3D1C7")),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(meth_table)
    story.append(Spacer(1, 10))

    # ── Footer ───────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(BRAND_GRAY)))
    story.append(Paragraph(
        f"GigShield · Guidewire DEVTrails 2026 · "
        f"Generated {datetime.now().strftime('%d %B %Y')} · "
        f"Data: Open-Meteo 3-Year Archive (Free, No API Key)",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=7,
            textColor=colors.HexColor(BRAND_GRAY), alignment=TA_CENTER, spaceBefore=4)
    ))

    doc.build(story)
    print(f"PDF saved: {PDF_OUT}")

def main():
    print("Loading stress test report...")
    report = load_report()

    print("Generating charts...")
    generate_charts(report)

    print("Generating PDF...")
    generate_pdf(report)

    print("\nDone.")
    print(f"Chart: {CHART_PNG}")
    print(f"PDF:   {PDF_OUT}")

if __name__ == "__main__":
    main()