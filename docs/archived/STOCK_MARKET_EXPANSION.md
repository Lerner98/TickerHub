# Stock Market Expansion Plan

## Current State
- ✅ CoinGecko API for crypto data
- ✅ SQLite database for storage
- ✅ FastAPI backend
- ✅ Telegram bot notifications
- ✅ Google Gemini for natural language queries

## API Strategy

### Crypto APIs (Keep Current)
```
CoinGecko Free API
- Rate limit: 10-30 calls/min
- Good for: Price data, market caps, historical data
- No upgrade needed unless hitting limits
```

### Stock Market APIs (New)
```
Primary: Finnhub (Recommended)
- Free tier: 60 calls/min
- Coverage: US stocks, forex, crypto
- Real-time data on free tier
- API Key: https://finnhub.io/

Backup: Alpha Vantage
- Free tier: 25 calls/day (too limited)
- Good for: Historical data
- Use only if Finnhub limits hit

Alternative: yfinance (Python library)
- No API key needed
- Unofficial Yahoo Finance scraper
- Risk: Can break if Yahoo changes their site
```

## Architecture Changes

### 1. Environment Variables (.env)
```bash
# Existing
COINGECKO_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
TELEGRAM_BOT_TOKEN=your_token_here

# New
FINNHUB_API_KEY=your_key_here
ALPHA_VANTAGE_KEY=your_key_here  # Optional backup
```

### 2. Database Schema Updates (SQLite)

```sql
-- Update assets table to support both types
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK(asset_type IN ('crypto', 'stock')),
    coingecko_id TEXT,  -- For crypto
    finnhub_symbol TEXT,  -- For stocks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, asset_type)
);

-- Update watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    asset_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    UNIQUE(user_id, asset_id)
);

-- Update alerts with asset type awareness
CREATE TABLE IF NOT EXISTS price_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    asset_id INTEGER NOT NULL,
    target_price REAL NOT NULL,
    condition TEXT CHECK(condition IN ('above', 'below')),
    triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- New: Store market metadata for stocks
CREATE TABLE IF NOT EXISTS stock_metadata (
    symbol TEXT PRIMARY KEY,
    company_name TEXT,
    sector TEXT,
    industry TEXT,
    market_cap REAL,
    pe_ratio REAL,
    dividend_yield REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Backend Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── crypto.py      # Existing
│   │   │   ├── stocks.py      # NEW
│   │   │   ├── assets.py      # NEW - Unified search
│   │   │   ├── watchlist.py   # Update to handle both
│   │   │   └── alerts.py      # Update to handle both
│   ├── services/
│   │   ├── market_data/
│   │   │   ├── __init__.py
│   │   │   ├── base.py        # NEW - Base class
│   │   │   ├── coingecko.py   # Existing, refactor
│   │   │   ├── finnhub.py     # NEW
│   │   │   └── factory.py     # NEW - Service factory
│   │   ├── gemini_service.py  # Update prompts
│   │   └── telegram_bot.py    # Update message formatting
│   ├── models/
│   │   ├── asset.py           # NEW - Unified asset model
│   │   ├── crypto.py          # Existing
│   │   └── stock.py           # NEW
│   └── utils/
│       ├── cache.py           # NEW - Redis/in-memory cache
│       └── rate_limiter.py    # NEW - API rate limiting
```

## Implementation Phases

### Phase 1: Stock Market Integration (1-2 days)

**Goal:** Add stock price lookups alongside crypto

```python
# models/asset.py
from enum import Enum
from pydantic import BaseModel

class AssetType(str, Enum):
    CRYPTO = "crypto"
    STOCK = "stock"

class Asset(BaseModel):
    symbol: str
    name: str
    asset_type: AssetType
    current_price: float
    change_24h: float
    market_cap: float | None = None

# models/stock.py
class StockDetail(Asset):
    pe_ratio: float | None = None
    dividend_yield: float | None = None
    sector: str | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None
```

