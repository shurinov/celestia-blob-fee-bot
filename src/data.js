import axios from 'axios';
import { config } from './config.js';


class Coingecko {
  ENDPOINT = "https://api.coingecko.com/api/v3";

  coinsIdTab = {
    btc : 'bitcoin',
    eth : 'ethereum',
    osmo : 'osmosis',
    atom : 'cosmos',
    tia : 'celestia',
  };

  currenciesList = [
    'usd',
    'btc',
    'rub',
    'eur',
    'chf',
    'jpy',
    'cny',
    'sgd',
    'try',
  ];

  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  
  async fetchPrice(denom, currency) {
    // see coin id in https://docs.google.com/spreadsheets/d/1wTTuxXt8n9q7C4NDXqQpI3wpKu1_5bGVmP9Xz0XGSyU/edit?gid=0#gid=0
    //const coin_id = 'bitcoin';
    //const currencies = 'usd';
    const coin_id = this.coinsIdTab[denom];
    const currencies = currency;
    
    if (coin_id == null) {
      console.error(`Coingecko: unknown coin denom: ${denom}`);
      return null;
    }
    // https://api.coingecko.com/api/v3/simple/price?ids=mina-protocol&vs_currencies=usd&x_cg_demo_api_key=API_KEY
    const response = await axios(`${this.ENDPOINT}/simple/price?ids=${coin_id}&vs_currencies=${currencies}&x_cg_demo_api_key=${this.apiKey}`);
    const data = response.data;
    //console.log(data);
    //extract value
    return data[coin_id][currencies];
  }

  async fetchPricesAll() {
    // see coin id in https://docs.google.com/spreadsheets/d/1wTTuxXt8n9q7C4NDXqQpI3wpKu1_5bGVmP9Xz0XGSyU/edit?gid=0#gid=0
    const coin_id = Object.values(this.coinsIdTab).join(',');
    const currencies = this.currenciesList.join(',');
    const response = await axios(`${this.ENDPOINT}/simple/price?ids=${coin_id}&vs_currencies=${currencies}&x_cg_demo_api_key=${this.apiKey}`);
    const data = response.data;
    //console.log(data);

    let output = {};
    //convert to
    Object.keys(this.coinsIdTab).forEach(coinDenom => {
      output[coinDenom] = data[this.coinsIdTab[coinDenom]];
      // hack: insert null data
      if (output[coinDenom] == null) {
        let emptyPrice = {};
        this.currenciesList.forEach(currency => emptyPrice[currency] = null);
        output[coinDenom] = emptyPrice;
      }
    });
    return output;
  }
}


const cg = new Coingecko(config.coingeckoApiKey);

export function fetchTiaPrice(){
  return cg.fetchPrice('tia','usd');
}

