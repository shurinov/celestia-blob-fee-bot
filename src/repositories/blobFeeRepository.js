import db from '../config/database.js';

class BlobFeeRepository {
  async insertBlobFee(data) {
    try {
      await db('blob_fee').insert(data).onConflict('tx_hash').ignore();
    } catch (error) {
      throw new Error(`Error inserting into blob_fee: ${error.message}`);
    }
  }

  async batchInsertBlobFees(records) {
    try {
      await db.transaction(async (trx) => {
        await trx('blob_fee').insert(records).onConflict('tx_hash').ignore();
      });
    } catch (error) {
      throw new Error(`Error batch inserting into blob_fee: ${error.message}`);
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

  async getTotalBlobSize() {
    try {
      const result = await db('blob_fee').sum('size as total_size').first();
      return result.total_size || 0;
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