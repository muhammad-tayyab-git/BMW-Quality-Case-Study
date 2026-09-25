from pathlib import Path
import pandas as pd


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "Quality_Data_v3.xlsx"


# ---------------------------------------------------------
# Load the raw Excel dataset
# ---------------------------------------------------------

df = pd.read_excel(DATA_FILE)


# ---------------------------------------------------------
# Basic information
# ---------------------------------------------------------

print("\n===== DATASET INFORMATION =====")

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\nColumns:")

for index, column in enumerate(df.columns, start=1):
    print(f"{index}. {column}")


# ---------------------------------------------------------
# Data types
# ---------------------------------------------------------

print("\n===== DATA TYPES =====")

print(df.dtypes)


# ---------------------------------------------------------
# Missing values
# ---------------------------------------------------------

print("\n===== MISSING VALUES =====")

missing = df.isna().sum()

print(missing)


# ---------------------------------------------------------
# First five records
# ---------------------------------------------------------

print("\n===== FIRST FIVE RECORDS =====")

print(df.head())
# ---------------------------------------------------------
# Resolution status analysis
# ---------------------------------------------------------

print("\n===== RESOLUTION STATUS =====")

print(
    df["Resolution Status"].value_counts(dropna=False)
)


# ---------------------------------------------------------
# Resolution fields by status
# ---------------------------------------------------------

print("\n===== RESOLUTION FIELDS BY STATUS =====")

resolution_check = (
    df.groupby("Resolution Status")
    [
        [
            "Resolution Timestamp",
            "Resolution Time (hours)",
            "Root Cause Identified",
            "Rework Time (minutes)",
        ]
    ]
    .agg(lambda column: column.isna().sum())
)

print(resolution_check)
# ---------------------------------------------------------
# Categorical value checks
# ---------------------------------------------------------

print("\n===== CAR MODELS =====")
print(df["Car Model"].value_counts())


print("\n===== MOTOR TYPES =====")
print(df["Motor Type"].value_counts())


print("\n===== DESIGN PACKAGES =====")
print(df["Design Package"].value_counts())


print("\n===== DEFECT CATEGORIES =====")
print(df["Defect Category"].value_counts())


print("\n===== PRODUCTION SHIFTS =====")
print(df["Production Shift"].value_counts())


print("\n===== RESOLUTION STATUSES =====")
print(df["Resolution Status"].value_counts())

# ---------------------------------------------------------
# Station ID / Station Name consistency
# ---------------------------------------------------------

print("\n===== STATION INFORMATION =====")

station_names = (
    df.groupby("Station ID")["Station Name"]
    .nunique()
    .sort_values(ascending=False)
)

print("\nNumber of different names per Station ID:")
print(station_names)


print("\n===== STATION NAME VARIANTS =====")

station_variants = (
    df.groupby("Station ID")["Station Name"]
    .unique()
)

for station_id, names in station_variants.items():
    if len(names) > 1:
        print(f"\n{station_id}:")
        for name in names:
            print(f"  - {name}")
            

# ---------------------------------------------------------
# Data validation checks
# ---------------------------------------------------------

print("\n===== DATA VALIDATION =====")


# ---------------------------------------------------------
# Severity range
# ---------------------------------------------------------

print("\nSeverity values:")
print(sorted(df["Severity Rating"].unique()))

print("\nSeverity outside 1-10:")
print(
    df[
        (df["Severity Rating"] < 1)
        | (df["Severity Rating"] > 10)
    ][
        ["Defect ID", "Severity Rating"]
    ]
)


# ---------------------------------------------------------
# Date range
# ---------------------------------------------------------

print("\nReport date range:")
print(df["Report Date"].min(), "→", df["Report Date"].max())

print("\nProduction date range:")
print(
    df["Production Date"].min(),
    "→",
    df["Production Date"].max()
)


# ---------------------------------------------------------
# Duplicate Defect IDs
# ---------------------------------------------------------

print("\nDuplicate Defect IDs:")
print(
    df["Defect ID"]
    .duplicated()
    .sum()
)


# ---------------------------------------------------------
# Duplicate VINs
# ---------------------------------------------------------

print("\nUnique VINs:")
print(df["VIN"].nunique())

print("\nTotal records:")
print(len(df))


# ---------------------------------------------------------
# Potential duplicate defect reports
# ---------------------------------------------------------

duplicate_columns = [
    "VIN",
    "Production Date",
    "Station ID",
    "Part Number",
    "Defect Name",
]

potential_duplicates = df.duplicated(
    subset=duplicate_columns,
    keep=False,
)

print("\nPotential duplicate records:")
print(potential_duplicates.sum())

print("\nPotential duplicate groups:")
print(
    df.loc[
        potential_duplicates,
        duplicate_columns
    ]
    .value_counts()
    .head(20)
)