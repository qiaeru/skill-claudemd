def total_cents(lines):
    return sum(line["unit_cents"] * line["qty"] for line in lines)
