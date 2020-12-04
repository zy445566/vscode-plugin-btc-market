import * as vscode from 'vscode';
import { BtcMarkerBarViewProvider } from './btcMarkerBarViewProvider';
import { localize } from './localize';
import * as bent from 'bent';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';

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
    ..._args: any[]
) {
    if(symbolsKeyList.length<1) {
        const getJSON = bent('json')
        const resp = await getJSON(`https://api.${getApiHost()}/v1/common/symbols`);
        symbolsKeyList = resp.data.map((symbolInfo:SymbolInfo)=> {
            return {label:`${symbolInfo["base-currency"]}/${symbolInfo["quote-currency"]}`};
        })
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
        if(!/^[a-z0-9/]+$/.test(nowSymbol)) {
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
    ...args: any[]
) {
    const symbolsConfig = getconfigSymbol();
    symbolsConfig.splice(symbolsConfig.indexOf(args[0].label),1);
    await setconfigSymbol(symbolsConfig)
    btcMarkerBarViewProvider.refresh();
}

let extensionPath = ''

async function tradeDetail(
    ...args: any[]
) {
    const panel = vscode.window.createWebviewPanel(
        'myWebview', // viewType
        args[0].label, // 视图标题
        vscode.ViewColumn.One, // 显示在编辑器的哪个部位
        {
            enableScripts: true, // 启用JS，默认禁用
            retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
        }
    );
    const klineHtmlDiskPath = path.join(extensionPath, 'static', 'kline.html');
    const echartsLibDiskPath = vscode.Uri.file(
        path.join(extensionPath, 'static', 'echarts.min.js')
    );
    const echartsLibSrc = panel.webview.asWebviewUri(echartsLibDiskPath);
    let klineHtml = fs.readFileSync(klineHtmlDiskPath).toString();
    const getJSON = bent('json');
    const resp = await getJSON(`https://api.${
          getApiHost()
        }/market/history/kline?period=1day&size=200&symbol=${
            args[0].label.replace('/','')
        }`);
    const volumes = [];
    const lineData = [];
    const dates = [];
    const nowData = moment();
    for(const data of resp.data) {
        lineData.unshift([data.close,data.open,data.low,data.high])
        dates.unshift(nowData.format('YYYY-MM-DD'));
        volumes.unshift(data.vol)
        nowData.subtract(1,'days');
    }
    klineHtml = klineHtml.replace('%ECHARTS_LIB_SRC%', `${echartsLibSrc}`);
    klineHtml = klineHtml.replace('%LABEL_NAME%', args[0].label);
    klineHtml = klineHtml.replace('"%LINE_DATA%"', JSON.stringify(lineData));
    klineHtml = klineHtml.replace('"%DATES%"', JSON.stringify(dates));
    klineHtml = klineHtml.replace('"%VOLUMES%"', JSON.stringify(volumes));
    panel.webview.html = klineHtml;
}

async function refresh(
    ..._args: any[]
) {
    btcMarkerBarViewProvider.refresh()
}

export function activate(context: vscode.ExtensionContext) {
    extensionPath = context.extensionPath;
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
            return vscode.commands.registerCommand(command, callback);
        })
    );
}

export function deactivate() {}
