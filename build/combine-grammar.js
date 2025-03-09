const fs = require("fs");
const path = require("path");

// Create build directory if it doesn't exist
const syntaxDir = path.join(__dirname, "..", "syntaxes");
const includeDir = path.join(syntaxDir, "include");
if (!fs.existsSync(includeDir)) {
    fs.mkdirSync(includeDir, { recursive: true });
}

// Base grammar
let baseGrammar;
try {
    const baseGrammarPath = path.join(syntaxDir, "netlinx-base.json");
    baseGrammar = require(baseGrammarPath);
} catch (e) {
    console.error(`Error loading base grammar: ${e.message}`);
    process.exit(1);
}

// Import all the parts
try {
    // Load all the JSON files directly using require
    const comments = require(path.join(includeDir, "netlinx-comments.json"));
    const strings = require(path.join(includeDir, "netlinx-strings.json"));
    const preprocessor = require(path.join(
        includeDir,
        "netlinx-preprocessor.json"
    ));
    const sections = require(path.join(includeDir, "netlinx-sections.json"));
    const functions = require(path.join(includeDir, "netlinx-functions.json"));
    const events = require(path.join(includeDir, "netlinx-events.json"));
    const variables = require(path.join(includeDir, "netlinx-variables.json"));
    const constants = require(path.join(includeDir, "netlinx-constants.json"));
    const operators = require(path.join(includeDir, "netlinx-operators.json"));
    const keywords = require(path.join(includeDir, "netlinx-keywords.json"));
    const types = require(path.join(includeDir, "netlinx-types.json"));
    const support = require(path.join(includeDir, "netlinx-support.json"));
    const numeric = require(path.join(includeDir, "netlinx-numeric.json"));

    // Combine them
    baseGrammar.repository = {
        ...baseGrammar.repository,
        ...comments,
        ...strings,
        ...preprocessor,
        ...sections,
        ...functions,
        ...events,
        ...variables,
        ...constants,
        ...operators,
        ...keywords,
        ...types,
        ...support,
        ...numeric,
    };

    // Write the combined grammar
    fs.writeFileSync(
        path.join(syntaxDir, "netlinx.tmLanguage.json"),
        JSON.stringify(baseGrammar, null, 4)
    );

    console.log("Grammar files combined successfully!");
} catch (e) {
    console.error(`Error processing grammar files: ${e.message}`);
    process.exit(1);
}
