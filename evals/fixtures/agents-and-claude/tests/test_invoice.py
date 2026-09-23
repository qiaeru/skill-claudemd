from src.billing.invoice import total_cents


def test_total():
    assert total_cents([{"unit_cents": 250, "qty": 2}]) == 500
