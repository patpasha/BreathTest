# Changelog de BreathFlow

## [Non publié]

### Optimisation et corrections TypeScript (01/03/2025)

#### Ajout de scripts d'optimisation
- Script `optimize-images.js` pour compresser les images PNG sans perte visible de qualité
- Script `analyze-bundle.js` pour analyser la taille des dépendances du projet
- Script `clean-project.js` pour nettoyer les fichiers temporaires et caches
- Documentation détaillée des scripts dans `scripts/README.md`

#### Corrections TypeScript
- Mise à jour de `tsconfig.json` pour supporter les imports dynamiques
- Ajout du type `BreathingScreenProps` pour les écrans de respiration
- Script d'automatisation `update-breathing-screens.js` pour mettre à jour tous les écrans de respiration

#### Améliorations de performance
- Implémentation du lazy loading pour les écrans de respiration
- Ajout du composant LoadingScreen pour les transitions pendant le chargement
- Réduction de la taille initiale de l'application

## [1.0.0] - 2025-02-28

### Fonctionnalités principales
- Interface utilisateur intuitive avec navigation par onglets
- Plusieurs techniques de respiration guidées
- Statistiques de progression
- Système de notifications pour rappels quotidiens
- Support des thèmes clair et sombre
