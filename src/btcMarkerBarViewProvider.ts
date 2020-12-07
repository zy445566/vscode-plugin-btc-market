import * as vscode from 'vscode';
import * as bent from 'bent';
import { localize } from './localize';
import * as configManage from './configManage';

const loadingMap = new Map<string,ExchangeSymbol>();
export class BtcMarkerBarViewProvider implements vscode.TreeDataProvider<ExchangeSymbol> {
  constructor(private apiHost: string) {
    this.apiHost = apiHost;
  }
  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
  
  public refresh(): any {
    this._onDidChangeTreeData.fire(undefined);
  }
  
  getTreeItem(element: ExchangeSymbol): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ExchangeSymbol): Promise<ExchangeSymbol[]> {
    return await this.loadExchangeSymbolData();
  }
  private async loadExchangeSymbolData():Promise<Array<ExchangeSymbol>> {
    const symbolList = configManage.getconfigSymbol();
    // const symbolList = ['btc/usdt']
    const exchangeSymbolList:Array<ExchangeSymbol> = [];
    const refreshFunc = ()=>{
      this.refresh()
    }
    for(const symbol of symbolList) {
      let exchangeSymbol = new ExchangeSymbol(symbol, this.apiHost,vscode.TreeItemCollapsibleState.None) //vscode.TreeItemCollapsibleState.Collapsed
      if(loadingMap.has(symbol)) {
        exchangeSymbol = loadingMap.get(symbol) || new ExchangeSymbol(symbol, this.apiHost,vscode.TreeItemCollapsibleState.None);
      } 
      // 此处是故意不加await的
      exchangeSymbol.Loading(refreshFunc);
      exchangeSymbolList.push(exchangeSymbol)
    }
    loadingMap.clear();
    for(const exchangeSymbol of exchangeSymbolList) {
      loadingMap.set(exchangeSymbol.label,exchangeSymbol)
    }
    return exchangeSymbolList;
  }
}
type PriceData = {
    open:number,
    close:number,
    low:number,
    high:number,
}
class ExchangeSymbol extends vscode.TreeItem {
  public loadingTime = 0;
  constructor(
    public readonly label: string,
    public readonly apiHost: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.apiHost = apiHost;
    this.tooltip = `${this.label} ${localize(
      'extension.btc.market.loading'
    )}`;
    this.description = `${localize(
      'extension.btc.market.loading'
    )}`;
  }

  async Loading(refreshFunc:Function) {
    if(Date.now()<this.loadingTime) {
      return;
    }
    const getJSON = bent('json')
    const resp = await getJSON(`https://api.${
        this.apiHost
      }/market/history/kline?period=1day&size=1&symbol=${
        this.label.replace('/','')
      }`);
    const priceData:PriceData = resp.data[0];
    this.tooltip = `${this.label} ${localize(
      'extension.btc.market.high'
      )}:${priceData.high} ${localize(
        'extension.btc.market.low'
        )}:${priceData.low}`;
    const rate = (((priceData.close-priceData.open)/priceData.open)*100);
    this.description = `${priceData.close} ${priceData.close>=priceData.open?'📈':'📉'} ${rate.toFixed(2)}%`;
    this.loadingTime = Date.now()+configManage.getautoRefreshTime()*1000;
    refreshFunc();
  }

//   iconPath = {
//     light: path.join(__filename, '..', '..', 'resources', 'light', 'ExchangeSymbol.svg'),
//     dark: path.join(__filename, '..', '..', 'resources', 'dark', 'ExchangeSymbol.svg')
//   };
}