import mongoose from "mongoose";
import { env } from "process";

mongoose.set("strictQuery", false);

export default async function initDatabase(): Promise<void> {
    if (!env.MONGO_HOST || !env.MONGO_PORT || !env.MONGO_DB_NAME)
        throw new Error("Missing database configuration");
    const baseUri = `${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_DB_NAME}`;
    let uris;
    if (env.MONGO_URL)
        uris = env.MONGO_URL;
    else
        uris = env.MONGO_USERNAME && env.MONGO_PASSWORD ?
            `mongodb://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@${baseUri}?authSource=admin` :
            `mongodb://${baseUri}`;

    if ((env.MONGO_USERNAME && !env.MONGO_PASSWORD) || (!env.MONGO_USERNAME && env.MONGO_PASSWORD))
        throw new Error("Invalid database credentials");
    try {
        console.log("Connecting to database...");
        await mongoose.connect(uris);
    } catch (error) {
        throw new Error("Database connection failed");
    }
    console.info("DataBase successfully connected : \n\t- Address : " +
        env.MONGO_HOST +
        "\n\t- Port : " + env.MONGO_PORT +
        "\n\t- Name : " + env.MONGO_DB_NAME
    );
}