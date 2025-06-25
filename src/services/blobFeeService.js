import blobFeeRepository from '../repositories/blobFeeRepository.js';

class BlobFeeService {
  async addBlobFee(data) {
    try {
      await blobFeeRepository.insertBlobFee(data);
      return { success: true, message: 'Blob fee added' };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  async addBatchBlobFees(records) {
    try {
      await blobFeeRepository.batchInsertBlobFees(records);
      return { success: true, message: 'Batch blob fees added' };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  async getTotalFee() {
    try {
      const totalFee = await blobFeeRepository.getTotalFee();
      return { success: true, totalFee };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  async getTotalBlobSize() {
    try {
      const totalBlobSize = await blobFeeRepository.getTotalBlobSize();
      return { success: true, totalBlobSize };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }
  
  async getMaxHeight() {
    try {
      const maxHeight = await blobFeeRepository.getMaxHeight();
      return { success: true, maxHeight };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }
}

export default new BlobFeeService();