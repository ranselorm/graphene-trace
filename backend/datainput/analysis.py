import numpy as np


LOWER_THRESHOLD = 20
HIGH_PRESSURE_THRESHOLD = 80
MIN_REGION_PIXELS = 10


def analyse_frame(pixels):
    matrix = np.array(pixels, dtype=float).reshape(32, 32)

    contact_mask = matrix > LOWER_THRESHOLD
    contact_area_percent = (contact_mask.sum() / 1024.0) * 100.0

    high_pressure_mask = matrix > HIGH_PRESSURE_THRESHOLD

    if high_pressure_mask.sum() >= MIN_REGION_PIXELS:
        peak_pressure_index = float(matrix[high_pressure_mask].max())
        has_high_pressure = True
    else:
        peak_pressure_index = 0.0
        has_high_pressure = False

    return {
        "peak_pressure_index": peak_pressure_index,
        "contact_area_percent": contact_area_percent,
        "has_high_pressure": has_high_pressure,
        "flagged_for_review": has_high_pressure,
    }