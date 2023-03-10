import { S3 } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { env } from "process";

export default class AWSService {
    public readonly s3: S3;
    public readonly multer: multer.Multer;

    constructor() {
        if (!env.AWS_ACCESS_KEY_ID)
            throw new Error("AWS_ACCESS_KEY_ID environment variable not found");
        if (!env.AWS_SECRET_ACCESS_KEY)
            throw new Error("AWS_SECRET_ACCESS_KEY environment variable not found");

        this.s3 = new S3({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string
            }
        });

        this.multer = multer({
            limits: { fileSize: 10485760}, // 10MB
            storage: multerS3({
                s3: this.s3,
                contentType: multerS3.AUTO_CONTENT_TYPE,
                bucket: env.AWS_BUCKET as string,
                key: function(_req, _file, cb) {
                    cb(null, Date.now().toString());
                }
            }),
            fileFilter(_req, file, callback) {
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/))
                    return callback(new Error("Only image files are allowed!"));

                callback(null, true);
            }
        });
    }

    public get bucket(): string {
        if (!env.AWS_BUCKET)
            throw new Error("AWS_BUCKET environment variable not found");

        return env.AWS_BUCKET;
    }
}