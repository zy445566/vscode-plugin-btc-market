import * as vscode from 'vscode';
import { BtcMarkerBarViewProvider } from './btcMarkerBarViewProvider';
import { localize } from './localize';
import * as bent from 'bent';

function getApiHost() {
    return vscode.workspace
    .getConfiguration()
    .get<string>('vscodePluginBtcMarket.apiHost') || 'huobi.pr';
}
function getautoRefreshTime() {
    return vscode.workspace
    .getConfiguration()
    .get<number>('vscodePluginBtcMarket.autoRefreshTime') || 10;
}
function getconfigSymbol() {
    return vscode.workspace
    .getConfiguration()
    .get<Array<string>>('vscodePluginBtcMarket.symbol') || [];
}
async function setconfigSymbol(symbolsConfig:Array<string>) {
    return await vscode.workspace.getConfiguration().update(
        'vscodePluginBtcMarket.symbol',
        symbolsConfig
    );
}
let autoRefreshTime = getautoRefreshTime();
function autoRefreshTimeFunction() {
    const setIntervalHandle = setInterval(()=>{
        if(autoRefreshTime!==getautoRefreshTime()) {
            clearInterval(setIntervalHandle)
            return autoRefreshTimeFunction()
        }
        btcMarkerBarViewProvider.refresh()
    },autoRefreshTime*1000)
}
autoRefreshTimeFunction();

const btcMarkerBarViewProvider = new BtcMarkerBarViewProvider(getApiHost());
type SymbolInfo = {
    "base-currency":String,
    "quote-currency":String,
}
let symbolsKeyList:Array<vscode.QuickPickItem> = [];
async function addTrade(
    _textEditor: vscode.TextEditor,
    _edit: vscode.TextEditorEdit,
    ..._args: any[]
) {
    if(symbolsKeyList.length<1) {
        const getJSON = bent('json')
        const resp = await getJSON(`https://api.${getApiHost()}/v1/common/symbols`);
        symbolsKeyList = resp.data.map((symbolInfo:SymbolInfo)=>{label:`${symbolInfo["base-currency"]}${symbolInfo["quote-currency"]}`})
    }
    const qp = vscode.window.createQuickPick();
    qp.items = [{ label: localize('extension.btc.market.inputBlockCoinExchangeSymbol') }];
    qp.onDidChangeValue((value) => {
        qp.busy = true;
        qp.items = symbolsKeyList.filter(symbolsKey=>symbolsKey.label.indexOf(value)>-1);
        qp.busy = false;
      });
      let nowSymbol = ''
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
        await setconfigSymbol(symbolsConfig)
        btcMarkerBarViewProvider.refresh();
        qp.hide();
        qp.dispose();
    });
}
async function delTrade(
    _textEditor: vscode.TextEditor,
    _edit: vscode.TextEditorEdit,
    ..._args: any[]
) {
    const symbolsConfig = getconfigSymbol();
    symbolsConfig.splice(symbolsConfig.indexOf(_args[0].label),1);
    await setconfigSymbol(symbolsConfig)
    btcMarkerBarViewProvider.refresh();
}
function tradeDetail(
    _textEditor: vscode.TextEditor,
    _edit: vscode.TextEditorEdit,
    ..._args: any[]
) {
    console.log('tradeDetail')
}
function refresh(
    _textEditor: vscode.TextEditor,
    _edit: vscode.TextEditorEdit,
    ..._args: any[]
) {
    btcMarkerBarViewProvider.refresh()
}

export function activate(context: vscode.ExtensionContext) {
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
    context.subscriptions.push(
        ...textEditorCommandMap.map(({ command, callback }) => {
            return vscode.commands.registerTextEditorCommand(command, callback);
        })
    );
}

export function deactivate() {}
