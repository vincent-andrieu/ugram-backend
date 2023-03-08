/* eslint-disable @typescript-eslint/naming-convention */
import { S3Client } from "@aws-sdk/client-s3";
import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import { env } from "process";

// export const aws = () => {
//     const s3Client = new S3({
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//         region: process.env.AWS_REGION,
//         signatureVersion: "v4"
//     });

//     return s3Client;
// };

export const s3 = new AWS.S3();

if (!env.AWS_ACCESS_KEY_ID)
    throw new Error("AWS_ACCESS_KEY_ID environment variable not found");
if (!env.AWS_SECRET_ACCESS_KEY)
    throw new Error("AWS_SECRET_ACCESS_KEY environment variable not found");
if (!env.AWS_BUCKET)
    throw new Error("AWS_BUCKET environment variable not found");

export const AWS_BUCKET = env.AWS_BUCKET;
const s3Config = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
});

export const upload = multer({
    limits: { fileSize: 10485760}, // 10MB
    storage: multerS3({
        s3: s3Config,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        bucket: env.AWS_BUCKET,
        key: function(_req, _file, cb) {
            cb(null, Date.now().toString());
        }
    })
});