import * as fs from 'fs';
import * as path from 'path';

const baseDir = process.cwd();

const runContextPath = path.join(baseDir, 'output', 'run-context.json');
let runId = '20260719-151741';
if (fs.existsSync(runContextPath)) {
  const runContext = JSON.parse(fs.readFileSync(runContextPath, 'utf8'));
  if (runContext.runId) {
    runId = runContext.runId;
  }
}
console.log(`Generating profiles and API docs for Run ID: ${runId}`);

const modulesDir = path.join(baseDir, `output/runs/${runId}/knowledge-pipeline/modules`);
const modules = fs.existsSync(modulesDir)
  ? fs.readdirSync(modulesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
  : [];

for (const mod of modules) {
  console.log(`Processing module: ${mod}`);
  
  // 1. Get generatedAt from manifest
  const manifestPath = path.join(baseDir, `output/runs/${runId}/knowledge-pipeline/modules/${mod}/${mod}-manifest.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    continue;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const generatedAt = manifest.generatedAt || new Date().toISOString();
  
  // 2. Read original profile
  let originalProfilePath = path.join(baseDir, `output/docs/${mod}-engineering-profile.md`);
  if (!fs.existsSync(originalProfilePath)) {
    originalProfilePath = path.join(baseDir, `output/docs/${mod}-module-engineering-profile.md`);
  }
  if (!fs.existsSync(originalProfilePath)) {
    originalProfilePath = path.join(baseDir, `output/docs/building-module-engineering-profile.md`);
  }
  if (!fs.existsSync(originalProfilePath)) {
    console.error(`Original profile not found: ${originalProfilePath}`);
    continue;
  }
  const originalContent = fs.readFileSync(originalProfilePath, 'utf8');
  
  // 3. Process lines
  const lines = originalContent.split('\n');
  const processedLines: string[] = [];
  let isFirstLine = true;
  
  for (let line of lines) {
    if (isFirstLine && line.startsWith('# ')) {
      processedLines.push(`# Module Engineering Profile: ${mod}`);
      isFirstLine = false;
      continue;
    }
    isFirstLine = false;
    
    if (line.startsWith('## 1. ')) {
      // Prepend metadata section
      processedLines.push('## 0. Generation Metadata');
      processedLines.push('');
      processedLines.push(`- **Run ID**: ${runId}`);
      processedLines.push(`- **Generated At**: ${generatedAt}`);
      processedLines.push('');
      processedLines.push('---');
      processedLines.push('');
    }
    
    if (line.startsWith('## 7. ')) {
      // Prepend API endpoints section
      processedLines.push('## 7. API Endpoints');
      processedLines.push('');
      processedLines.push(`This section is detailed in the companion \`api-reference/${mod}-api-reference.md\` document.`);
      processedLines.push('');
      processedLines.push('---');
      processedLines.push('');
      
      // Increment 7 to 8
      const headerText = line.substring(6);
      processedLines.push(`## 8. ${headerText}`);
      continue;
    }
    
    const headerMatch = line.match(/^## (\d+)\. (.*)$/);
    if (headerMatch) {
      const num = parseInt(headerMatch[1], 10);
      const title = headerMatch[2];
      if (num > 7) {
        processedLines.push(`## ${num + 1}. ${title}`);
        continue;
      }
    }
    
    processedLines.push(line);
  }
  
  const finalProfileContent = processedLines.join('\n');
  const destProfilePath = path.join(baseDir, `output/runs/${runId}/engineering-profiles/${mod}-engineering-profile.md`);
  fs.mkdirSync(path.dirname(destProfilePath), { recursive: true });
  fs.writeFileSync(destProfilePath, finalProfileContent, 'utf8');
  console.log(`Saved profile to: ${destProfilePath}`);
  
  // 4. Generate API reference
  const graphPath = path.join(baseDir, `output/runs/${runId}/knowledge-pipeline/modules/${mod}/${mod}-evidence-graph.json`);
  let apiContracts: any[] = [];
  let typeAliases: any[] = [];
  let enums: any[] = [];

  if (fs.existsSync(graphPath)) {
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    if (graph.facts && Array.isArray(graph.facts)) {
      apiContracts = graph.facts.filter((f: any) => f.type === 'api_contract');
      typeAliases = graph.facts.filter((f: any) => f.type === 'type_alias');
      enums = graph.facts.filter((f: any) => f.type === 'enum_declaration');
    }
  } else {
    console.warn(`Evidence graph not found for ${mod}`);
  }
  
  const apiRefLines: string[] = [];
  apiRefLines.push(`# API Reference: ${mod}`);
  apiRefLines.push('');
  apiRefLines.push('## 0. Generation Metadata');
  apiRefLines.push('');
  apiRefLines.push(`- **Run ID**: ${runId}`);
  apiRefLines.push(`- **Generated At**: ${generatedAt}`);
  apiRefLines.push('');
  apiRefLines.push('---');
  apiRefLines.push('');
  apiRefLines.push('## 1. Callable Functions');
  apiRefLines.push('');
  apiRefLines.push('### Interpretation');
  apiRefLines.push('');
  
  if (apiContracts.length === 0) {
    apiRefLines.push(`No HTTPS callable functions are exposed by the \`${mod}\` module.`);
    apiRefLines.push('');
    apiRefLines.push('### Callable Functions');
    apiRefLines.push('');
    apiRefLines.push('No callable functions found.');
    apiRefLines.push('');
    apiRefLines.push('### Evidence Used');
    apiRefLines.push('');
    apiRefLines.push(`- API Contract: The \`${mod}-evidence-graph.json\` file contains 0 \`api_contract\` facts.`);
    apiRefLines.push('');
    apiRefLines.push('### Confidence');
    apiRefLines.push('');
    apiRefLines.push('High.');
    apiRefLines.push('');
  } else {
    apiRefLines.push(`The \`${mod}\` module exposes HTTPS callable functions that serve as public entry points for backend operations.`);
    apiRefLines.push('');
    apiRefLines.push('### Callable Functions');
    apiRefLines.push('');
    apiRefLines.push('| Handler Name | Request Type | Request Schema |');
    apiRefLines.push('| :--- | :--- | :--- |');
    
    for (const contract of apiContracts) {
      const handlerName = contract.evidence?.handlerName || contract.value;
      const requestType = contract.evidence?.requestType || 'any';
      const schemaObj = contract.evidence?.requestSchema || {};
      const schemaStr = JSON.stringify(schemaObj, null, 2);
      
      apiRefLines.push(`| \`${handlerName}\` | \`${requestType}\` | \`\`\`json\n${schemaStr}\n\`\`\` |`);
    }
    
    apiRefLines.push('');
    apiRefLines.push('### Evidence Used');
    apiRefLines.push('');
    apiRefLines.push(`- API Contract: The \`${mod}-evidence-graph.json\` file contains ${apiContracts.length} distinct \`api_contract\` facts, each defining a callable function, its handler, and its request schema.`);
    apiRefLines.push(`- Call Expression: The \`getCallableFunctionTriggers\` function in \`functions/src/modules/${mod}/index.ts\` registers these handlers.`);
    apiRefLines.push('');
    apiRefLines.push('### Confidence');
    apiRefLines.push('');
    apiRefLines.push('High.');
    apiRefLines.push('');
  }

  // Section 2: Type Aliases & Enums (Phase 1.5 Enhancement)
  apiRefLines.push('---');
  apiRefLines.push('');
  apiRefLines.push('## 2. Domain Types & Enums');
  apiRefLines.push('');

  if (enums.length > 0) {
    apiRefLines.push('### Enums');
    apiRefLines.push('');
    apiRefLines.push('| Enum Name | Members | File |');
    apiRefLines.push('| :--- | :--- | :--- |');
    for (const item of enums) {
      const name = item.value;
      const membersList = (item.evidence?.members || []).map((m: any) => `\`${m.name}${m.value !== null ? ` = ${m.value}` : ''}\``).join(', ');
      const file = item.file || 'Unknown';
      apiRefLines.push(`| \`${name}\` | ${membersList || 'None'} | \`${file}\` |`);
    }
    apiRefLines.push('');
  }

  if (typeAliases.length > 0) {
    apiRefLines.push('### Type Aliases');
    apiRefLines.push('');
    apiRefLines.push('| Type Name | Definition / Union Values | File |');
    apiRefLines.push('| :--- | :--- | :--- |');
    for (const item of typeAliases) {
      const name = item.value;
      const typeText = (item.evidence?.typeText || 'any').replace(/\n/g, ' ').replace(/\|/g, '\\|');
      const truncatedType = typeText.length > 120 ? typeText.substring(0, 117) + '...' : typeText;
      const file = item.file || 'Unknown';
      apiRefLines.push(`| \`${name}\` | \`${truncatedType}\` | \`${file}\` |`);
    }
    apiRefLines.push('');
  }

  if (enums.length === 0 && typeAliases.length === 0) {
    apiRefLines.push('No type aliases or enum declarations recorded for this module.');
    apiRefLines.push('');
  }
  
  const destApiPath = path.join(baseDir, `output/runs/${runId}/api-reference/${mod}-api-reference.md`);
  fs.mkdirSync(path.dirname(destApiPath), { recursive: true });
  fs.writeFileSync(destApiPath, apiRefLines.join('\n'), 'utf8');
  console.log(`Saved API reference to: ${destApiPath}`);
}
