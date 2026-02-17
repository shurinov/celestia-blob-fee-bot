import db from '../config/database.js';

class BlobFeeRepository {
  /**
   * insert one item to blob_fee + associated namespace_activity
   * @param {Object} data 
   * @param {string} data.tx_hash
   * @param {string} [data.signer]
   * @param {number} [data.height]
   * @param {number} [data.size]
   * @param {number} [data.fee]
   * @param {string[]} [data.namespaces] — list of hex-string 20-symbols length (10 bytes)
   */
  async insertBlobFee(data) {
    try {
      const { namespaces, ...blobFeeData } = data;

      await db.transaction(async (trx) => {
        await trx('blob_fee')
          .insert(blobFeeData)
          .onConflict('tx_hash')
          .ignore();

        if (namespaces?.length > 0) {
          const namespaceRecords = namespaces.map(nsHex => ({
            tx_hash: blobFeeData.tx_hash,
            namespace: Buffer.from(nsHex, 'hex')
          }));

          await trx('namespace_activity')
            .insert(namespaceRecords)
            .onConflict(['tx_hash', 'namespace'])
            .ignore();
        }
      });
    } catch (error) {
      throw new Error(`Error inserting blob fee + namespaces: ${error.message}`);
    }
  }

  /**
   * Batch data insert
   * @param {Array<Object>} records — list of data objects from blobs parsing
   */
  async batchInsertBlobFees(records) {
    try {
      await db.transaction(async (trx) => {
        const blobFeeRecords = records.map(r => {
          const { namespaces, ...rest } = r;
          return rest;
        });

        if (blobFeeRecords.length > 0) {
          await trx('blob_fee')
            .insert(blobFeeRecords)
            .onConflict('tx_hash')
            .ignore();
        }

        const namespaceRecords = [];

        for (const record of records) {
          if (record.namespaces?.length > 0) {
            const txHash = record.tx_hash;
            for (const nsHex of record.namespaces) {
              // check len
              if (nsHex.length !== 20) {
                throw new Error(`Invalid namespace length for tx ${txHash}: expected 20 hex chars`);
              }
              namespaceRecords.push({
                tx_hash: txHash,
                namespace: Buffer.from(nsHex, 'hex')
              });
            }
          }
        }

        if (namespaceRecords.length > 0) {
          await trx('namespace_activity')
            .insert(namespaceRecords)
            .onConflict(['tx_hash', 'namespace'])
            .ignore();
        }
      });
    } catch (error) {
      throw new Error(`Error batch inserting blob fees + namespaces: ${error.message}`);
    }
  }

  async getTotalFee() {
    try {
      const result = await db('blob_fee').sum('fee as total_fee').first();
      return result.total_fee || 0;
    } catch (error) {
      throw new Error(`Error calculating total fee: ${error.message}`);
    }
  }

  async get24hFee() {
    try {
      const result = await db('blob_fee')
        .sum('fee as period_fee')
        .where('timestamp', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
        .first();
      return result.period_fee || 0;
    } catch (error) {
      throw new Error(`Error calculating total fee: ${error.message}`);
    }
  }
  
  async getTotalBlobSize() {
    try {
      const result = await db('blob_fee').sum('size as total_size').first();
      return result.total_size || 0;
    } catch (error) {
      throw new Error(`Error calculating total fee: ${error.message}`);
    }
  }

  async get24hBlobSize() {
    try {
      const result = await db('blob_fee')
        .sum('size as period_size')
        .where('timestamp', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
        .first();
      return result.period_size || 0;
    } catch (error) {
      throw new Error(`Error calculating total fee: ${error.message}`);
    }
  }

  async getBlobFees(limit = 10) {
    try {
      return await db('blob_fee')
        .select('*')
        .orderBy('height', 'desc')
        .limit(limit);
    } catch (error) {
      throw new Error(`Error fetching blob_fee: ${error.message}`);
    }
  }

  // async getDbData(filter) {
  //   try {
  //     return await db('blob_fee')
  //       .select('*')
  //       //.where(filter)
  //       .where('height', 'maxValue')
  //       .limit(100);
  //   } catch (error) {
  //     throw new Error(`Database error: ${error.message}`);
  //   }
  // }

  async getUniqueNamespacesLastHours(hours, options = {}) {
    const { endDate = new Date() } = options;

    const startDate = new Date(endDate);
    startDate.setHours(startDate.getHours() - hours);

    try {
      const result = await db('blob_fee as bf')
        .innerJoin('namespace_activity as na', 'bf.tx_hash', 'na.tx_hash')
        .where('bf.timestamp', '>=', startDate)
        .where('bf.timestamp', '<=', endDate)
        .countDistinct('na.namespace as unique_count')
        .first();

      // result { unique_count: '42' } or null
      return parseInt(result?.unique_count || 0, 10);
    } catch (error) {
      console.error('Error in getting unique namespaces:', error);
      throw error;
    }
  }

  async getMaxHeight() {
    try {
      return await db('blob_fee')
        .max('height')
        .first()
        .then(result => result[Object.keys(result)[0]]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

export default new BlobFeeRepository();