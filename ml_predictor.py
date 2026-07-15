"""
BloodConnect Advanced ML Engine
================================
5 ML Models:
  1. XGBoost Blood Demand Forecaster        -> predict next-7-day demand per blood group
  2. GradientBoosting Shortage Risk         -> classify shortage risk per bank + blood group
  3. Logistic Regression Donor Scorer       -> reliability score 0-100 per donor
  4. K-Means Camp Location Optimizer        -> cluster donors/shortages to suggest camp cities
  5. Isolation Forest Expiry Risk Detector  -> flag at-risk inventory units
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

import joblib
from sklearn.ensemble import GradientBoostingClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

# ---------- Paths & constants ------------------------------------------------
_BASE   = os.path.dirname(os.path.abspath(__file__))
_MODELS = os.path.join(_BASE, "ml_models")
os.makedirs(_MODELS, exist_ok=True)

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
BG_RARITY    = {"O+": 1, "A+": 1, "B+": 2, "AB+": 3, "O-": 3, "A-": 3, "B-": 4, "AB-": 4}


# =============================================================================
# 1. XGBoost Blood Demand Forecaster
# =============================================================================
class DemandForecaster:
    """Predicts next-7-day blood unit demand per blood group."""

    _PATH = os.path.join(_MODELS, "demand_forecaster.joblib")

    def __init__(self):
        self.model        = None
        self.feature_cols = None
        self.is_trained   = False

    @staticmethod
    def _featurize(df):
        df = df.copy()
        df["date"]           = pd.to_datetime(df["date"])
        df["day_of_year"]    = df["date"].dt.dayofyear
        df["month"]          = df["date"].dt.month
        df["weekday"]        = df["date"].dt.weekday
        df["is_weekend"]     = (df["weekday"] >= 5).astype(int)
        df["quarter"]        = df["date"].dt.quarter
        df["is_high_season"] = df["month"].isin([6,7,8,9,10,11]).astype(int)
        df["is_festival"]    = df["month"].isin([10,11,12,1]).astype(int)
        df["bg_rarity"]      = df["blood_group"].map(BG_RARITY).fillna(2)
        df = pd.get_dummies(df, columns=["blood_group"], prefix="bg")
        return df

    @staticmethod
    def _synthetic(days=500):
        rows, base = [], datetime.now() - timedelta(days=days)
        for i in range(days):
            d, m = base + timedelta(days=i), (base + timedelta(days=i)).month
            for bg in BLOOD_GROUPS:
                bd = np.random.randint(5, 20) + (np.random.randint(5,12) if m in [6,7,8,9,10,11] else 0)
                mult = 1.6 if bg in ["O+","B+"] else (1.2 if bg=="A+" else 0.8)
                rows.append({"date": d, "blood_group": bg,
                              "demand": max(0, int(np.random.normal(bd*mult, 2)))})
        return pd.DataFrame(rows)

    def train(self, df=None):
        df = df if (df is not None and len(df) >= 50) else self._synthetic()
        feat = self._featurize(df)
        X    = feat.drop(columns=[c for c in ["date","demand"] if c in feat.columns])
        y    = df["demand"].values
        self.feature_cols = list(X.columns)
        self.model = xgb.XGBRegressor(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, random_state=42, verbosity=0)
        self.model.fit(X, y)
        self.is_trained = True
        joblib.dump({"model": self.model, "cols": self.feature_cols}, self._PATH)
        print("[ML] DemandForecaster trained.")

    def load(self):
        if os.path.exists(self._PATH):
            d = joblib.load(self._PATH)
            self.model, self.feature_cols = d["model"], d["cols"]
            self.is_trained = True
            return True
        return False

    def predict_next_week(self):
        if not self.is_trained:
            self.load() or self.train()
        results, future = {}, [datetime.now() + timedelta(days=i) for i in range(1,8)]
        for bg in BLOOD_GROUPS:
            rows = [{"date": d, "blood_group": bg, "demand": 0} for d in future]
            feat = self._featurize(pd.DataFrame(rows))
            feat = feat.drop(columns=[c for c in ["date","demand"] if c in feat.columns])
            for c in self.feature_cols:
                if c not in feat.columns:
                    feat[c] = 0
            feat  = feat[self.feature_cols]
            preds = self.model.predict(feat)
            results[bg] = {
                "total_7day": max(0, int(preds.sum())),
                "daily_avg":  round(float(preds.mean()), 1),
                "peak_day":   (datetime.now() + timedelta(days=int(preds.argmax())+1)).strftime("%A"),
            }
        return results


# =============================================================================
# 2. Gradient Boosting Shortage Risk Classifier
# =============================================================================
class ShortageRiskClassifier:
    """Classifies shortage risk: 0=low, 1=high, 2=critical per bank x blood group."""

    _PATH = os.path.join(_MODELS, "shortage_risk.joblib")

    def __init__(self):
        self.model     = None
        self.scaler    = StandardScaler()
        self.is_trained = False

    @staticmethod
    def _synthetic(n=2000):
        rows = []
        for _ in range(n):
            bg   = np.random.choice(BLOOD_GROUPS)
            cur  = np.random.randint(0, 100)
            cons = np.random.uniform(1, 20)
            exp  = np.random.randint(0, 15)
            dsld = np.random.randint(1, 30)
            days_supply = cur / max(cons, 0.1)
            risk = 2 if (days_supply < 2 or cur < 5) else (1 if days_supply < 5 else 0)
            rows.append({"current_units": cur, "avg_daily_consumption": round(cons,2),
                          "days_since_last_donation": dsld, "expiring_soon_count": exp,
                          "blood_group_rarity": BG_RARITY[bg], "risk_class": risk})
        return pd.DataFrame(rows)

    def train(self, df=None):
        df = df if (df is not None and len(df) >= 50) else self._synthetic()
        cols = ["current_units","avg_daily_consumption","days_since_last_donation",
                "expiring_soon_count","blood_group_rarity"]
        X = self.scaler.fit_transform(df[cols])
        y = df["risk_class"].values
        self.model = GradientBoostingClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True
        joblib.dump({"model": self.model, "scaler": self.scaler}, self._PATH)
        print("[ML] ShortageRiskClassifier trained.")

    def load(self):
        if os.path.exists(self._PATH):
            d = joblib.load(self._PATH)
            self.model, self.scaler = d["model"], d["scaler"]
            self.is_trained = True
            return True
        return False

    def predict(self, records):
        if not self.is_trained:
            self.load() or self.train()
        LABEL = {0: "low", 1: "high", 2: "critical"}
        out   = []
        for r in records:
            x   = np.array([[r.get("current_units",0), r.get("avg_daily_consumption",5),
                              r.get("days_since_last_donation",7), r.get("expiring_soon_count",0),
                              BG_RARITY.get(r.get("blood_group","O+"), 2)]])
            x_s = self.scaler.transform(x)
            cls  = int(self.model.predict(x_s)[0])
            prob = self.model.predict_proba(x_s)[0]
            out.append({**r, "risk_level": LABEL[cls],
                         "probability": round(float(prob.max()), 2),
                         "risk_score":  round(float(prob[1]*0.5 + prob[2]*1.0), 2)})
        return out


# =============================================================================
# 3. Logistic Regression Donor Reliability Scorer
# =============================================================================
class DonorReliabilityScorer:
    """Scores donor reliability 0-100 and predicts next donation date."""

    _PATH  = os.path.join(_MODELS, "donor_scorer.joblib")
    TIERS  = [(80,"Champion"),(60,"Reliable"),(40,"Occasional"),(0,"Inactive")]

    def __init__(self):
        self.model     = None
        self.scaler    = StandardScaler()
        self.is_trained = False

    @staticmethod
    def _synthetic(n=1500):
        rows = []
        for _ in range(n):
            freq  = np.random.randint(0, 20)
            dsld  = np.random.randint(0, 365)
            hstat = np.random.choice([1, 2, 3])
            rare  = np.random.randint(1, 5)
            appt  = np.random.randint(0, max(freq,1))
            rows.append({"donation_count": freq, "days_since_last": dsld,
                          "health_status": hstat, "bg_rarity": rare,
                          "appointment_kept_ratio": round(appt/max(freq,1),2),
                          "is_reliable": int(freq>=3 and dsld<120 and hstat<=2)})
        return pd.DataFrame(rows)

    def train(self, df=None):
        df = df if (df is not None and len(df) >= 30) else self._synthetic()
        cols = ["donation_count","days_since_last","health_status","bg_rarity","appointment_kept_ratio"]
        X_s  = self.scaler.fit_transform(df[cols])
        self.model = LogisticRegression(C=1.0, max_iter=500, random_state=42)
        self.model.fit(X_s, df["is_reliable"].values)
        self.is_trained = True
        joblib.dump({"model": self.model, "scaler": self.scaler}, self._PATH)
        print("[ML] DonorReliabilityScorer trained.")

    def load(self):
        if os.path.exists(self._PATH):
            d = joblib.load(self._PATH)
            self.model, self.scaler = d["model"], d["scaler"]
            self.is_trained = True
            return True
        return False

    def score_donor(self, info):
        if not self.is_trained:
            self.load() or self.train()
        dc, dsld = info.get("donation_count",0), info.get("days_since_last",365)
        hs, rare = info.get("health_status",2), BG_RARITY.get(info.get("blood_group","O+"),2)
        ratio    = info.get("appointment_kept_ratio", 0.5)
        x_s  = self.scaler.transform(np.array([[dc, dsld, hs, rare, ratio]]))
        prob = float(self.model.predict_proba(x_s)[0][1])
        score = int(min(100, max(0, prob*70 + min(dc*3,20) + (1-min(dsld/365,1))*10)))
        tier  = next(t for s,t in self.TIERS if score >= s)
        gap   = 90 if score >= 60 else 180
        next_d = (datetime.now() + timedelta(days=max(0, gap-(365-dsld)))).strftime("%Y-%m-%d")
        tips   = []
        if dc == 0:          tips.append("Make your first donation — every drop counts!")
        elif dsld > 180:     tips.append("You may be eligible to donate again soon.")
        if score >= 80:      tips.append("Champion donor! Your consistency saves lives.")
        elif score >= 60:    tips.append("Great reliability — keep up regular donations.")
        else:                tips.append("Donating more frequently will boost your score.")
        return {"score": score, "tier": tier, "reliability_probability": round(prob,2),
                "predicted_next_donation": next_d, "insights": tips}


# =============================================================================
# 4. K-Means Camp Location Optimizer
# =============================================================================
class CampLocationOptimizer:
    """Recommends optimal donation camp cities via K-Means clustering."""

    _PATH = os.path.join(_MODELS, "camp_optimizer.joblib")

    _DEFAULT_CITIES = [
        {"city":"Bangalore",  "donor_count":320,"shortage_score":0.70},
        {"city":"Chennai",    "donor_count":280,"shortage_score":0.60},
        {"city":"Hyderabad",  "donor_count":260,"shortage_score":0.80},
        {"city":"Mumbai",     "donor_count":410,"shortage_score":0.40},
        {"city":"Delhi",      "donor_count":500,"shortage_score":0.30},
        {"city":"Pune",       "donor_count":190,"shortage_score":0.75},
        {"city":"Coimbatore", "donor_count":120,"shortage_score":0.85},
        {"city":"Pollachi",   "donor_count": 60,"shortage_score":0.90},
        {"city":"Mysore",     "donor_count": 90,"shortage_score":0.80},
        {"city":"Kolkata",    "donor_count":350,"shortage_score":0.50},
    ]

    def __init__(self):
        self.model, self.city_data = None, None
        self.is_trained = False

    def train(self, city_data=None):
        df = pd.DataFrame(city_data or self._DEFAULT_CITIES)
        k  = min(4, len(df))
        self.model = KMeans(n_clusters=k, random_state=42, n_init=10)
        self.model.fit(df[["donor_count","shortage_score"]].values)
        self.city_data  = df
        self.is_trained = True
        joblib.dump({"model": self.model, "city_data": df}, self._PATH)
        print("[ML] CampLocationOptimizer trained.")

    def load(self):
        if os.path.exists(self._PATH):
            d = joblib.load(self._PATH)
            self.model, self.city_data = d["model"], d["city_data"]
            self.is_trained = True
            return True
        return False

    def recommend(self, city_data=None, top_n=5):
        if not self.is_trained:
            self.load() or self.train(city_data)
        df = self.city_data.copy()
        df["cluster"]  = self.model.predict(df[["donor_count","shortage_score"]].values)
        df["priority"] = df["shortage_score"]*60 + df["donor_count"].rank(pct=True)*40
        df = df.sort_values("priority", ascending=False)
        out = []
        for _, r in df.head(top_n).iterrows():
            s = float(r["shortage_score"])
            d = int(r["donor_count"])
            reason = ("Critical shortage — immediate camp needed" if s > 0.8 else
                      "High demand area — camp recommended this week" if s > 0.6 else
                      "Low donor density — awareness camp needed" if d < 100 else
                      "Good opportunity — moderate shortage with available donors")
            out.append({"city": r["city"], "donor_pool": d, "shortage_score": round(s,2),
                         "priority_score": round(float(r["priority"]),1),
                         "cluster": int(r["cluster"]), "recommendation": reason})
        return out


# =============================================================================
# 5. Isolation Forest Expiry Risk Detector
# =============================================================================
class ExpiryRiskDetector:
    """Flags blood inventory at high expiry risk using anomaly detection."""

    _PATH = os.path.join(_MODELS, "expiry_risk.joblib")

    def __init__(self):
        self.model     = None
        self.scaler    = StandardScaler()
        self.is_trained = False

    @staticmethod
    def _synthetic(n=1000):
        rows = []
        for _ in range(n):
            days  = np.random.randint(0, 42)
            dr    = np.random.uniform(0.5, 15)
            stock = np.random.randint(1, 80)
            rows.append({"days_to_expiry": days, "demand_rate": round(dr,2),
                          "current_stock": stock, "supply_ratio": round(stock/max(dr,0.1),2)})
        return pd.DataFrame(rows)

    def train(self, df=None):
        df = df if (df is not None and len(df) >= 20) else self._synthetic()
        cols = ["days_to_expiry","demand_rate","current_stock","supply_ratio"]
        X_s  = self.scaler.fit_transform(df[cols].values)
        self.model = IsolationForest(contamination=0.15, n_estimators=150, random_state=42)
        self.model.fit(X_s)
        self.is_trained = True
        joblib.dump({"model": self.model, "scaler": self.scaler}, self._PATH)
        print("[ML] ExpiryRiskDetector trained.")

    def load(self):
        if os.path.exists(self._PATH):
            d = joblib.load(self._PATH)
            self.model, self.scaler = d["model"], d["scaler"]
            self.is_trained = True
            return True
        return False

    def detect(self, records):
        if not self.is_trained:
            self.load() or self.train()
        out = []
        ORDER = {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3}
        for r in records:
            days  = r.get("days_to_expiry", 30)
            dr    = r.get("demand_rate", 5)
            stock = r.get("units", 10)
            supply = stock / max(dr, 0.1)
            x_s  = self.scaler.transform(np.array([[days, dr, stock, supply]]))
            pred  = self.model.predict(x_s)[0]
            score = float(self.model.decision_function(x_s)[0])
            risk  = ("CRITICAL" if days<=3 or pred==-1 else
                     "HIGH" if days<=7 else
                     "MEDIUM" if days<=14 else "LOW")
            action = (f"URGENT: {stock} units expire in {days}d — notify hospitals" if risk=="CRITICAL" else
                      f"Alert: distribute {stock} units within {days} days" if risk=="HIGH" else
                      f"Monitor: plan distribution before expiry" if risk=="MEDIUM" else
                      "No action needed")
            out.append({**r, "risk_level": risk, "anomaly_score": round(score,3),
                         "days_of_supply": round(supply,1), "action": action})
        out.sort(key=lambda x: ORDER.get(x["risk_level"],4))
        return out


# =============================================================================
# Singleton Engine
# =============================================================================
class BloodMLEngine:
    def __init__(self):
        self.demand_forecaster   = DemandForecaster()
        self.shortage_classifier = ShortageRiskClassifier()
        self.donor_scorer        = DonorReliabilityScorer()
        self.camp_optimizer      = CampLocationOptimizer()
        self.expiry_detector     = ExpiryRiskDetector()

    def initialize(self):
        print("[ML] Initializing BloodMLEngine ...")
        self.demand_forecaster.load()   or self.demand_forecaster.train()
        self.shortage_classifier.load() or self.shortage_classifier.train()
        self.donor_scorer.load()        or self.donor_scorer.train()
        self.camp_optimizer.load()      or self.camp_optimizer.train()
        self.expiry_detector.load()     or self.expiry_detector.train()
        print("[ML] All models ready.")

    def retrain_all(self, demand_df=None, shortage_records=None,
                    donor_df=None, city_data=None, inventory_df=None):
        self.demand_forecaster.train(demand_df)
        self.shortage_classifier.train(shortage_records)
        self.donor_scorer.train(donor_df)
        self.camp_optimizer.train(city_data)
        self.expiry_detector.train(inventory_df)


# Global singleton imported by Flask
ml_engine = BloodMLEngine()
