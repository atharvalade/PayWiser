/**
 * Face Recognition Service for PayWiser
 * Interfaces with DeepFace Python library via subprocess
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FaceRecognitionService {
  constructor() {
    this.pythonPath = path.join(__dirname, '../../API Reference/DeepFace-API/venv39/bin/python');
    this.scriptPath = path.join(__dirname, '../utils/face_recognition.py');
    this.threshold = parseFloat(process.env.FACE_RECOGNITION_THRESHOLD) || 0.68;
  }

  /**
   * Generate face embedding from image
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Array>} Face embedding vector
   */
  async generateEmbedding(imagePath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        'generate_embedding',
        imagePath
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const output = JSON.parse(result);
            if (output.success) {
              resolve(output.embedding);
            } else {
              reject(new Error(output.error || 'Failed to generate embedding'));
            }
          } catch (e) {
            reject(new Error('Invalid response from face recognition service'));
          }
        } else {
          reject(new Error(`Face recognition failed: ${error}`));
        }
      });
    });
  }

  /**
   * Verify if two images contain the same person
   * @param {string} imagePath1 - Path to first image
   * @param {string} imagePath2 - Path to second image
   * @returns {Promise<Object>} Verification result
   */
  async verifyFaces(imagePath1, imagePath2) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        'verify_faces',
        imagePath1,
        imagePath2,
        this.threshold.toString()
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const output = JSON.parse(result);
            if (output.success) {
              resolve({
                verified: output.verified,
                distance: output.distance,
                threshold: output.threshold
              });
            } else {
              reject(new Error(output.error || 'Failed to verify faces'));
            }
          } catch (e) {
            reject(new Error('Invalid response from face verification service'));
          }
        } else {
          reject(new Error(`Face verification failed: ${error}`));
        }
      });
    });
  }

  /**
   * Find matching user by comparing face embedding
   * @param {string} imagePath - Path to the image file
   * @param {Array} userEmbeddings - Array of user embeddings to compare against
   * @returns {Promise<Object>} Best match result
   */
  async findMatchingUser(imagePath, userEmbeddings) {
    try {
      const queryEmbedding = await this.generateEmbedding(imagePath);
      
      let bestMatch = null;
      let bestDistance = Infinity;

      for (const userEmbed of userEmbeddings) {
        const distance = this.calculateDistance(queryEmbedding, userEmbed.embedding);
        if (distance < this.threshold && distance < bestDistance) {
          bestDistance = distance;
          bestMatch = {
            userId: userEmbed.userId,
            userName: userEmbed.userName,
            distance: distance,
            verified: true
          };
        }
      }

      if (!bestMatch) {
        return {
          verified: false,
          message: 'No matching user found',
          threshold: this.threshold
        };
      }

      return bestMatch;
    } catch (error) {
      throw new Error(`Failed to find matching user: ${error.message}`);
    }
  }

  /**
   * Extract faces from image and validate
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} Face extraction result
   */
  async extractFaces(imagePath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        'extract_faces',
        imagePath
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const output = JSON.parse(result);
            if (output.success) {
              resolve({
                facesCount: output.faces_count,
                valid: output.faces_count > 0
              });
            } else {
              reject(new Error(output.error || 'Failed to extract faces'));
            }
          } catch (e) {
            reject(new Error('Invalid response from face extraction service'));
          }
        } else {
          reject(new Error(`Face extraction failed: ${error}`));
        }
      });
    });
  }

  /**
   * Calculate Euclidean distance between two embeddings
   * @param {Array} embedding1 - First embedding vector
   * @param {Array} embedding2 - Second embedding vector
   * @returns {number} Distance between embeddings
   */
  calculateDistance(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      sum += Math.pow(embedding1[i] - embedding2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Cleanup temporary image files
   * @param {string} imagePath - Path to the image file to delete
   */
  async cleanupImage(imagePath) {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup image:', error.message);
    }
  }
}

module.exports = new FaceRecognitionService();
