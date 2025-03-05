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

// Dessiner un cercle extérieur (anneau)
const centerX = width / 2;
const centerY = height / 2;
const outerRadius = 400;

// Anneau extérieur avec dégradé
const gradient = ctx.createLinearGradient(
  centerX - outerRadius, 
  centerY - outerRadius, 
  centerX + outerRadius, 
  centerY + outerRadius
);
gradient.addColorStop(0, '#3498db');
gradient.addColorStop(1, '#3498db99');

ctx.beginPath();
ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
ctx.lineWidth = 15;
ctx.strokeStyle = gradient;
ctx.stroke();

// Cercle intérieur (bulle)
const innerRadius = 280;
ctx.beginPath();
ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
ctx.fillStyle = '#3498db';
ctx.fill();

// Ajouter la lettre "B" au centre
ctx.font = 'bold 300px Arial';
ctx.fillStyle = '#FFFFFF';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('B', centerX, centerY);

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