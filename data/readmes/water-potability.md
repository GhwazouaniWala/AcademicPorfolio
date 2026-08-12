# Water Potability — MLOps Pipeline

A binary classification pipeline that predicts whether a water sample is **potable** (safe to drink) from nine physico-chemical measurements, using an XGBoost classifier tuned by grid search.

The repository holds two parallel expressions of the same work:

| Artifact | Role |
| --- | --- |
| [`notebooks/modelpipeline.ipynb`](notebooks/modelpipeline.ipynb) | **Exploration.** Interactive, cell-by-cell: EDA, missing-value analysis, outlier diagnostics, box plots, grid search, evaluation. |
| [`modules.py`](modules.py) + [`main.py`](main.py) | **Productionization.** The same steps refactored into reusable functions with a persisted model artifact. |

This is the core MLOps move: a notebook is a *record of thinking*, not a deliverable. Moving the logic into importable functions is what makes it testable, schedulable, and reproducible.

---

## 1. The dataset

[`water_potability.csv`](water_potability.csv) — 3,276 samples, 9 features + 1 target.

| Column | Meaning |
| --- | --- |
| `ph` | Acidity / alkalinity (0–14) |
| `Hardness` | Dissolved calcium & magnesium (mg/L) |
| `Solids` | Total dissolved solids (ppm) |
| `Chloramines` | Disinfectant concentration (ppm) |
| `Sulfate` | Dissolved sulfates (mg/L) |
| `Conductivity` | Electrical conductivity (μS/cm) — proxy for ionic content |
| `Organic_carbon` | Total organic carbon (ppm) |
| `Trihalomethanes` | Disinfection by-products (μg/L) |
| `Turbidity` | Light-scattering / cloudiness (NTU) |
| **`Potability`** | **Target** — `1` = potable, `0` = not potable |

### Two properties that shape every downstream decision

**Missing values are concentrated in three columns:**

```
ph                 491   (15.0%)
Sulfate            781   (23.8%)
Trihalomethanes    162   ( 4.9%)
```

Dropping rows would cost roughly a third of the dataset. Imputation is the only reasonable option.

**The classes are imbalanced** — roughly 61% not-potable / 39% potable. This is why accuracy alone is a misleading metric here (see §6).

---

## 2. Pipeline overview

```
water_potability.csv
        │
        ▼
┌───────────────────────┐
│ prepare_data()        │   KNN imputation (k=5, distance-weighted)
│                       │   IQR outlier clipping (1.5×IQR fences)
└───────────┬───────────┘
            │  X (9 features), Y (Potability)
            ▼
┌───────────────────────┐
│ train_model()         │   80/20 split (random_state=42)
│                       │   StandardScaler (fit on train only)
│                       │   GridSearchCV: 729 combos × 5 folds
└───────────┬───────────┘
            │  best_model, scaler
            ▼
┌───────────────────────┐
│ save_model()          │   joblib → xgb_model.pkl  {model, scaler}
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│ evaluate_model()      │   accuracy, confusion matrix,
│                       │   precision/recall/F1, heatmap
└───────────────────────┘
```

[`main.py`](main.py) is the orchestrator and implements a **train-once-then-reuse** cache: if `xgb_model.pkl` exists it loads it; otherwise it trains and saves. Grid search over 729 configurations is expensive, so you pay that cost once.

---

## 3. Data preparation — `prepare_data()`

Defined in [`modules.py:17`](modules.py:17).

### 3.1 KNN imputation

```python
imputer = KNNImputer(n_neighbors=5, weights="distance")
X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)
```

**Concept.** Rather than filling a gap with a global constant (mean/median), KNN imputation finds the 5 most similar rows — using the features that *are* present — and fills the gap with their weighted average. `weights="distance"` makes closer neighbours count more, so the imputed value respects local structure in the data instead of flattening everything toward the global centre.

**Trade-off.** Mean imputation is O(1) and trivially reproducible at inference time. KNN imputation is O(n²) in the number of rows and requires keeping the *entire training set* around to impute a new sample. It preserves variance and inter-feature relationships far better — the right call when 24% of a column is missing.

Verified result: all nine feature columns report `0` nulls after this step.