```python
# services/market_data/base.py
from abc import ABC, abstractmethod

class MarketDataService(ABC):
    @abstractmethod
    async def get_price(self, symbol: str) -> dict:
        pass
    
    @abstractmethod
    async def get_historical(self, symbol: str, days: int) -> list:
        pass
    
    @abstractmethod
    async def search_asset(self, query: str) -> list:
        pass
```

```python
# services/market_data/finnhub.py
import aiohttp
from .base import MarketDataService

class FinnhubService(MarketDataService):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://finnhub.io/api/v1"
    
    async def get_price(self, symbol: str) -> dict:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/quote"
            params = {"symbol": symbol.upper(), "token": self.api_key}
            async with session.get(url, params=params) as response:
                data = await response.json()
                return {
                    "symbol": symbol.upper(),
                    "current_price": data["c"],  # current price
                    "change_24h": data["dp"],    # percent change
                    "high_24h": data["h"],
                    "low_24h": data["l"],
                }
    
    async def get_company_profile(self, symbol: str) -> dict:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/stock/profile2"
            params = {"symbol": symbol.upper(), "token": self.api_key}
            async with session.get(url, params=params) as response:
                return await response.json()
    
    async def search_asset(self, query: str) -> list:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/search"
            params = {"q": query, "token": self.api_key}
            async with session.get(url, params=params) as response:
                data = await response.json()
                return data.get("result", [])[:10]  # Top 10 results
```

```python
# services/market_data/factory.py
from .coingecko import CoinGeckoService
from .finnhub import FinnhubService
from models.asset import AssetType

class MarketDataFactory:
    def __init__(self, coingecko_key: str, finnhub_key: str):
        self.crypto_service = CoinGeckoService(coingecko_key)
        self.stock_service = FinnhubService(finnhub_key)
    
    def get_service(self, asset_type: AssetType):
        if asset_type == AssetType.CRYPTO:
            return self.crypto_service
        elif asset_type == AssetType.STOCK:
            return self.stock_service
        else:
            raise ValueError(f"Unknown asset type: {asset_type}")
```

```python
# api/routes/assets.py
from fastapi import APIRouter, HTTPException
from services.market_data.factory import MarketDataFactory
from models.asset import AssetType

router = APIRouter(prefix="/api/assets", tags=["assets"])

@router.get("/search")
async def search_assets(q: str, factory: MarketDataFactory):
    """Unified search across crypto and stocks"""
    crypto_results = await factory.crypto_service.search_asset(q)
    stock_results = await factory.stock_service.search_asset(q)
    
    return {
        "crypto": crypto_results[:5],
        "stocks": stock_results[:5]
    }

@router.get("/{asset_type}/{symbol}")
async def get_asset_price(asset_type: AssetType, symbol: str, factory: MarketDataFactory):
    service = factory.get_service(asset_type)
    try:
        return await service.get_price(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Asset not found: {symbol}")
```

### Phase 2: Unified Frontend (2-3 days)

**Goal:** Single search bar that handles both crypto and stocks

```javascript
// Frontend component pseudo-code
function AssetSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ crypto: [], stocks: [] });
    
    async function search(q) {
        const response = await fetch(`/api/assets/search?q=${q}`);
        const data = await response.json();
        setResults(data);
    }
    
    return (
        <div>
            <input 
                value={query} 
                onChange={(e) => search(e.target.value)}
                placeholder="Search BTC, AAPL, ETH..."
            />
            
            {results.crypto.length > 0 && (
                <Section title="Cryptocurrencies">
                    {results.crypto.map(asset => (
                        <AssetCard asset={asset} type="crypto" />
                    ))}
                </Section>
            )}
            
            {results.stocks.length > 0 && (
                <Section title="Stocks">
                    {results.stocks.map(asset => (
                        <AssetCard asset={asset} type="stock" />
                    ))}
                </Section>
            )}
        </div>
    );
}
```

