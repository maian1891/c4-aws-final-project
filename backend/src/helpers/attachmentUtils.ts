import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'
const AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('fileStorage logic')

// TODO: Implement the fileStorage logic
export class AttachmentUtils {
    constructor(
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly s3 = new XAWS.S3({
            signatureVersion: 'v4'
          }),
    private readonly urlExpiration = Number(process.env.SIGNED_URL_EXPIRATION)
    ) {}

    async getUploadURL(todoId: string): Promise<string> {
        logger.info("getting url for todo " + todoId)
        
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: this.urlExpiration
          })
    }

}