import blobFeeRepository from '../repositories/blobFeeRepository.js';

function customFixed(value, deci=3) {
  return Math.floor(value*10**deci)/10**deci;
}

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

  async get24hFee() {
    try {
      const fee24h = await blobFeeRepository.get24hFee();
      return { success: true, fee24h };
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

  async get24hBlobSize() {
    try {
      const blobSize24h = await blobFeeRepository.get24hBlobSize();
      return { success: true, blobSize24h };
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

  tiaAmountFormat(amount){
    const amountTia = amount/10**6;
    if (amountTia < 1) return amountTia;
    if (amountTia < 10) return customFixed(amountTia, 3);
    if (amountTia < 100) return customFixed(amountTia, 2);
    if (amountTia < 1000) return customFixed(amountTia, 1);
    if (amountTia < 10000) return customFixed(amountTia/1000, 3)+'k';
    if (amountTia < 100000) return customFixed(amountTia/1000, 2)+'k';
    if (amountTia < 1000000) return customFixed(amountTia/1000, 1)+'k';
    if (amountTia < 10000000) return customFixed(amountTia/10**6, 3)+'M';
    if (amountTia < 100000000) return customFixed(amountTia/10**6, 2)+'M';
    if (amountTia < 1000000000) return customFixed(amountTia/10**6, 1)+'M';
    if (amountTia < 10000000000) return customFixed(amountTia/10**9, 3)+'B';
    if (amountTia < 100000000000) return customFixed(amountTia/10**9, 2)+'B';
    if (amountTia < 1000000000000) return customFixed(amountTia/10**9, 1)+'B';
    return customFixed(amountTia/10**9, 0)+'B';
  }

  blobSizeFormat(size){
    if (size < 1024) return size;
    if (size < 1024*1024) return customFixed(size/1024, 2)+'kB';
    if (size < 1024*1024*1024) return customFixed(size/1024/1024, 2) + 'MB';
    if (size < 1024*1024*1024*1024) return customFixed(size/1024/1024/1024, 2) + 'GB';
    if (size < 1024*1024*1024*1024*1024) return customFixed(size/1024/1024/1024/1024, 2) + 'TB';
    return customFixed(size/1024/1024/1024/1024/1024, 2) + 'PB';
  }
}

export default new BlobFeeService();