### Phase 3: Advanced Features (3-5 days)

**Goal:** TradingView-lite capabilities

#### 3.1 Interactive Charts
```javascript
// Use Lightweight Charts library
import { createChart } from 'lightweight-charts';

function AdvancedChart({ symbol, assetType, timeframe }) {
    const chartRef = useRef();
    
    useEffect(() => {
        const chart = createChart(chartRef.current, {
            width: 800,
            height: 400,
            layout: {
                backgroundColor: '#1e1e1e',
                textColor: '#d1d4dc',
            }
        });
        
        // Fetch historical data
        fetch(`/api/assets/${assetType}/${symbol}/historical?days=${timeframe}`)
            .then(res => res.json())
            .then(data => {
                const candlestickSeries = chart.addCandlestickSeries();
                candlestickSeries.setData(data);
            });
    }, [symbol, assetType, timeframe]);
    
    return <div ref={chartRef} />;
}
```

#### 3.2 Technical Indicators
```python
# utils/indicators.py
import pandas as pd

class TechnicalIndicators:
    @staticmethod
    def calculate_rsi(prices: list, period: int = 14) -> list:
        """Relative Strength Index"""
        df = pd.DataFrame({'price': prices})
        delta = df['price'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.tolist()
    
    @staticmethod
    def calculate_macd(prices: list) -> dict:
        """Moving Average Convergence Divergence"""
        df = pd.DataFrame({'price': prices})
        exp1 = df['price'].ewm(span=12).mean()
        exp2 = df['price'].ewm(span=26).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9).mean()
        return {
            'macd': macd.tolist(),
            'signal': signal.tolist(),
            'histogram': (macd - signal).tolist()
        }
    
    @staticmethod
    def calculate_moving_averages(prices: list) -> dict:
        """SMA and EMA"""
        df = pd.DataFrame({'price': prices})
        return {
            'sma_20': df['price'].rolling(window=20).mean().tolist(),
            'sma_50': df['price'].rolling(window=50).mean().tolist(),
            'ema_12': df['price'].ewm(span=12).mean().tolist(),
            'ema_26': df['price'].ewm(span=26).mean().tolist(),
        }
```

```python
# api/routes/technical.py
from fastapi import APIRouter
from utils.indicators import TechnicalIndicators

router = APIRouter(prefix="/api/technical", tags=["technical"])

@router.get("/{asset_type}/{symbol}/indicators")
async def get_indicators(asset_type: str, symbol: str, days: int = 30):
    # Fetch historical prices
    service = factory.get_service(asset_type)
    historical = await service.get_historical(symbol, days)
    prices = [d['close'] for d in historical]
    
    return {
        "rsi": TechnicalIndicators.calculate_rsi(prices),
        "macd": TechnicalIndicators.calculate_macd(prices),
        "moving_averages": TechnicalIndicators.calculate_moving_averages(prices)
    }
```

#### 3.3 Enhanced Telegram Bot
```python
# services/telegram_bot.py - Update

class TelegramBot:
    async def handle_message(self, message: str, user_id: str):
        """Enhanced with stock support"""
        # Use Gemini to parse intent
        intent = await self.gemini_service.parse_intent(message)
        
        if intent['action'] == 'price_check':
            symbol = intent['symbol']
            asset_type = intent['asset_type']  # NEW: Gemini detects if crypto or stock
            
            service = self.factory.get_service(asset_type)
            price_data = await service.get_price(symbol)
            
            if asset_type == 'stock':
                response = (
                    f"📊 {symbol.upper()}\n"
                    f"Price: ${price_data['current_price']:.2f}\n"
                    f"Change: {price_data['change_24h']:+.2f}%\n"
                    f"High: ${price_data['high_24h']:.2f}\n"
                    f"Low: ${price_data['low_24h']:.2f}"
                )
            else:  # crypto
                response = (
                    f"🪙 {symbol.upper()}\n"
                    f"Price: ${price_data['current_price']:.2f}\n"
                    f"24h Change: {price_data['change_24h']:+.2f}%\n"
                    f"Market Cap: ${price_data['market_cap']:,.0f}"
                )
            
            await self.send_message(user_id, response)
```

