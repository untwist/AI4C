#!/usr/bin/env node

/**
 * Emoji Checker Script
 * 
 * This script scans the codebase for emojis and prevents commits
 * if any are found. Run this before committing to ensure
 * the no-emoji policy is maintained.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common emoji patterns to check for
const EMOJI_PATTERNS = [
    // Faces and people
    /[\u{1F600}-\u{1F64F}]/gu,
    // Objects and symbols
    /[\u{1F300}-\u{1F5FF}]/gu,
    // Transport and map symbols
    /[\u{1F680}-\u{1F6FF}]/gu,
    // Regional indicator symbols
    /[\u{1F1E0}-\u{1F1FF}]/gu,
    // Miscellaneous symbols
    /[\u{2600}-\u{26FF}]/gu,
    // Dingbats
    /[\u{2700}-\u{27BF}]/gu,
    // Additional emoji ranges
    /[\u{1F900}-\u{1F9FF}]/gu,
    /[\u{1FA70}-\u{1FAFF}]/gu,
    // Specific common emojis that were found in this project
    /[🎯📊🎓🔢📏📈🔵🔴🎲✅🔬🔄💡🖼️📚📧💰🏥🧬🏠🧠⚖️🟡🏆🍎]/g
];

// File extensions to check
const FILE_EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.md', '.txt', '.json'];

// Directories to scan
const SCAN_DIRECTORIES = ['src', 'public'];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const issues = [];

        lines.forEach((line, index) => {
            EMOJI_PATTERNS.forEach(pattern => {
                const matches = line.match(pattern);
                if (matches) {
                    issues.push({
                        file: filePath,
                        line: index + 1,
                        content: line.trim(),
                        emojis: matches
                    });
                }
            });
        });

        return issues;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return [];
    }
}

function scanDirectory(dirPath) {
    const issues = [];

    try {
        const items = fs.readdirSync(dirPath);

        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                issues.push(...scanDirectory(fullPath));
            } else if (stat.isFile()) {
                const ext = path.extname(item);
                if (FILE_EXTENSIONS.includes(ext)) {
                    issues.push(...scanFile(fullPath));
                }
            }
        });
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error.message);
    }

    return issues;
}

function main() {
    console.log('🔍 Scanning for emojis...\n');

    const allIssues = [];

    SCAN_DIRECTORIES.forEach(dir => {
        if (fs.existsSync(dir)) {
            allIssues.push(...scanDirectory(dir));
        }
    });

    if (allIssues.length === 0) {
        console.log('✅ No emojis found! Code is clean.');
        process.exit(0);
    } else {
        console.log(`❌ Found ${allIssues.length} emoji(s) in the codebase:\n`);

        allIssues.forEach(issue => {
            console.log(`📁 ${issue.file}:${issue.line}`);
            console.log(`   ${issue.content}`);
            console.log(`   Found emojis: ${issue.emojis.join(', ')}\n`);
        });

        console.log('🚫 Commit blocked! Please remove all emojis before committing.');
        console.log('\n💡 Remember: This project has a strict NO EMOJIS policy.');
        console.log('   Use descriptive text instead of emojis for professional presentation.');

        process.exit(1);
    }
}

// Run the check
main();
