#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts PNG images to optimized WebP format
 *
 * Usage:
 *   1. npm install sharp --save-dev
 *   2. node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../public/screenshots/edited');
const OUTPUT_DIR = path.join(__dirname, '../public/screenshots/optimized');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function optimizeImage(filename) {
    const inputPath = path.join(SCREENSHOTS_DIR, filename);
    const baseName = path.parse(filename).name;
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.webp`);

    try {
        const inputStats = fs.statSync(inputPath);
        const inputSizeMB = (inputStats.size / (1024 * 1024)).toFixed(2);

        await sharp(inputPath)
            .webp({
                quality: 80,  // Good balance of quality and size
                effort: 6     // Higher compression effort
            })
            .resize(800, null, {  // Max width 800px, maintain aspect ratio
                withoutEnlargement: true,
                fit: 'inside'
            })
            .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);
        const outputSizeKB = (outputStats.size / 1024).toFixed(0);
        const reduction = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(1);

        console.log(`✅ ${filename}: ${inputSizeMB} MB → ${outputSizeKB} KB (${reduction}% smaller)`);
        return { success: true, saved: inputStats.size - outputStats.size };
    } catch (error) {
        console.error(`❌ ${filename}: ${error.message}`);
        return { success: false, saved: 0 };
    }
}

async function main() {
    console.log('🖼️  Image Optimization Script\n');
    console.log(`Input:  ${SCREENSHOTS_DIR}`);
    console.log(`Output: ${OUTPUT_DIR}\n`);

    const files = fs.readdirSync(SCREENSHOTS_DIR)
        .filter(f => f.endsWith('.png'));

    if (files.length === 0) {
        console.log('No PNG files found to optimize.');
        return;
    }

    console.log(`Found ${files.length} PNG files to optimize:\n`);

    let totalSaved = 0;
    for (const file of files) {
        const result = await optimizeImage(file);
        totalSaved += result.saved;
    }

    const totalSavedMB = (totalSaved / (1024 * 1024)).toFixed(1);
    console.log(`\n🎉 Done! Total saved: ${totalSavedMB} MB`);
    console.log(`\nOptimized images are in: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review the optimized images in /public/screenshots/optimized/');
    console.log('2. Update image references in code to use .webp from /screenshots/optimized/');
}

main().catch(console.error);
