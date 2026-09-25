from pathlib import Path

import pandas as pd


# =========================================================
# Configuration
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "Quality_Data_v3.xlsx"

OUTPUT_DIRECTORY = PROJECT_ROOT / "public" / "data"

OUTPUT_FILE = OUTPUT_DIRECTORY / "defects.json"


# =========================================================
# Expected categorical values
# =========================================================

VALID_CAR_MODELS = {
    "Base",
    "iX0M",
    "Long",
    "Pick-Up",
    "Alpina",
}

VALID_MOTOR_TYPES = {
    "Long Range",
    "High Performance",
}

VALID_DESIGN_PACKAGES = {
    "Race",
    "Offroad",
    "Luxury",
}

VALID_DEFECT_CATEGORIES = {
    "Cosmetic",
    "Functional",
    "Electrical",
    "Structural",
    "Safety",
}

VALID_SHIFTS = {
    "Morning",
    "Afternoon",
    "Night",
}

VALID_RESOLUTION_STATUSES = {
    "Open",
    "In Progress",
    "Resolved",
}


# =========================================================
# Canonical station names
# =========================================================
#
# Station ID is treated as the stable identifier.
# The raw Station Name field contains spelling, spacing,
# and capitalization inconsistencies.
#
# We therefore use Station ID to assign one canonical
# display name to every record belonging to that station.
# =========================================================

STATION_NAMES = {
    "ST-01": "Body Shop Framing",
    "ST-02": "Body Shop Welding",
    "ST-03": "Paint Shop Primer",
    "ST-04": "Paint Shop Topcoat",
    "ST-05": "Paint Inspection Booth",
    "ST-06": "Underbody Assembly",
    "ST-07": "Door Panel Fitting",
    "ST-08": "Wire Harness Installation",
    "ST-09": "EV Battery Installation",
    "ST-10": "Battery End-of-Line Test",
    "ST-11": "Dashboard Installation",
    "ST-12": "Seat Installation",
    "ST-13": "Windshield Installation",
    "ST-14": "Brake System Assembly",
    "ST-15": "Steering Column Assembly",
    "ST-16": "Tire and Rim Mounting",
    "ST-17": "Charging System Inspection",
    "ST-18": "Final Quality Gate",
}


# =========================================================
# Load raw dataset
# =========================================================

print("Loading raw dataset...")

df = pd.read_excel(INPUT_FILE)

print(f"Raw records: {len(df):,}")


# =========================================================
# Validate required columns
# =========================================================

required_columns = [
    "Defect ID",
    "Report Date",
    "Report Time",
    "Production Date",
    "VIN",
    "Car Model",
    "Motor Type",
    "Design Package",
    "Station ID",
    "Station Name",
    "Part Number",
    "Part Name",
    "Supplier",
    "Defect Name",
    "Defect Category",
    "Severity Rating",
    "Inspector ID",
    "Production Shift",
    "Resolution Status",
    "Resolution Timestamp",
    "Resolution Time (hours)",
    "Root Cause Identified",
    "Rework Time (minutes)",
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )


# =========================================================
# Validate categorical values
# =========================================================

def validate_categories(
    column_name: str,
    valid_values: set[str],
) -> None:
    """
    Make sure a categorical field contains only values
    defined by the case-study specification.
    """

    actual_values = set(df[column_name].dropna().unique())

    invalid_values = actual_values - valid_values

    if invalid_values:
        raise ValueError(
            f"Invalid values found in '{column_name}': "
            f"{sorted(invalid_values)}"
        )


validate_categories("Car Model", VALID_CAR_MODELS)
validate_categories("Motor Type", VALID_MOTOR_TYPES)
validate_categories("Design Package", VALID_DESIGN_PACKAGES)
validate_categories("Defect Category", VALID_DEFECT_CATEGORIES)
validate_categories("Production Shift", VALID_SHIFTS)
validate_categories(
    "Resolution Status",
    VALID_RESOLUTION_STATUSES,
)


