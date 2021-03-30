export function localize(key:string):string {
    let locale:string = JSON.parse(process.env.VSCODE_NLS_CONFIG || '{"locale":"en"}').locale;
    if(locale.indexOf('-')>0) {
        locale = locale.slice(0,locale.indexOf('-'));
    }
    const messages = new Map<string,Map<string,string>>();
    const en = new Map<string,string>();
    messages.set('en',en);
    en.set("extension.btc.market.inputBlockCoinExchangeSymbol",
    "input Block Coin Exchange Symbol,please.such as (btc/usdt,eth/usdt...)")
    en.set("extension.btc.market.blockCoinExchangeSymbolIsExist","Block Coin Exchange Symbol Already Exist");
    en.set("extension.btc.market.high","high");
    en.set("extension.btc.market.low","low");
    en.set("extension.btc.market.loading","loading");
    en.set("extension.btc.market.huobiDomainInvalidInfo",
        "Failed connection exists.The domain name maybe is invalid.pull down the homepage of Huobi APP to get the valid domain.If you cannot get real-time price, try to input domain name to change or switch network line,please."
    );
    const zh = new Map<string,string>();
    messages.set('zh',zh);
    zh.set("extension.btc.market.inputBlockCoinExchangeSymbol",
    "请输入区块币交易标识,类似于(btc/usdt,eth/usdt...)")
    zh.set("extension.btc.market.high","高");
    zh.set("extension.btc.market.low","低");
    zh.set("extension.btc.market.blockCoinExchangeSymbolIsExist","区块币交易标识已经存在");
    zh.set("extension.btc.market.loading","加载中");
    zh.set("extension.btc.market.huobiDomainInvalidInfo",
        "存在失败连接，可能域名已失效, 有效域名请下拉火币APP首页获取,如无法获取实时价格请输入更换域名或切换网络线路"
    );
    return messages.get(locale)?.get(key) || '';
  }