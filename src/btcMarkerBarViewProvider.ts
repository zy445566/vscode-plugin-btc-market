import * as vscode from 'vscode';
import * as bent from 'bent';
import { localize } from './localize';

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
    const getJSON = bent('json')
    const symbolList = vscode.workspace
    .getConfiguration()
    .get<Array<string>>('vscodePluginBtcMarket.symbol') || [];
    // const symbolList = ['btc/usdt']
    const exchangeSymbolList:Array<ExchangeSymbol> = [];
    for(const symbol of symbolList) {
        const resp = await getJSON(`https://api.${
          this.apiHost
        }/market/history/kline?period=1day&size=1&symbol=${
          symbol.replace('/','')
        }`);
        exchangeSymbolList.push(
            new ExchangeSymbol(symbol, resp.data[0],vscode.TreeItemCollapsibleState.None) //vscode.TreeItemCollapsibleState.Collapsed
        )
        
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
  constructor(
    public readonly label: string,
    public readonly priceData: PriceData,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} ${localize(
      'extension.btc.market.high'
      )}:${priceData.high} ${localize(
        'extension.btc.market.low'
        )}:${priceData.low}`;
    const rate = (((priceData.close-priceData.open)/priceData.open)*100);
    this.description = `${priceData.close} ${priceData.close>=priceData.open?'📈':'📉'} ${rate.toFixed(2)}%`;
  }

//   iconPath = {
//     light: path.join(__filename, '..', '..', 'resources', 'light', 'ExchangeSymbol.svg'),
//     dark: path.join(__filename, '..', '..', 'resources', 'dark', 'ExchangeSymbol.svg')
//   };
}