# =========================================================
# Validate severity
# =========================================================

invalid_severity = df[
    (df["Severity Rating"] < 1)
    | (df["Severity Rating"] > 10)
]

if not invalid_severity.empty:
    raise ValueError(
        "Severity Rating contains values outside 1-10."
    )


# =========================================================
# Validate date window
# =========================================================

START_DATE = "2026-01-01"
END_DATE = "2026-06-30"

report_dates = pd.to_datetime(
    df["Report Date"],
    errors="coerce",
)

production_dates = pd.to_datetime(
    df["Production Date"],
    errors="coerce",
)

if report_dates.isna().any():
    raise ValueError("Invalid Report Date values found.")

if production_dates.isna().any():
    raise ValueError("Invalid Production Date values found.")

report_outside_window = (
    (report_dates < START_DATE)
    | (report_dates > END_DATE)
)

production_outside_window = (
    (production_dates < START_DATE)
    | (production_dates > END_DATE)
)

if report_outside_window.any():
    raise ValueError(
        "Report Date contains records outside the "
        "2026-01-01 to 2026-06-30 window."
    )

if production_outside_window.any():
    raise ValueError(
        "Production Date contains records outside the "
        "2026-01-01 to 2026-06-30 window."
    )


# =========================================================
# Check Defect ID uniqueness
# =========================================================

duplicate_defect_ids = df["Defect ID"].duplicated().sum()

if duplicate_defect_ids > 0:
    raise ValueError(
        f"Found {duplicate_defect_ids} duplicate Defect IDs."
    )


# =========================================================
# Preserve original station name
# =========================================================

df["Station Name Original"] = df["Station Name"]


# =========================================================
# Normalize station names
# =========================================================

df["Station Name"] = df["Station ID"].map(
    STATION_NAMES
)

unknown_stations = df["Station Name"].isna()

if unknown_stations.any():
    unknown_ids = (
        df.loc[unknown_stations, "Station ID"]
        .unique()
        .tolist()
    )

    raise ValueError(
        f"Unknown Station IDs found: {unknown_ids}"
    )


# =========================================================
# Identify potential duplicate records
# =========================================================
#
# These records are NOT removed.
#
# The case study warns that duplicate reporting may exist,
# but the available fields do not prove that two matching
# records represent the same physical defect.
#
# We therefore add a flag for investigation.
# =========================================================

duplicate_columns = [
    "VIN",
    "Production Date",
    "Station ID",
    "Part Number",
    "Defect Name",
]

df["Potential Duplicate"] = df.duplicated(
    subset=duplicate_columns,
    keep=False,
)


# =========================================================
# Convert records to JSON-compatible dictionaries
# =========================================================

records = df.astype(object).where(pd.notna(df), None).to_dict(
    orient="records"
)


# =========================================================
# Create output directory
# =========================================================

OUTPUT_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# Export JSON
# =========================================================

import json

with OUTPUT_FILE.open(
    "w",
    encoding="utf-8",
) as file:

    json.dump(
        records,
        file,
        ensure_ascii=False,
        indent=2,
    )
# =========================================================
# Preparation summary
# =========================================================

potential_duplicate_records = int(
    df["Potential Duplicate"].sum()
)

station_names_normalized = int(
    (
        df["Station Name"] != df["Station Name Original"]
    ).sum()
)

resolved_without_root_cause = int(
    (
        df["Resolution Status"].eq("Resolved")
        & df["Root Cause Identified"].isna()
    ).sum()
)

print("\n===== PREPARATION SUMMARY =====")

print(f"Raw records: {len(df):,}")
print(
    f"Potential duplicate records flagged: "
    f"{potential_duplicate_records:,}"
)
print(
    f"Station names normalized: "
    f"{station_names_normalized:,}"
)
print(
    f"Resolved records without root cause: "
    f"{resolved_without_root_cause:,}"
)
print(f"Output file: {OUTPUT_FILE}")

print("\nData preparation completed successfully.")