# Techniques de respiration améliorées

Ce répertoire contient les données des techniques de respiration utilisées par l'application BreathFlow.

## Structure des données

Le fichier `breathing_techniques.json` contient toutes les techniques de respiration disponibles dans l'application.
Chaque technique est définie avec la structure suivante :

```json
{
  "id": "technique-id",
  "title": "Nom de la technique",
  "description": "Description courte",
  "duration": "5-10 minutes",
  "route": "GenericBreathingScreen",
  "categories": ["stress", "sleep"],
  "steps": [
    { 
      "name": "Inspiration", 
      "duration": 4000, 
      "instruction": "Inspirez lentement" 
    },
    { 
      "name": "Expiration", 
      "duration": 6000, 
      "instruction": "Expirez lentement" 
    }
  ],
  "defaultDurationMinutes": 5,
  "longDescription": [
    "Premier paragraphe de description détaillée",
    "Deuxième paragraphe avec instructions"
  ]
}
```

## Ajout d'une nouvelle technique

Pour ajouter une nouvelle technique de respiration :

1. Ajoutez une nouvelle entrée dans le fichier `breathing_techniques.json`
2. Assurez-vous que l'ID est unique
3. Définissez la propriété `route` comme `GenericBreathingScreen` pour utiliser l'écran générique
4. Définissez les étapes de respiration dans la propriété `steps`

L'application chargera automatiquement la nouvelle technique au démarrage.
