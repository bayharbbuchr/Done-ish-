const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Icon sizes to generate
const sizes = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'icon-152x152.png', size: 152 },
    { name: 'icon-167x167.png', size: 167 },
    { name: 'icon-180x180.png', size: 180 },
    { name: 'icon-120x120.png', size: 120 },
    { name: 'icon-87x87.png', size: 87 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'badge.png', size: 96 } // For notifications
];

// Create a simple icon with the Done(ish) design
async function generateIcon(outputPath, size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.fillRect(0, 0, size, size);
    
    // Draw document shape
    const padding = size * 0.1;
    const docWidth = size - (padding * 2);
    const docHeight = docWidth * 1.4;
    const docX = (size - docWidth) / 2;
    const docY = (size - docHeight) / 2;
    
    // Draw document
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, docX, docY, docWidth, docHeight, 10, true, false);
    
    // Draw lines on the document
    const lineHeight = docHeight * 0.08;
    const lineSpacing = docHeight * 0.12;
    const lineY = docY + (docHeight * 0.3);
    
    // Draw checkboxes and lines
    for (let i = 0; i < 3; i++) {
        const y = lineY + (i * lineSpacing);
        
        // Draw checkbox
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, size * 0.01);
        ctx.strokeRect(docX + (docWidth * 0.1), y - (lineHeight * 0.6), lineHeight, lineHeight);
        
        // Draw checkmark in first checkbox
        if (i === 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#00AA00';
            ctx.lineWidth = Math.max(2, size * 0.015);
            ctx.moveTo(docX + (docWidth * 0.12), y - (lineHeight * 0.4));
            ctx.lineTo(docX + (docWidth * 0.2), y - (lineHeight * 0.2));
            ctx.lineTo(docX + (docWidth * 0.3), y - (lineHeight * 0.5));
            ctx.stroke();
        }
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, size * 0.006);
        ctx.moveTo(docX + (docWidth * 0.3), y);
        ctx.lineTo(docX + (docWidth * 0.8), y);
        ctx.stroke();
    }
    
    // Draw face (simple smiley)
    if (size >= 120) {
        const faceX = docX + (docWidth * 0.6);
        const faceY = docY + (docHeight * 0.25);
        const faceSize = docWidth * 0.3;
        
        // Eyes
        ctx.beginPath();
        ctx.arc(faceX - (faceSize * 0.15), faceY, faceSize * 0.1, 0, Math.PI * 2);
        ctx.arc(faceX + (faceSize * 0.15), faceY, faceSize * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(faceX, faceY + (faceSize * 0.1), faceSize * 0.2, 0, Math.PI, false);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, size * 0.01);
        ctx.stroke();
    }
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Generated ${outputPath}`);
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

// Generate all icons
async function generateAllIcons() {
    // Create icons directory if it doesn't exist
    if (!fs.existsSync('./icons')) {
        fs.mkdirSync('./icons');
    }
    
    // Generate each icon
    for (const { name, size } of sizes) {
        await generateIcon(`./${name}`, size);
    }
    
    console.log('All icons generated successfully!');
}

// Run the generator
generateAllIcons().catch(console.error);