### 3.2 IQR outlier clipping (winsorization)

```python
Q1, Q3 = X[col].quantile(0.25), X[col].quantile(0.75)
IQR = Q3 - Q1
lower, upper = Q1 - 1.5*IQR, Q3 + 1.5*IQR
X[col] = X[col].clip(lower, upper)
```

**Concept.** The interquartile range is the middle 50% of the data. Tukey's rule flags anything more than 1.5×IQR outside that band as an outlier. Instead of **deleting** those rows, this pipeline **clips** them — pulls them back to the fence. That is winsorization.

**Why clip rather than drop.** Clipping caps the influence of extreme values while keeping every row and every label — important when the dataset is only 3,276 rows and the minority class is already scarce. It also keeps the row count stable, which keeps `X` and `Y` aligned without index bookkeeping.

Measured impact per column (from the notebook):

```
ph              2.32%      Conductivity     0.34%
Hardness        2.53%      Organic_carbon   0.76%
Solids          1.43%      Trihalomethanes  0.82%
Chloramines     1.86%      Turbidity        0.58%
Sulfate         1.74%
```

Under 3% touched everywhere — the clipping is conservative and the box plots re-drawn afterwards confirm the tails are pulled in without collapsing the distributions.

---

## 4. Training — `train_model()`

Defined in [`modules.py:40`](modules.py:40).

### 4.1 Train/test split

```python
train_test_split(X, Y, test_size=0.2, random_state=42)
```

80% train (2,620 rows) / 20% test (656 rows). `random_state=42` **pins the shuffle**, so the same rows land in the same split on every run — a precondition for comparing two experiments and concluding anything about the model rather than the luck of the draw.

> Note: the split is not stratified. With a 61/39 class balance the resulting test set holds 412 negatives and 244 positives, so it happens to be representative — but `stratify=Y` would guarantee it.

### 4.2 Feature scaling

```python
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)     # transform only — never fit
```

**Concept.** `StandardScaler` maps each feature to zero mean and unit variance: `z = (x − μ) / σ`. The raw features live on wildly different scales (`Solids` ranges to ~61,000 while `pH` sits in 0–14).

The critical detail is `fit_transform` on train, `transform` on test. `μ` and `σ` are **learned parameters**, derived from training data only. Calling `fit` on the test set would let test-set statistics bleed into the pipeline — **data leakage** — producing an optimistic score that evaporates in production.

> Tree ensembles like XGBoost are scale-invariant by construction (splits are threshold comparisons), so scaling doesn't change XGBoost's accuracy. It's kept here for consistency and so the persisted preprocessing generalizes if the estimator is ever swapped for a distance- or gradient-based one.

### 4.3 The model: XGBoost

```python
XGBClassifier(objective='binary:logistic', eval_metric='logloss')
```

**Concept.** XGBoost is *gradient-boosted decision trees*: an ensemble built sequentially, where each new shallow tree is fit to the residual errors of the ensemble so far. Many weak learners compose into a strong one. It handles non-linear feature interactions and mixed scales without manual feature engineering, which makes it a strong default for small-to-medium tabular problems like this one.

- `objective='binary:logistic'` — optimize log-odds, output a calibrated probability in [0, 1].
- `eval_metric='logloss'` — score by cross-entropy, which penalizes *confident* wrong predictions more than tentative ones.

### 4.4 Hyperparameter tuning: `GridSearchCV`

```python
param_grid = {
    'max_depth':        [3, 5, 7],       # tree complexity
    'learning_rate':    [0.01, 0.05, 0.1],
    'n_estimators':     [200, 400, 600], # number of boosting rounds
    'subsample':        [0.7, 0.8, 1.0], # row sampling per tree
    'colsample_bytree': [0.7, 0.8, 1.0], # column sampling per tree
    'min_child_weight': [1, 3, 5],       # minimum leaf weight
}
GridSearchCV(xgb, param_grid, cv=5, scoring='accuracy', n_jobs=-1, verbose=2)
```

**Hyperparameters vs. parameters.** Parameters (the tree split thresholds) are *learned* from data during `fit`. Hyperparameters (depth, learning rate, …) are *chosen* before training and control how learning happens. They must be selected by search.

