import axios from 'axios';
import dotenv from 'dotenv';
import blobFeeService from './blobFeeService.js';
import db from '../config/database.js';

dotenv.config();

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


async function getMsgPayForBlobs(height) {
  //console.log("try to get data from ", height, ' ', config.nodeApiUrl);
  const eventMethod = "/celestia.blob.v1.MsgPayForBlobs";
  const response = await axios(
    `${process.env.TIA_API_URL}/cosmos/tx/v1beta1/txs?events=tx.height=${height}&events=message.action='${eventMethod}'`,
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


class IndexerService {
  async fetchAndStoreBlobFees(startHeight) {
    try {
      const blobFees = await getMsgPayForBlobs(startHeight);

      console.log(`fetched from block (${startHeight}): `, blobFees);
      
      if (blobFees.length > 0) {
        await blobFeeService.addBatchBlobFees(blobFees);
        console.log(`Stored ${blobFees.length} blob fees for height ${startHeight}`);
      }

      return blobFees.length;
    } catch (error) {
      console.error(`Error indexing block ${startHeight}: ${error.message}`);
      return null;
    }
  }



  async startIndexing() {
    let currentHeight = parseInt(process.env.START_HEIGHT) || 1;

    console.log(await blobFeeService.getMaxHeight());

    setInterval(async () => {
      const count = await this.fetchAndStoreBlobFees(currentHeight);
      console.log("count: ",count);
      if (count != null) {
        currentHeight++;
        //process.env.START_HEIGHT = currentHeight.toString();
      }
    }, 2000);
  }
}

export default new IndexerService();