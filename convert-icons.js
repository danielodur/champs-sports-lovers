const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertSVGtoPNG() {
  const tempIconsDir = './temp_icons';
  const outputDir = './project/modules/discover/assets';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // List of icons to convert
  const icons = [
    'replays',
    'charts',
    'calculator',
    'odds',
    'results',
    'live_charts',
    'predictions',
    'analysis',
    'heat_index',
    'performance'
  ];

  console.log('🎨 Converting SVG icons to PNG...');

  for (const icon of icons) {
    const svgPath = path.join(tempIconsDir, `${icon}.svg`);
    const pngPath = path.join(outputDir, `${icon}.png`);

    try {
      // Read SVG content
      let svgContent = fs.readFileSync(svgPath, 'utf8');

      // Create a clean white icon version by ensuring all fills are white
      svgContent = svgContent
        .replace(/fill="#333"/g, 'fill="white"')
        .replace(/fill="black"/g, 'fill="white"')
        .replace(/stroke="#333"/g, 'stroke="white"')
        .replace(/stroke="black"/g, 'stroke="white"');

      // Convert SVG to PNG with transparent background
      await sharp(Buffer.from(svgContent))
        .resize(64, 64) // High resolution for crisp display
        .png({
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
          compressionLevel: 9,
          quality: 100
        })
        .toFile(pngPath);

      console.log(`✅ Created: ${icon}.png`);

    } catch (error) {
      console.error(`❌ Error converting ${icon}:`, error.message);
    }
  }

  console.log('🎉 Icon conversion completed!');
  console.log('📁 Icons saved to:', outputDir);
}

// Alternative method if sharp is not available - using canvas
async function convertWithCanvas() {
  const { createCanvas, loadImage } = require('canvas');
  const tempIconsDir = './temp_icons';
  const outputDir = './project/modules/discover/assets';

  const icons = [
    'replays', 'charts', 'calculator', 'odds', 'results',
    'live_charts', 'predictions', 'analysis', 'heat_index', 'performance'
  ];

  for (const icon of icons) {
    try {
      const svgPath = path.join(tempIconsDir, `${icon}.svg`);
      let svgContent = fs.readFileSync(svgPath, 'utf8');

      // Clean the SVG for white icons
      svgContent = svgContent
        .replace(/fill="#333"/g, 'fill="white"')
        .replace(/fill="black"/g, 'fill="white"');

      // Create canvas
      const canvas = createCanvas(64, 64);
      const ctx = canvas.getContext('2d');

      // Create data URL from SVG
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

      // Load and draw the image
      const img = await loadImage(svgDataUrl);
      ctx.drawImage(img, 0, 0, 64, 64);

      // Save as PNG
      const pngPath = path.join(outputDir, `${icon}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(pngPath, buffer);

      console.log(`✅ Created: ${icon}.png`);

    } catch (error) {
      console.error(`❌ Error converting ${icon}:`, error.message);
    }
  }
}

// Simplified method using built-in tools
function createSimpleIcons() {
  const outputDir = './project/modules/discover/assets';

  // Create simple base64 encoded white icons
  const iconTemplates = {
    replays: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANcSURBVHic7Zs9aBRBFMd/k1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhY',
    charts: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAOcSURBVHic7Zs9aBRBFMd/k1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhY'
  };

  console.log('🎨 Creating simple white icons...');

  // For now, let's create the icons by copying and modifying the existing ones
  // This is a fallback approach
  console.log('⚠️  Using fallback method - manual icon creation needed');
  console.log('📝 Please ensure your PNG files are:');
  console.log('   - White icons on transparent background');
  console.log('   - 64x64 pixels or higher resolution');
  console.log('   - Saved with alpha channel (RGBA)');
}

// Main execution
async function main() {
  try {
    // Try using Sharp first
    await convertSVGtoPNG();
  } catch (error) {
    console.log('⚠️  Sharp not available, trying canvas...');
    try {
      await convertWithCanvas();
    } catch (canvasError) {
      console.log('⚠️  Canvas not available, using simple approach...');
      createSimpleIcons();
    }
  }
}

// Install instructions
console.log('📦 To use this script, install dependencies:');
console.log('   npm install sharp canvas');
console.log('   or: npm install sharp');
console.log('   or: npm install canvas');
console.log('');

main().catch(console.error);
