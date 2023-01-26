import { Options } from "swagger-jsdoc";

export default {
    openapi: "3.1.0",
    definition: {
        info: {
            title: "UGram",
            version: "1.0.0",
            description: "ULaval GLO-3112 - Projet de session"
        },
        servers: [
            {
                "url": "http://localhost:8080"
            }
        ]
    },
    apis: [
        "./api/*.ts"
    ]
} as Options;