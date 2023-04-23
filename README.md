# Design

Front-end déployé : https://release-2.d3sbc75qlxeszb.amplifyapp.com/     
Back-end déployé : https://ugram-team9.herokuapp.com/

## Framework frontend
Pour le frontend nous utiliserons VueJs avec Typescript.

## Langage/Framework backend
Nos choix de technos backend sont NodeJS avec Typescript et Express pour notre framework. Celles-ci nous permettront de s'adapter plus facilement au frontend et ainsi permettre une meilleure productivité et maintenance de notre code.

## Base de données
Nous utilisons MongoDB comme base de données pour stocker toutes les données de l'application. Son utilisation sera facilité grâce à Mongoose. Nous avons choisi une base de données NoSQL car nous estimons que les propriétés ACID ne sont pas primordiales pour l'application.
Les images seront elles stockées avec le service S3 d'AWS.

## CI/CD
Les GitHub Actions pour permettrons de tester la compilation de notre projet.

## Déploiement
Utilisation de AWS pour le front-end, et heroku pour le back-end.


# Instructions
Ce repository contient seulement la partie backend du projet. C'est pourquoi il ne lance que le serveur et la base de données.

## Implémentations
- L'application est lancée en mode production avec le docker compose.
- L'**authentification** avec [passportjs](https://www.passportjs.org/) a été implémenté. Celle-ci fonctionne avec un email et un mot de passe ou par l'oauth2 via **Google**, **GitHub** ou **Discord**.
    - Les mots de passes stockés dans la base de données sont hachés avec [bcryptjs](https://www.npmjs.com/package/bcryptjs).
    - Le cookie utilisé pour l'authentification est celui de *passportjs* et il est vérifié par un middleware sur les routes protégées.
- **Swagger** a été implémenter sur la route `/docs` (du backend) pour faciliter la documentation de l'API et ainsi plus facilement voir les paramètres des routes. Attention, la route n'est pas accessible en production (donc pas avec le docker).
- **ESLint** a été installé pour le formatage du code. Des règles assez strictes ont été ajoutées, notamment pour respecter la case.
- 3 **GitHub Actions** ont été ajoutés pour tester la compilation, le formattage du code et le déploiement.
- Des **abstractions** ont été faites sur les **routes** (notamment pour catch plus facilement les erreurs), les **schémas** Mongoose utilisés pour intéragir avec la base de données et pour les différents **objets** comme les utilisateurs et les images.
- **2 middlewares** ont été ajoutés pour les avoir des **logs** des requêtes entrantes et des erreurs.

## Prérequis
### Versions
- **Docker** version 20.10.23
- **Docker Compose** version v2.17.2

### Environnement
Pour lancer avec le docker il est important d'avoir le fichier `.env.production` créé à la racine du projet avec toutes les variables d'environnement. Sans celui-ci le backend ne pourra fonctionner correctement.  
L'environnement contient des secrets dont l'accès est limité. Envoyez un mail à l'adresse suivante pour l'obtenir: [viand6@ulaval.ca](mailto:viand6@ulaval.ca)

## Build
```bash
docker compose build
```

## Run
```bash
docker compose up
```