**What each knob does:**
- `max_depth` — deeper trees capture more interaction but overfit faster.
- `learning_rate` — how much each tree contributes. Lower is more robust but needs more trees. `learning_rate` and `n_estimators` trade off directly.
- `subsample` / `colsample_bytree` — stochastic sampling of rows/columns per tree. Decorrelates the ensemble; a regularizer.
- `min_child_weight` — minimum evidence required to create a leaf. Higher values block the model from carving out splits that fit noise.

**Grid search + 5-fold cross-validation.** The grid is a full Cartesian product: 3×3×3×3×3×3 = **729 configurations**. Each is evaluated with 5-fold CV — the training set is cut into 5 parts, the model trains on 4 and validates on 1, rotating through all 5 and averaging. That's **3,645 model fits**.

CV matters because a single validation split can flatter or punish a configuration by accident. Averaging over 5 folds makes the estimate far more stable, and — crucially — the held-out test set is never touched during tuning, so it remains an honest final judge.

`n_jobs=-1` parallelizes across all CPU cores; `verbose=2` streams per-fit progress.

**Selected configuration** (from the notebook run):

```python
{'colsample_bytree': 1.0, 'learning_rate': 0.01, 'max_depth': 7,
 'min_child_weight': 1, 'n_estimators': 200, 'subsample': 0.8}
```

`grid.best_estimator_` is already refit on the full training set — scikit-learn does that automatically (`refit=True` by default), so it's ready to use.

---

## 5. Model persistence — `save_model()` / `load_model()`

```python
joblib.dump({'model': model, 'scaler': scaler}, filename)
```

Defined in [`modules.py:84`](modules.py:84). Serializes to [`xgb_model.pkl`](xgb_model.pkl).

**Concept.** A trained model is worth nothing if you can't move it out of the process that trained it. `joblib` is preferred over plain `pickle` for scikit-learn objects because it handles large NumPy arrays efficiently.

The key design decision is that **the scaler is serialized alongside the model**. A model and its preprocessing are a single unit: predicting on an unscaled sample with a model trained on scaled data yields silent garbage — no exception, just wrong numbers. Bundling them makes it structurally impossible to load one without the other.

**Caveats to be aware of:** pickle artifacts are tied to the library versions that wrote them (a `scikit-learn` or `xgboost` upgrade can break the load), and unpickling executes code — never load a `.pkl` from an untrusted source. Pinning versions in a lockfile is what makes this artifact genuinely reproducible.

---

## 6. Evaluation — `evaluate_model()`

Defined in [`modules.py:67`](modules.py:67). Reports accuracy, a confusion matrix, a full classification report, and a seaborn heatmap.

**Held-out test results from the notebook:**

```
Accuracy: 0.665

Confusion Matrix
                 Predicted 0   Predicted 1
   Actual 0          373            39
   Actual 1          181            63

              precision    recall  f1-score   support
           0       0.67      0.91      0.77       412
           1       0.62      0.26      0.36       244
    accuracy                           0.66       656
```

### Reading these numbers

- **Confusion matrix.** Rows = truth, columns = prediction. Diagonal = correct. The bottom-left cell (181) is **false negatives**: unsafe water classified as potable — in a drinking-water context, the most costly error type by a wide margin.
- **Precision** (`TP / (TP+FP)`) — of the samples called potable, how many really were? 0.62.
- **Recall** (`TP / (TP+FN)`) — of the truly potable samples, how many did we catch? **0.26.** The model finds only a quarter of them.
- **F1** — harmonic mean of the two; 0.36 for the positive class.

**The headline lesson.** 66% accuracy sounds passable, but predicting "not potable" for *every* sample would score 63%. The model is barely beating the majority-class baseline, and the class-1 recall of 0.26 exposes why: it has learned to hedge toward the majority class. **This is exactly the failure mode that accuracy hides on imbalanced data** — which is why the confusion matrix and per-class report are printed, not just the single number.

Concrete levers if you want to improve this: `scoring='roc_auc'` or `'f1'` in the grid search instead of `'accuracy'`; `scale_pos_weight` in XGBoost to reweight the minority class; a tuned decision threshold instead of the default 0.5; or resampling (SMOTE). It's also worth acknowledging that this dataset is synthetic and known to have weak feature-target signal — a ceiling no amount of tuning fully escapes.

