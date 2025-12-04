/**
 * Image Upload Service using Cloudflare R2
 * Handles file validation, upload to R2, and URL generation
 */

const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client, bucket, publicUrl } = require('../config/cloudflare');
const crypto = require('crypto');
const path = require('path');

class ImageUploadService {
  /**
   * Validate image file
   */
  static validateImage(file) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WEBP');
    }

    if (file.size > maxSize) {
      throw new Error('Kích thước file vượt quá 5MB');
    }

    return true;
  }

  /**
   * Generate unique filename
   */
  static generateFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    return `products/${timestamp}-${randomString}${ext}`;
  }

  /**
   * Upload single image to R2
   */
  static async uploadImage(file) {
    try {
      // Validate
      this.validateImage(file);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname);

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Make object publicly accessible
        // Note: You need to set bucket policy or use R2 public access settings
      });

      await r2Client.send(command);

      // Generate public URL
      const imageUrl = `${publicUrl}/${filename}`;

      return {
        url: imageUrl,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(files) {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete image from R2
   */
  static async deleteImage(filename) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: filename,
      });

      await r2Client.send(command);
      return true;
    } catch (error) {
      console.error('R2 delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(filenames) {
    const deletePromises = filenames.map(filename => this.deleteImage(filename));
    return Promise.all(deletePromises);
  }

  /**
   * Extract filename from URL
   */
  static extractFilenameFromUrl(url) {
    if (!url) return null;
    // Extract filename from URL: https://images.bidhub.com/products/xxx.jpg -> products/xxx.jpg
    const urlParts = url.split('/');
    const filenameIndex = urlParts.findIndex(part => part === 'products');
    if (filenameIndex !== -1) {
      return urlParts.slice(filenameIndex).join('/');
    }
    return null;
  }
}

module.exports = ImageUploadService;
