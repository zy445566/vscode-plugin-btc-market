"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BtcMarkerBarViewProvider = void 0;
const vscode = require("vscode");
const bent = require("bent");
class BtcMarkerBarViewProvider {
    constructor(apiHost) {
        this.apiHost = apiHost;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.apiHost = apiHost;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        return await this.loadExchangeSymbolData();
    }
    async loadExchangeSymbolData() {
        const getJSON = bent('json');
        const symbolList = vscode.workspace
            .getConfiguration()
            .get('vscodePluginBtcMarket.symbol') || [];
        const exchangeSymbolList = [];
        for (const symbol of symbolList) {
            const resp = await getJSON(`https://api.${this.apiHost}/market/history/kline?period=1day&size=1&symbol=${symbol}`);
            exchangeSymbolList.push(new ExchangeSymbol(symbol, resp.data[0], vscode.TreeItemCollapsibleState.None) //vscode.TreeItemCollapsibleState.Collapsed
            );
        }
        return exchangeSymbolList;
    }
}
exports.BtcMarkerBarViewProvider = BtcMarkerBarViewProvider;
class ExchangeSymbol extends vscode.TreeItem {
    constructor(label, priceData, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.priceData = priceData;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label} height:${priceData.high} low:${priceData.low}`;
        const rate = (((priceData.close - priceData.open) / priceData.open) * 100);
        this.description = `${priceData.close} ${priceData.close >= priceData.open ? '📈' : '📉'} ${rate.toFixed(2)}%`;
    }
}
//# sourceMappingURL=btcMarkerBarViewProvider.js.map