---

## 7. Running the pipeline

```bash
make run
```

Which invokes [`main.py`](main.py):

```python
X, Y = prepare_data()
if os.path.exists(MODEL_PATH):
    best_model, scaler = load_model(MODEL_PATH)   # cache hit
else:
    best_model, scaler = train_model(X, Y)
    save_model(best_model, scaler, MODEL_PATH)
evaluate_model(best_model, X, Y, scaler)
```

To force a retrain, delete the artifact:

```bash
rm xgb_model.pkl && make run
```

Clean bytecode caches:

```bash
make clean
```

### Dependencies

```bash
pip install pandas numpy matplotlib seaborn scikit-learn xgboost joblib
```

---

## 8. MLOps concepts this pipeline demonstrates

| Concept | Where it shows up |
| --- | --- |
| **Notebook → module refactor** | Notebook cells become named functions in `modules.py`; `main.py` orchestrates. Code becomes importable, testable, and callable from a scheduler or API. |
| **Separation of concerns** | Prepare / train / evaluate / persist are four independent functions. Any one can be changed or tested without touching the others. |
| **Reproducibility** | `random_state=42` pins the split; the grid is declarative; the artifact is versioned on disk. Same input → same output. |
| **Leakage prevention** | `scaler.fit` on train only, `transform` on test. The single most common silent killer of ML projects. |
| **Cross-validation** | 5-fold CV inside the search keeps the test set pristine for the final, honest estimate. |
| **Model artifact + bundled preprocessing** | Model and scaler travel together in one `.pkl` — train/serve skew is prevented by construction. |
| **Idempotent, cached runs** | `main.py` skips a 3,645-fit search when the artifact already exists. |
| **Build automation** | The `Makefile` gives a stable entry point (`make run`) independent of interpreter paths — the same target CI would invoke. |
| **Metric selection under imbalance** | Accuracy is reported *and* immediately contextualized against the majority-class baseline. |

---

## 9. Known gaps

Honest accounting of what this pipeline does **not** yet do, and what's currently broken.

### Bugs

1. **Hardcoded absolute path.** [`modules.py:12`](modules.py:12) reads `/home/wala/ml_project/.../water_potability.csv`, which does not exist on any other machine — including this repository's own checkout on Windows. The CSV sits next to the code; the path should be relative.
2. **Return-signature mismatch.** `train_model()` returns **six** values ([`modules.py:64`](modules.py:64)) but `main.py` unpacks **two** ([`main.py:17`](main.py:17)). The training branch raises `ValueError: too many values to unpack` — it only stays hidden because `xgb_model.pkl` is committed, so the cache branch always wins. Delete the artifact and the pipeline fails.
3. **`main.py` evaluates on the full dataset,** training rows included ([`main.py:20`](main.py:20)). Any accuracy it prints is inflated by memorized training data and is not comparable to the notebook's honest 0.665 test score. The train/test split lives inside `train_model` and is never returned to the caller.
4. **Imputer and clip ranges are not persisted.** Both are fit inside `prepare_data()` and discarded. A new sample at inference time cannot be preprocessed identically to training — the deployment story is incomplete despite the scaler being saved.
5. **Preprocessing is fit before the split.** The KNN imputer and IQR fences see all 3,276 rows, including the test set. This is a mild form of leakage; the correct construction is a `sklearn.pipeline.Pipeline` fit inside each CV fold.

### Missing infrastructure

- No `requirements.txt` / lockfile — the pickle's version compatibility is unpinned.
- No `.gitignore`; `__pycache__/*.pyc` is committed.
- No CI workflow, despite the commit message `CI`.
- No tests, no logging (uses `print`), no experiment tracking (MLflow/W&B), no data or model versioning (DVC), no inference API, no drift monitoring.
- `plt.show()` inside `evaluate_model` blocks on a GUI window — it will hang a headless CI runner. Saving to a file is the automation-friendly form.

These are the natural next steps if this project moves from coursework toward a genuinely operational pipeline.
