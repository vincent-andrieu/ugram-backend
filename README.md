# Design

## Framework frontend
Pour le frontend nous utiliserons VueJs avec Typescript.

## Langage/Framework backend
Nos choix de technos backend sont NodeJS avec Typescript et Express pour notre framework. Celles-ci nous permettront de s'adapter plus facilement au frontend et ainsi permettre une meilleure productivité et maintenance de notre code.

## Base de données
Nous utilisons MongoDB comme base de données pour stocker toutes les données de l'application. Son utilisation sera facilité grâce à Mongoose. Nous avons choisi une base de données NoSQL car nous estimons que les propriétés ACID ne sont pas primordiales pour l'application. De plus MongoDB nous permet de stocker des fichiers en BSON jusqu'à 16 Mo ce qui est largement suffisant pour des photos. Une évolution possible pourra être d'utiliser GridFS pour stocker des fichiers plus volumineux comme des vidéos par exemple.
Enfin nous sommes tous formés avec MongoDB et nous n'auront pas besoins de se former sur une nouvelle technologie.

## CI/CD
Les GitHub Actions pour permettrons de tester la compilation de notre projet.

## Déploiement
Nous utiliserons la méthode de déploiement proposée par le cours, soit AWS.
