export function localize(key:string):string {
    let locale:string = JSON.parse(process.env.VSCODE_NLS_CONFIG || '{"locale":"en"}').locale;
    if(locale.indexOf('-')>0) {
        locale = locale.slice(0,locale.indexOf('-'));
    }
    const messages = new Map<string,Map<string,string>>();
    const en = new Map<string,string>();
    messages.set('en',en);
    en.set("extension.btc.market.inputBlockCoinExchangeSymbol",
    "input Block Coin Exchange Symbol,please.such as (btcusdt,ethusdt...)")
    en.set("extension.btc.market.high","high");
    en.set("extension.btc.market.low","low");
    const zh = new Map<string,string>();
    messages.set('zh',zh);
    zh.set("extension.btc.market.inputBlockCoinExchangeSymbol",
    "请输入区块币交易标识,类似于(btcusdt,ethusdt...)")
    zh.set("extension.btc.market.high","高");
    zh.set("extension.btc.market.low","低");
    return messages.get(locale)?.get(key) || '';
  }