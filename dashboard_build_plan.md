# Contract Management Dashboard — Dashboard Build Plan

## 1. Dashboard Goal

Focus on:
* Monitor contracts
* Monitor expiration
* Track approval
* Track contract value
* Monitor workload PIC
* Analyze vendor/client
* Insight management

---

# 2. Dashboard Navigation

## Main Tabs

| Tab       | Function                 |
| --------- | ------------------------ |
| Ringkasan | Current contract status  |
| Trend     | Contract progress        |
| Analisis  | Insights & evaluation    |
| Workload  | Team workload            |

---

# 3. Global Filter Area

## Filter Components

### Date Range

Type: Date Picker

---

### Branch / Site

Type: Multi Select

---

### Vendor

Type: Search Select

---

### Contract Status

Type: Multi Select

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

Type: Multi Select

---

### PIC / Department

Type: Select

---

# 4. TAB — Ringkasan

## Purpose

Fast monitoring of contract condition.

---

# Section A — KPI Cards

## Grid Layout

4 column desktop

---

### Card 1 — Total Contract

Data: total contracts count
Trend: up/down compared to last month

---

### Card 2 — Active Contract

Data: active contracts

---

### Card 3 — Expiring Soon

Data: expires < 30 days
Highlight: warning color

---

### Card 4 — Expired Contract

Data: expired contracts
Highlight: danger color

---

### Card 5 — Pending Approval

Data: contracts awaiting approval

---

### Card 6 — Renewal Rate

Data: % renewal

---

### Card 7 — Total Contract Value

Data: total contract value

---

### Card 8 — Avg Approval Time

Data: average approval time

---

# Section B — Contract Status

## Chart 1 — Contract By Status

Type: Donut Chart
Data: Draft, Review, Pending, Active, Expired, Renewed, Rejected
Purpose: see contract distribution

---

# Section C — Expiry Monitoring

## Chart 2 — Expiry Timeline

Type: Horizontal Bar
Data: < 30 days, 30–60 days, 60–90 days, > 90 days
Purpose: monitor contracts close to expiration (HIGH PRIOR)

---

# Section D — Contract Value

## Chart 3 — Contract Value By Category

Type: Pie / Treemap
Data: Procurement, Service, Maintenance, Vendor, Partnership

---

## Chart 4 — Top Highest Contract

Type: Vertical Bar
Data: top contract values

---

# Section E — Approval Monitoring

## Chart 5 — Approval Status

Type: Stacked Bar
Data: Approved, Pending, Rejected

---

# Section F — Recent Activity

## Widgets

### Recent Contract

Mini table:
* contract_no
* vendor
* status
* end_date

---

### Upcoming Renewal

Mini table: contracts close to expiration

---

### Pending Approval

Mini table: approval queue

---

# 5. TAB — Trend

## Purpose

Monitor contract progress.

---

# Section A — Contract Growth

## Chart 1 — Contract Per Month

Type: Line Chart
Data: monthly contracts count

---

## Chart 2 — Contract Value Trend

Type: Area Chart
Data: monthly total contract value

---

# Section B — Renewal Trend

## Chart 3 — Renewal vs Expired

Type: Dual Line Chart
Data: renewed, expired
Purpose: check contract health

---

# Section C — Approval Trend

## Chart 4 — Approval Trend

Type: Stacked Area
Data: approved, rejected, pending

---

# Section D — Vendor Activity

## Chart 5 — Top Vendor Activity

Type: Bar Chart
Data: most active vendors

---

# Section E — Contract Type Trend

## Chart 6 — Category Trend

Type: Multi Line
Data: contract category trend

---

# 6. TAB — Analisis

## Purpose

Insights & evaluation.

---

# Section A — Risk Analysis

## Chart 1 — Expiry Risk

Type: Heatmap
Data: risk of contract expiration

---

## Chart 2 — Renewal Failure

Type: Horizontal Bar
Data: failed renewals

---

# Section B — Vendor Analysis

## Chart 3 — Vendor Performance

Type: Radar / Bar
Data: total contracts, renewal success, approval speed

---

# Section C — Financial Analysis

## Chart 4 — Contract Value Distribution

Type: Histogram
Data: low, medium, high value

---

## Chart 5 — Budget Allocation

Type: Treemap
Data: contract budget distribution

---

# Section D — Approval Analysis

## Chart 6 — Approval Bottleneck

Type: Funnel
Flow: Draft → Review → Approval → Active

---

## Chart 7 — Approval Duration

Type: Horizontal Bar
Data: average approval duration per department

---

# 7. TAB — Workload

## Purpose

Monitor team workload.

---

# Section A — PIC Assignment

## Chart 1 — Contract Per PIC

Type: Bar Chart

---

## Chart 2 — Pending Task Per PIC

Type: Stacked Bar
Data: pending, review, approval

---

# Section B — Department Workload

## Chart 3 — Workload Heatmap

Type: Heatmap
Data: workload per department

---

# Section C — Performance

## Chart 4 — Avg Processing Time

Type: Horizontal Bar

---

## Chart 5 — Renewal Completion Rate

Type: Progress Chart

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
