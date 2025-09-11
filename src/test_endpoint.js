import indexerService from './services/indexerService.js';
import axios from 'axios';

async function getMsgPayForBlobs(height) {
  //console.log("try to get data from ", height, ' ', config.nodeApiUrl);
  const eventMethod = "/celestia.blob.v1.MsgPayForBlobs";
  // const response = await axios(
  //   `${process.env.TIA_API_URL}/cosmos/tx/v1beta1/txs?events=tx.height=${height}&events=message.action='${eventMethod}'`,
  //    {headers: {'Accept': 'application/json'}}
  // );

  // curl -X GET "${api_url}/cosmos/tx/v1beta1/txs?query=tx.height=${block_height}"
  const response = await axios(
    `${process.env.TIA_API_URL}/cosmos/tx/v1beta1/txs?query=tx.height=${height}'`,
     {headers: {'Accept': 'application/json'}}
  );
  const data = response.data;
 
  let tx_responses = [];
  data.tx_responses.forEach(resp =>{
    //console.log(resp);
    resp.events.forEach(event =>{
      if (event?.type == 'celestia.blob.v1.EventPayForBlobs')
        //console.log(resp);
        tx_responses.push(resp);
    })
    //console.log(resp.tx['@type']);
  });

  let out = [];
  tx_responses.forEach(resp =>{
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


//j=6910942
//j=6910683
//j=6910942
const data =await getMsgPayForBlobs(6910683);
console.log(data);