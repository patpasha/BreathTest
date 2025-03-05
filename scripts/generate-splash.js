const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Dimensions de l'image (1024x1024 comme recommandé par Expo)
const width = 1024;
const height = 1024;

// Créer un canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Couleur de fond
ctx.fillStyle = '#121212';
ctx.fillRect(0, 0, width, height);

// Dessiner les cercles concentriques
const centerX = width / 2;
const centerY = height / 2;
const radius = 350;

// Cercle principal
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.fillStyle = '#2196F3'; // Bleu plus doux
ctx.fill();

// Cercle intermédiaire
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
ctx.fillStyle = '#64B5F6'; // Bleu plus clair
ctx.fill();

// Cercle central
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
ctx.fillStyle = '#BBDEFB'; // Bleu très clair
ctx.fill();

// Contour blanc
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.lineWidth = 15;
ctx.strokeStyle = '#FFFFFF';
ctx.stroke();

// Ajouter le texte "BreathFlow" en bas
ctx.font = 'bold 80px Arial';
ctx.fillStyle = '#FFFFFF';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('BreathFlow', centerX, centerY + 500);

// Enregistrer l'image
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '../assets/splash-icon.png');

// Créer le répertoire s'il n'existe pas
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, buffer);
console.log(`Image de splashscreen générée avec succès: ${outputPath}`); 