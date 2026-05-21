# Contract Management Dashboard — Dashboard Build Plan

## 1. Dashboard Goal

Membangun dashboard Contract Management yang fokus pada:

* Monitoring kontrak
* Monitoring masa berlaku
* Tracking approval
* Tracking nilai kontrak
* Monitoring workload PIC
* Analisa vendor/client
* Insight management




---

# 2. Dashboard Navigation

## Main Tabs

| Tab       | Function                 |
| --------- | ------------------------ |
| Ringkasan | Kondisi kontrak saat ini |
| Trend     | Perkembangan kontrak     |
| Analisis  | Insight & evaluasi       |
| Workload  | Beban kerja tim          |

---

# 3. Global Filter Area

## Filter Components

### Date Range

Type:

* Date Picker

---

### Branch / Site

Type:

* Multi Select

---

### Vendor

Type:

* Search Select

---

### Contract Status

Type:

* Multi Select

Options:

* Draft
* Review
* Pending Approval
* Active
* Expired
* Renewed
* Rejected
* Terminated

---

### Contract Category

Type:

* Multi Select

---

### PIC / Department

Type:

* Select

---

# 4. TAB — Ringkasan

## Purpose

Monitoring cepat kondisi kontrak.

---

# Section A — KPI Cards

## Grid Layout

4 column desktop

---

### Card 1 — Total Contract

Data:

* total semua kontrak

Trend:

* naik/turun dibanding bulan lalu

---

### Card 2 — Active Contract

Data:

* kontrak aktif

---

### Card 3 — Expiring Soon

Data:

* kontrak akan habis < 30 hari

Highlight:

* warna warning

---

### Card 4 — Expired Contract

Data:

* kontrak expired

Highlight:

* warna danger

---

### Card 5 — Pending Approval

Data:

* kontrak menunggu approval

---

### Card 6 — Renewal Rate

Data:

* % renewal

---

### Card 7 — Total Contract Value

Data:

* total nilai kontrak

---

### Card 8 — Avg Approval Time

Data:

* rata-rata approval

---

# Section B — Contract Status

## Chart 1 — Contract By Status

Type:

* Donut Chart

Data:

* Draft
* Review
* Pending
* Active
* Expired
* Renewed
* Rejected

Purpose:

* melihat distribusi kontrak

---

# Section C — Expiry Monitoring

## Chart 2 — Expiry Timeline

Type:

* Horizontal Bar

Data:

* < 30 hari
* 30–60 hari
* 60–90 hari
* > 90 hari

Purpose:

* monitoring kontrak hampir habis

PRIORITAS TINGGI.

---

# Section D — Contract Value

## Chart 3 — Contract Value By Category

Type:

* Pie / Treemap

Data:

* Procurement
* Service
* Maintenance
* Vendor
* Partnership

---

## Chart 4 — Top Highest Contract

Type:

* Vertical Bar

Data:

* top nilai kontrak

---

# Section E — Approval Monitoring

## Chart 5 — Approval Status

Type:

* Stacked Bar

Data:

* Approved
* Pending
* Rejected

---

# Section F — Recent Activity

## Widgets

### Recent Contract

Table mini:

* contract_no
* vendor
* status
* end_date

---

### Upcoming Renewal

Table mini:

* kontrak mendekati expired

---

### Pending Approval

Table mini:

* approval queue

---

# 5. TAB — Trend

## Purpose

Melihat perkembangan kontrak.

---

# Section A — Contract Growth

## Chart 1 — Contract Per Month

Type:

* Line Chart

Data:

* jumlah kontrak bulanan

---

## Chart 2 — Contract Value Trend

Type:

* Area Chart

Data:

* total nilai kontrak per bulan

---

# Section B — Renewal Trend

## Chart 3 — Renewal vs Expired

Type:

* Dual Line Chart

Data:

* renewed
* expired

Purpose:

* melihat health kontrak

---

# Section C — Approval Trend

## Chart 4 — Approval Trend

Type:

* Stacked Area

Data:

* approved
* rejected
* pending

---

# Section D — Vendor Activity

## Chart 5 — Top Vendor Activity

Type:

* Bar Chart

Data:

* vendor paling aktif

---

# Section E — Contract Type Trend

## Chart 6 — Category Trend

Type:

* Multi Line

Data:

* trend kategori kontrak

---

# 6. TAB — Analisis

## Purpose

Insight & evaluasi.

---

# Section A — Risk Analysis

## Chart 1 — Expiry Risk

Type:

* Heatmap

Data:

* kontrak berisiko expired

---

## Chart 2 — Renewal Failure

Type:

* Horizontal Bar

Data:

* kontrak gagal renewal

---

# Section B — Vendor Analysis

## Chart 3 — Vendor Performance

Type:

* Radar / Bar

Data:

* total kontrak
* renewal success
* approval speed

---

# Section C — Financial Analysis

## Chart 4 — Contract Value Distribution

Type:

* Histogram

Data:

* low
* medium
* high value

---

## Chart 5 — Budget Allocation

Type:

* Treemap

Data:

* pembagian budget kontrak

---

# Section D — Approval Analysis

## Chart 6 — Approval Bottleneck

Type:

* Funnel

Flow:
Draft → Review → Approval → Active

---

## Chart 7 — Approval Duration

Type:

* Horizontal Bar

Data:

* rata-rata approval per department

---

# 7. TAB — Workload

## Purpose

Monitoring beban kerja tim.

---

# Section A — PIC Assignment

## Chart 1 — Contract Per PIC

Type:

* Bar Chart

---

## Chart 2 — Pending Task Per PIC

Type:

* Stacked Bar

Data:

* pending
* review
* approval

---

# Section B — Department Workload

## Chart 3 — Workload Heatmap

Type:

* Heatmap

Data:

* workload per department

---

# Section C — Performance

## Chart 4 — Avg Processing Time

Type:

* Horizontal Bar

---

## Chart 5 — Renewal Completion Rate

Type:

* Progress Chart

---

# Section D — Task Monitoring

## Widgets

### Overdue Task

### Approval Queue

### Upcoming Renewal

### Staff Activity

---

# 8. Recommended Dashboard Layout

## Desktop

### Row 1

KPI Cards

---

### Row 2

Main Charts

---

### Row 3

Analysis Charts

---

### Row 4

Tables & Activity

---

# 9. Recommended Chart Library

## React

* Apache E
