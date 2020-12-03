"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const btcMarkerBarViewProvider_1 = require("./btcMarkerBarViewProvider");
const bent = require("bent");
function getApiHost() {
    return vscode.workspace
        .getConfiguration()
        .get('vscodePluginBtcMarket.apiHost') || 'huobi.pr';
}
function getautoRefreshTime() {
    return vscode.workspace
        .getConfiguration()
        .get('vscodePluginBtcMarket.autoRefreshTime') || 10;
}
function getconfigSymbol() {
    return vscode.workspace
        .getConfiguration()
        .get('vscodePluginBtcMarket.symbol') || [];
}
async function setconfigSymbol(symbolsConfig) {
    return await vscode.workspace.getConfiguration().update('vscodePluginBtcMarket.symbol', symbolsConfig);
}
let autoRefreshTime = getautoRefreshTime();
function autoRefreshTimeFunction() {
    const setIntervalHandle = setInterval(() => {
        if (autoRefreshTime !== getautoRefreshTime()) {
            clearInterval(setIntervalHandle);
            return autoRefreshTimeFunction();
        }
        btcMarkerBarViewProvider.refresh();
    }, autoRefreshTime * 1000);
}
autoRefreshTimeFunction();
const btcMarkerBarViewProvider = new btcMarkerBarViewProvider_1.BtcMarkerBarViewProvider(getApiHost());
let symbolsKeyList = [];
async function addTrade(_textEditor, _edit, ..._args) {
    if (symbolsKeyList.length < 1) {
        const getJSON = bent('json');
        const resp = await getJSON(`https://api.${getApiHost()}/v1/common/symbols`);
        symbolsKeyList = resp.data.map((symbolInfo) => { label: `${symbolInfo["base-currency"]}${symbolInfo["quote-currency"]}`; });
    }
    const qp = vscode.window.createQuickPick();
    qp.items = [{ label: '%extension.btc.market.inputBlockCoinExchangeSymbol%' }];
    qp.onDidChangeValue((value) => {
        qp.busy = true;
        qp.items = symbolsKeyList.filter(symbolsKey => symbolsKey.label.indexOf(value) > -1);
        qp.busy = false;
    });
    let nowSymbol = '';
    qp.onDidChangeSelection((e) => {
        nowSymbol = e[0].label;
    });
    qp.show();
    qp.onDidAccept(async () => {
        if (!nowSymbol) {
            return;
        }
        const symbolsConfig = getconfigSymbol();
        symbolsConfig.push(nowSymbol);
        await setconfigSymbol(symbolsConfig);
        btcMarkerBarViewProvider.refresh();
        qp.hide();
        qp.dispose();
    });
}
async function delTrade(_textEditor, _edit, ..._args) {
    const symbolsConfig = getconfigSymbol();
    symbolsConfig.splice(symbolsConfig.indexOf(_args[0].label), 1);
    await setconfigSymbol(symbolsConfig);
    btcMarkerBarViewProvider.refresh();
}
function tradeDetail(_textEditor, _edit, ..._args) {
    console.log('tradeDetail');
}
function refresh(_textEditor, _edit, ..._args) {
    btcMarkerBarViewProvider.refresh();
}
function activate(context) {
    vscode.window.registerTreeDataProvider('BtcMarkerBarView', btcMarkerBarViewProvider);
    const textEditorCommandMap = [
        {
            command: 'extension.btc.market.addTrade',
            callback: addTrade,
        },
        {
            command: 'extension.btc.market.delTrade',
            callback: delTrade,
        },
        {
            command: 'extension.btc.market.tradeDetail',
            callback: tradeDetail,
        },
        {
            command: 'extension.btc.market.refresh',
            callback: refresh,
        },
    ];
    context.subscriptions.push(...textEditorCommandMap.map(({ command, callback }) => {
        return vscode.commands.registerTextEditorCommand(command, callback);
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map