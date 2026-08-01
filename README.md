# Git Repository Health Dashboard 🚀

**Team Stack Attack | Technova Software Hackathon 2026**

A highly scalable, cloud-native DevOps telemetry dashboard designed to provide engineering teams with deep observability into their development lifecycle. By connecting directly to GitHub and persisting data in AWS RDS, we provide mathematically grounded insights into code churn, stagnation risk, and team burnout—without relying on hallucination-prone AI.

---

## 🎯 The Innovation

- **Deterministic Rules Engine:** We replaced unpredictable AI with strict mathematical thresholds to evaluate project health (0-100 score).
- **Key Engineer Risk:** Identifies "Bus Factor" by mapping the top contributor's commit share.
- **Historical Trend Analysis:** Vaults telemetry snapshots in an AWS RDS PostgreSQL database, enabling Grafana to render long-term trendlines.

## 💻 Technology Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Next.js API Routes (Node.js)
- **Data Source:** GitHub REST API v3
- **Cloud Database:** Amazon Web Services (AWS RDS PostgreSQL)
- **Observability:** Embedded Grafana Cloud

---

## 🚀 Deployment Link

- **Live AWS RDS Database Endpoint**: `git-health-db.cvmeemq66uhm.eu-north-1.rds.amazonaws.com`
- **Frontend Hosting**: Local (`localhost:3000` during presentation)

---

## ⚙️ Getting Started (Local Development)

First, install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard.
