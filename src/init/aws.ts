/* import s3 from "aws-sdk/clients/s3"; */
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";

/* export const aws = () => { */
/*   const s3Client = new s3({ */
/*     accessKeyId: process.env.AWS_ACCESS_KEY_ID, */
/*     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, */
/*     region: process.env.AWS_REGION, */
/*     signatureVersion: "v4", */
/*   }); */
/**/
/*   return s3Client; */
/* }; */

const s3Config = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
    }
});

export const upload = multer({
    limits: { fileSize: 10485760}, // 10MB
    storage: multerS3({
        s3: s3Config,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        bucket: "ugram-team9",
        key: function(_req, _file, cb) {
            cb(null, Date.now().toString());
        }
    })
});