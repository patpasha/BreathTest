# Scripts d'optimisation pour BreathFlow

Ce dossier contient des scripts utilitaires pour optimiser l'application BreathFlow.

## Scripts disponibles

### optimize-images.js

Script pour optimiser les images (PNG, JPEG, WebP) de l'application en réduisant leur taille sans perte visible de qualité.

**Prérequis:**
```bash
npm install sharp --save-dev
```

**Utilisation:**
```bash
node scripts/optimize-images.js
```

**Fonctionnalités:**
- Recherche récursive de tous les fichiers d'images dans le projet
- Compression des images avec sharp selon leur format
- Ignorer les petites images (< 10 Ko)
- Conserver les originaux si l'optimisation n'améliore pas la taille
- Affichage des statistiques d'économie d'espace

### analyze-bundle.js

Script pour analyser la taille des dépendances du projet et identifier les plus volumineuses.

**Utilisation:**
```bash
node scripts/analyze-bundle.js
```

**Fonctionnalités:**
- Calcul de la taille totale de node_modules
- Identification des 20 dépendances les plus volumineuses
- Calcul du pourcentage de chaque dépendance par rapport au total
- Suggestions d'optimisation

### clean-project.js

Script pour nettoyer les fichiers temporaires et caches du projet.

**Prérequis:**
```bash
npm install rimraf --save-dev
```

**Utilisation:**
```bash
node scripts/clean-project.js
```

**Fonctionnalités:**
- Suppression des dossiers node_modules, .expo, et autres caches
- Nettoyage des caches npm et yarn
- Calcul de l'espace libéré

### update-breathing-screens.js

Script pour mettre à jour les écrans de respiration avec les props de navigation.

**Utilisation:**
```bash
node scripts/update-breathing-screens.js
```

**Fonctionnalités:**
- Ajoute l'import de BreathingScreenProps dans chaque écran de respiration
- Met à jour la signature des composants pour accepter les props de navigation
- Affiche un rapport de progression pour chaque fichier mis à jour

### remove-dev-code.js

Script pour supprimer le code spécifique au développement dans les fichiers source.

**Utilisation:**
```bash
node scripts/remove-dev-code.js
```

**Fonctionnalités:**
- Suppression des blocs if (__DEV__) { ... }
- Suppression des blocs entre les commentaires // __DEV__ START et // __DEV__ END
- Affichage des statistiques de fichiers modifiés

### measure-bundle-size.js

Script pour mesurer la taille du bundle JavaScript de l'application.

**Utilisation:**
```bash
node scripts/measure-bundle-size.js
```

**Fonctionnalités:**
- Construction des bundles Android et iOS
- Mesure de la taille des bundles
- Affichage des résultats en Mo

### build-optimized.js

Script pour effectuer un build optimisé de l'application avec EAS Build.

**Utilisation:**
```bash
node scripts/build-optimized.js [android|ios]
```

**Fonctionnalités:**
- Optimisation des images
- Suppression du code de développement
- Build de l'application en mode production avec EAS Build
- Vérification de l'installation d'EAS CLI
- Création automatique du fichier eas.json si nécessaire

### build-local.js

Script pour effectuer un build local de l'application sans EAS Build.

**Utilisation:**
```bash
node scripts/build-local.js [android|ios]
```

**Fonctionnalités:**
- Optimisation des images
- Suppression du code de développement
- Build local de l'application en mode production
- Génération d'APK pour Android ou d'archive pour iOS

### build-apk.js

Script pour générer un APK Android sans nécessiter d'appareil connecté.

**Utilisation:**
```bash
node scripts/build-apk.js
```

**Fonctionnalités:**
- Optimisation des images
- Suppression du code de développement
- Préparation du projet pour Android
- Génération de l'APK avec Gradle
- Copie de l'APK dans le répertoire racine du projet

### check-prerequisites.js

Script pour vérifier les prérequis nécessaires au développement et au build.

**Utilisation:**
```bash
node scripts/check-prerequisites.js
```

**Fonctionnalités:**
- Vérification de Node.js et npm
- Vérification de Java (pour Android)
- Vérification de Xcode (pour iOS)
- Vérification d'Android SDK (pour Android)
- Vérification d'Expo CLI et EAS CLI
- Recommandations pour l'installation des outils manquants
- Résumé des builds possibles

### generate-test-stats.js

Script pour générer des données de test pour les statistiques.

**Utilisation:**
```bash
node scripts/generate-test-stats.js [nombre_de_sessions]
```

**Fonctionnalités:**
- Génération de sessions aléatoires avec différentes techniques de respiration
- Calcul des statistiques globales (durée totale, sessions complétées, note moyenne)
- Calcul des techniques les plus utilisées
- Enregistrement des données dans un fichier JSON

## Ajout de scripts au package.json

Ajoutez ces scripts à votre fichier package.json pour les exécuter facilement:

```json
"scripts": {
  "optimize-images": "node scripts/optimize-images.js",
  "analyze-bundle": "node scripts/analyze-bundle.js",
  "clean": "node scripts/clean-project.js",
  "update-breathing-screens": "node scripts/update-breathing-screens.js",
  "remove-dev-code": "node scripts/remove-dev-code.js",
  "measure-bundle": "node scripts/measure-bundle-size.js",
  "build:optimized:android": "node scripts/build-optimized.js android",
  "build:optimized:ios": "node scripts/build-optimized.js ios",
  "build:local:android": "node scripts/build-local.js android",
  "build:local:ios": "node scripts/build-local.js ios",
  "build:apk": "node scripts/build-apk.js",
  "generate-test-stats": "node scripts/generate-test-stats.js",
  "check-prereq": "node scripts/check-prerequisites.js"
}
```

Pour les exécuter:
```bash
npm run optimize-images
npm run analyze-bundle
npm run clean
npm run update-breathing-screens
npm run remove-dev-code
npm run measure-bundle
npm run build:optimized:android
npm run build:optimized:ios
npm run build:local:android
npm run build:local:ios
npm run build:apk
npm run generate-test-stats
npm run check-prereq
```
