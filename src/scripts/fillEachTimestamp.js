import db from '../config/database.js';
import axios from 'axios';
import dotenv from 'dotenv';


async function getNullTsData(size = 100) {
  try {
    const result = await db('blob_fee').select('height').where('timestamp', null).orderBy('height', 'asc').limit(size);
    return result
  } catch (error) {
    throw new Error(`Error in getNullTsData: ${error.message}`);
  }
}

async function updateTimestampByHeight(height, newTimestamp) {
  return await db('blob_fee')
    .where({ height: height })
    .update({ timestamp: newTimestamp });
}

async function updateTimestampsBatch(updates) {
  try {
    await db.transaction(async trx => {
      const queries = updates.map(({ height, timestamp }) =>
        db('blob_fee')
          .where({ height })
          .update({ timestamp })
          .transacting(trx)
      );
      await Promise.all(queries);
    });
    //console.log('Batch successfully done ');
  } catch (error) {
    console.error('Batch ends with error:', error);
  }
}

async function getBlobsCount() {
  try {
    const result = await db('blob_fee').count('* as count').first();
    return result
  } catch (error) {
    throw new Error(`Error in getTsFilledCount: ${error.message}`);
  }
}

async function getTsFilledCount() {
  try {
    const result = await db('blob_fee').count('* as count').whereNotNull('timestamp').first();
    return result
  } catch (error) {
    throw new Error(`Error in getTsFilledCount: ${error.message}`);
  }
}

async function getSumsForLast24Hours() {
  try {
    const result = await db('blob_fee')
      .sum({ total_size: 'size', total_fee: 'fee' })
      .where('timestamp', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
      .first();

    return {
      total_size: Number(result.total_size) || 0,
      total_fee: Number(result.total_fee) || 0
    };
  } catch (error) {
    console.error('Error in getSumsForLast24Hours:', error);
    return { total_size: 0, total_fee: 0 };
  }
}

async function getBlockTsFromRpc(height) {
  const response = await axios(
    `${process.env.TIA_RPC_URL}/header?height=${height}`,
     {headers: {'Accept': 'application/json'}}
  );
  const data = response.data;
  //console.log(data);
  return {height, timestamp: data.result.header.time};
}


const start = performance.now();
const dbRows = await getNullTsData();
const uniqueHeights = [...new Set(dbRows.map(obj => obj.height))];
const requests = uniqueHeights.map(height => getBlockTsFromRpc(height));
const results = await Promise.all(requests);
await updateTimestampsBatch(results);
console.log(await getTsFilledCount());
const end = performance.now();
console.log(`__exec_time : ${end - start} ms`);

const total = await getBlobsCount();

console.log('total blobs in db: ', total.count);


let run_flag = true;
let monitor_cnt = 0;
while (run_flag) {
  const dbRows = await getNullTsData();
  const uniqueHeights = [...new Set(dbRows.map(obj => obj.height))];
  const requests = uniqueHeights.map(height => getBlockTsFromRpc(height));
  const results = await Promise.all(requests);
  await updateTimestampsBatch(results);
  monitor_cnt++;
  if (monitor_cnt == 100) {
    const filled = await getTsFilledCount()
    console.log(Number(filled.count)/Number(total.count)*100, '%');
    monitor_cnt = 0;
  }
  run_flag = uniqueHeights.length > 0;
}