### Phase 4: Arkham Intelligence Features (Optional - 5+ days)

**Goal:** On-chain crypto tracking

#### 4.1 Wallet Tracking
```python
# services/blockchain/etherscan.py
class EtherscanService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.etherscan.io/api"
    
    async def get_wallet_balance(self, address: str) -> dict:
        params = {
            "module": "account",
            "action": "balance",
            "address": address,
            "apikey": self.api_key
        }
        # Implementation
        pass
    
    async def get_transactions(self, address: str, limit: int = 100) -> list:
        params = {
            "module": "account",
            "action": "txlist",
            "address": address,
            "sort": "desc",
            "apikey": self.api_key
        }
        # Implementation
        pass
```

```sql
-- Database schema for wallet tracking
CREATE TABLE IF NOT EXISTS watched_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    label TEXT,
    chain TEXT DEFAULT 'ethereum',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    tx_hash TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    from_address TEXT,
    to_address TEXT,
    value REAL,
    token_symbol TEXT,
    timestamp TIMESTAMP,
    FOREIGN KEY (wallet_address) REFERENCES watched_wallets(wallet_address)
);
```

## Caching Strategy

```python
# utils/cache.py
from functools import wraps
from datetime import datetime, timedelta
import json

class SimpleCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key: str):
        if key in self._cache:
            data, expiry = self._cache[key]
            if datetime.now() < expiry:
                return data
            del self._cache[key]
        return None
    
    def set(self, key: str, value: any, ttl_seconds: int = 60):
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)

# Decorator for caching API calls
def cache_result(ttl_seconds: int = 60):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            cached = cache.get(cache_key)
            if cached:
                return cached
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        return wrapper
    return decorator

# Usage
@cache_result(ttl_seconds=30)
async def get_stock_price(symbol: str):
    # Expensive API call
    pass
```

## Testing Checklist

- [ ] Crypto price lookup still works
- [ ] Stock price lookup works (AAPL, TSLA, MSFT)
- [ ] Unified search returns both crypto and stocks
- [ ] Database migrations run successfully
- [ ] Telegram bot handles both asset types
- [ ] Watchlist supports mixed crypto/stock assets
- [ ] Price alerts work for stocks
- [ ] Historical data fetching works
- [ ] Technical indicators calculate correctly
- [ ] Rate limiting prevents API abuse
- [ ] Caching reduces redundant API calls

## Deployment Considerations

1. **API Keys**: Add Finnhub key to your VPS environment variables
2. **Database Migration**: Run SQLite schema updates before deployment
3. **Rate Limiting**: Monitor API usage, implement client-side throttling
4. **Error Handling**: Graceful degradation if one API fails
5. **Monitoring**: Log API response times, cache hit rates

## Next Steps After Phase 1

1. Deploy to VPS with Coolify
2. Test with real trading hours (stocks only trade 9:30am-4pm ET weekdays)
3. Add portfolio tracking (net worth calculation across all assets)
4. Implement comparison charts (BTC vs AAPL performance)
5. Social features (share watchlists, public portfolios)

## Resources

- Finnhub API Docs: https://finnhub.io/docs/api
- CoinGecko API Docs: https://www.coingecko.com/en/api/documentation
- Lightweight Charts: https://tradingview.github.io/lightweight-charts/
- Technical Analysis Library: https://github.com/bukosabino/ta

---

**Estimated Total Time:** 8-12 days for full implementation (Phase 1-3)
**Portfolio Impact:** High - Shows full-stack skills, API integration, financial domain knowledge
**Israeli Market Appeal:** Strong - Fintech is huge in Israel (eToro, Investar, etc.)
