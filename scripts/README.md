# Scripts d'optimisation pour BreathFlow

Ce dossier contient des scripts utilitaires pour optimiser l'application BreathFlow.

## Scripts disponibles

### optimize-images.js

Script pour optimiser les images PNG de l'application en réduisant leur taille sans perte visible de qualité.

**Prérequis:**
```bash
npm install sharp --save-dev
```

**Utilisation:**
```bash
node scripts/optimize-images.js
```

**Fonctionnalités:**
- Recherche récursive de tous les fichiers PNG dans le projet
- Compression des images avec sharp
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

## Ajout de scripts au package.json

Ces scripts sont déjà ajoutés à votre fichier package.json et peuvent être exécutés facilement:

```json
"scripts": {
  "optimize-images": "node scripts/optimize-images.js",
  "analyze-bundle": "node scripts/analyze-bundle.js",
  "clean": "node scripts/clean-project.js",
  "update-breathing-screens": "node scripts/update-breathing-screens.js"
}
```

Pour les exécuter:
```bash
npm run optimize-images
npm run analyze-bundle
npm run clean
npm run update-breathing-screens
```
