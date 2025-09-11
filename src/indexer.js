import axios from 'axios';
import { config } from './config.js';



function getTotalBlobSizeFromMsg(bodyMessages){
  if (!Array.isArray(bodyMessages)) return null;
  // console.log(bodyMessages);
  let totalSize = 0;
  bodyMessages.forEach(msg => {
    if (msg['@type'] == '/celestia.blob.v1.MsgPayForBlobs') {
      var sum = msg.blob_sizes.reduce(function(a, b){return a + b;}, 0);
      totalSize += sum;
    }
  });
  return totalSize;
}


function getUtiaFromFee(feeAmount){
  if (!Array.isArray(feeAmount)) return null;
  let totalFee = 0;
  feeAmount.forEach(msg => {
    if (msg.denom == 'utia') {
      totalFee += Number(msg.amount);
    }
  });
  return totalFee;
}


export async function getMsgPayForBlobs(height) {
  //console.log("try to get data from ", height, ' ', config.nodeApiUrl);
  const eventMethod = "/celestia.blob.v1.MsgPayForBlobs";
  const response = await axios(
    `${config.nodeApiUrl}/cosmos/tx/v1beta1/txs?events=tx.height=${height}&events=message.action='${eventMethod}'`,
     {headers: {'Accept': 'application/json'}}
  );
  const data = response.data;
  let out = [];
  //console.log(data);
  data.tx_responses.forEach(resp =>{
    const targetData = {
      height:  resp.height,
      size:    getTotalBlobSizeFromMsg(resp.tx.body.messages),
      fee:     getUtiaFromFee(resp.tx.auth_info.fee.amount),
      tx_hash: resp.txhash
    };
    //console.log(targetData);
    out.push(targetData);
  });
  return out;
}



//console.log(await getMsgPayForBlobs(1000002));


const START_BLOCK = 4000000; // Начальный номер блока
const REQUEST_COUNT = 1000; // Количество запросов

const requests = Array.from({ length: REQUEST_COUNT }, (_, index) => {
  const blockNumber = START_BLOCK + index;
  return getMsgPayForBlobs(blockNumber);
});

// Выполняем все запросы параллельно
const results = await Promise.all(requests);

let merged_data = [];
results.forEach(item => {
  merged_data = merged_data.concat(item);
});

//console.log(results);
console.log(merged_data);
console.log("count: ", merged_data.length);


let sumFee = 0;
let sumSize = 0;

merged_data.forEach(item =>{
  sumSize += item.size;
  sumFee += item.fee;
});

console.log(sumFee);
console.log(sumSize);
