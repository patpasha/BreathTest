const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Fonction pour générer une icône
function generateIcon(outputPath, size, isAdaptive = false) {
  // Créer un canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Couleur de fond
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, size, size);

  // Calculer les dimensions en fonction de la taille
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.4;
  const innerRadius = size * 0.28;
  const lineWidth = size * 0.015;
  const fontSize = size * 0.3;

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
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = gradient;
  ctx.stroke();

  // Cercle intérieur (bulle)
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#3498db';
  ctx.fill();

  // Ajouter la lettre "B" au centre
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', centerX, centerY);

  // Enregistrer l'image
  const buffer = canvas.toBuffer('image/png');

  // Créer le répertoire s'il n'existe pas
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`Icône générée avec succès: ${outputPath}`);
}

// Générer les différentes icônes
generateIcon(path.join(__dirname, '../assets/icon.png'), 1024);
generateIcon(path.join(__dirname, '../assets/adaptive-icon.png'), 1024, true);
generateIcon(path.join(__dirname, '../assets/favicon.png'), 196); 