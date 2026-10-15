"""MCX gold futures contract mechanics (Track 03 brief / MCX contract specifications)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Contract:
    symbol: str
    lot_g: int          # grams delivered per lot
    quote_g: int        # price is quoted per this many grams
    purity: float       # fineness the quote refers to
    expiry_window: str  # day-of-month window of the delivery month


CONTRACTS: dict[str, Contract] = {
    "GOLDM": Contract("GOLDM", lot_g=100, quote_g=10, purity=0.995, expiry_window="3rd-5th"),
    "GOLDTEN": Contract("GOLDTEN", lot_g=10, quote_g=10, purity=0.999, expiry_window="27th-31st"),
    "GOLDGUINEA": Contract("GOLDGUINEA", lot_g=8, quote_g=8, purity=0.999, expiry_window="27th-31st"),
    "GOLDPETAL": Contract("GOLDPETAL", lot_g=1, quote_g=1, purity=0.999, expiry_window="27th-31st"),
}
SYMBOLS = tuple(CONTRACTS)
BASE = "GOLDTEN"  # reference leg: 999 purity, liquid, shares expiry dates with GUINEA and PETAL


def fine_per_gram(symbol: str, price: float) -> float:
    """Quoted price -> rupees per gram of fine gold (quote grams, then purity)."""
    c = CONTRACTS[symbol]
    return price / c.quote_g / c.purity


def quote_units(symbol: str, lots: int) -> float:
    """Number of quote units held, so P&L = price change x quote_units."""
    c = CONTRACTS[symbol]
    return lots * c.lot_g / c.quote_g

