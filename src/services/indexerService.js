import axios from 'axios';
import dotenv from 'dotenv';
import blobFeeService from './blobFeeService.js';

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

function getSignerFromMsg(bodyMessages){
  if (!Array.isArray(bodyMessages)) return null;
  let out = null;
  bodyMessages.forEach(msg => {
    if (msg['@type'] == '/celestia.blob.v1.MsgPayForBlobs') {
      out = msg.signer;
    }
  });
  return out;
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
      tx_hash: resp.txhash,
      signer:  getSignerFromMsg(resp.tx.body.messages),
      height:  Number(resp.height),
      size:    getTotalBlobSizeFromMsg(resp.tx.body.messages),
      fee:     getUtiaFromFee(resp.tx.auth_info.fee.amount),
    };
    //console.log(targetData);
    out.push(targetData);
  });
  return out;
}


async function getLatestHeight() {
  const response = await axios(`${process.env.TIA_API_URL}/cosmos/base/tendermint/v1beta1/blocks/latest`);
  return response.data.block.header.height;
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

  REQUEST_COUNT = 1000;

  async startIndexing() {

    let currentHeight = parseInt(process.env.START_HEIGHT) || 1;

    const dbMaxData = await blobFeeService.getMaxHeight();
    if (!dbMaxData.success) console.error("db error!");
    const dbHeight = dbMaxData.maxHeight || 1;
    const chainHeight = await getLatestHeight();

    console.log("Latest db height", dbHeight);

    if (chainHeight - dbHeight >= this.REQUEST_COUNT){
      const batchNum = Math.floor((chainHeight - dbHeight)/this.REQUEST_COUNT);

      console.log("Run batch data retrieval");
      console.log("batchNum: ", batchNum);
      for (let i=0; i < batchNum; i++){
        currentHeight = dbHeight + this.REQUEST_COUNT*i;

        console.log(`get ${this.REQUEST_COUNT}-size batch from height: ${currentHeight}`);
        const requests = Array.from({ length: this.REQUEST_COUNT }, (_, index) => {
          const h = currentHeight + index;
          return getMsgPayForBlobs(h);
        });
        
        // Выполняем все запросы параллельно
        const results = await Promise.all(requests);
        
        let merged_data = [];
        results.forEach(item => {
          merged_data = merged_data.concat(item);
        });

        //console.log(merged_data);
        //console.log("obtained: ", merged_data.length, " tx");

        if (merged_data.length > 0) {
          await blobFeeService.addBatchBlobFees(merged_data);
          console.log(`Stored ${merged_data.length} blob fees tx`);
        }

      }
    }
    

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