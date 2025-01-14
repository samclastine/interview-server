import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
// ------------------------------------
// 1) Initialize model
// ------------------------------------
const model = new ChatOpenAI({
  model: "gpt-4o", // or "gpt-4-32k", "gpt-3.5-turbo", etc.
  temperature: 0,
  apiKey: "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"
});

// ------------------------------------
// 2) Define Prompt Templates for the Extraction Layer
//    a) DDC Prompt
//    b) KPC Prompt
//    c) OBS Prompt
// ------------------------------------
const ddcExtractionPrompt = PromptTemplate.fromTemplate(`
DDC Prompt:

You have the following **Do's and Don'ts** guidelines:
{guidelines}

You also have the following script:
{script}

Your task:
1. Compare the script against each of the Do's and Don'ts.
2. Note any sections where the script violates the guidelines or is missing required elements.
3. Provide a concise bullet-point summary of your findings, highlighting areas of compliance and non-compliance.
4. Do not rewrite or modify the script; simply analyze it based on the existing text.

Output:
`);
const kpcExtractionPrompt = PromptTemplate.fromTemplate(`
KPC Prompt:

You are given the following influencer script:
{script}

Your task:
1. Extract a concise, bullet-point summary of the **key points** covered in this script.
2. Focus specifically on mentions of Milanote features, any call to action (CTA), tone, and sponsor-related references.
3. Do not include any additional commentary or summaries.

Output: 
`);

const obsExtractionPrompt = PromptTemplate.fromTemplate(`
OBS Prompt:

You are a brand safety analyst reviewing the following script:
{script}

Your task:
1. Examine the script for any language, imagery, or references that could pose a brand safety concern (e.g., offensive language, sensitive topics, disparaging remarks, etc.).
2. Note any instances that may violate commonly accepted brand guidelines (profanity, hate speech, violence, inappropriate humor, etc.).
3. Highlight any required disclosures (e.g., sponsor disclosures), ensuring they are present and properly stated.
4. Provide a concise bullet-point summary of potential risks or compliance issues. If no issues are found, state that the script is brand-safe.
5. Do not rewrite or modify the script—simply give your analysis based on the existing text.

Output:
`);



// DDC extraction chain
const ddcExtractionChain = RunnableSequence.from([
  // Provide the template with needed context
  {
    script: (input) => input.script,
    guidelines: (input) => input.guidelines,
  },
  ddcExtractionPrompt,
  model,
  new StringOutputParser(),
]);

// KPC extraction chain
const kpcExtractionChain = RunnableSequence.from([
  {
    script: (input) => input.script,
  },
  kpcExtractionPrompt,
  model,
  new StringOutputParser(),
]);

// OBS extraction chain
const obsExtractionChain = RunnableSequence.from([
  {
    script: (input) => input.script,
  },
  obsExtractionPrompt,
  model,
  new StringOutputParser(),
]);


const ddcEvalPrompt = PromptTemplate.fromTemplate(`
DDC eval Prompt:
You have the following:
Script: {script}
Do's and Don'ts guidelines: {guidelines}
Do's and Don'ts Compliance output produced by the extraction layer of the Script: {ddcExtractionOutput}.

Your task:
1. Evaluate whether the DDC output accurately identifies compliance or non-compliance with each Do and Don’t.
2. Check if the output missed any potential violations or if it incorrectly flagged compliant sections.
3. Provide a concise summary of any corrections, additions, or clarifications needed to improve the DDC output’s accuracy.

**Output your evaluation as a JSON object** with the following structure:
{{
  "DDC_Eval": {{
    "drawbacks": [/* Array of potential issues or shortcomings */],
    "benefits": [/* Array of strengths or positive findings */]
}}
}}
`);

const kpcEvalPrompt = PromptTemplate.fromTemplate(`
KPC eval Prompt:

You have the following:
Script: {script}
The KPC (Key Points Coverage) output produced by the extraction layer of the Script: {kpcExtractionOutput}

Your task:
1. Verify if the KPC output correctly captures all relevant key points mentioned in the script.
2. Identify any key points from the script that might have been overlooked or misrepresented.
3. Provide a concise summary of any corrections or updates needed so the KPC output accurately reflects the script.

**Output your evaluation as a JSON object** with the following structure:
{{
  "KPC_Eval": {{
    "drawbacks": [/* Array of potential issues or shortcomings */],
    "benefits": [/* Array of strengths or positive findings */]
}}
}}
`);

const obsEvalPrompt = PromptTemplate.fromTemplate(`
OBS eval Prompt:
You have the following context to evaluate the script:
Script: {script}
The OBS (Brand Safety) output produced by the extraction layer of the script: {obsExtractionOutput}

Your task:
1. Check Brand Alignment: Does the language and style matches friendly, professional or edgy?
2. Identify Potential Red Flags: Note any jokes, slang, or references that could be misinterpreted as insensitive or off-brand?
3. Assess Content for Controversies or Sensitive Topics Scan for Inappropriate References: Look for references to political, religious, or other polarizing subjects that could spark backlash.
4. Inclusivity and Respect: Ensure the script does not use offensive or derogatory language.
5. Ensure the CTA is properly stated (e.g., “Sign up using the link in the description,” not “Download now,” if that’s against your sponsor’s guidelines).
6. Check whether the CTA appears at a suitable time in the script (often near the end or at a key point) and is not overly repeated or too salesy.
7. Provide a concise summary of any changes or improvements needed in the OBS output to ensure it fully addresses brand safety.
8. Assume general digital brand safety guidlines and evaluate the script.

**Output your evaluation as a JSON object** with the following structure:
{{
  "OBS_Eval": {{
    "drawbacks": [/* Array of potential issues or shortcomings */],
    "benefits": [/* Array of strengths or positive findings */]
}}
}}
Output:
`);


const ddcEvaluationChain = RunnableSequence.from([
  {
    script: (input) => input.script,
    guidelines: (input) => input.guidelines,
    ddcExtractionOutput: (input) => input.ddcExtractionOutput,
  },
  ddcEvalPrompt,
  model,
  new StringOutputParser(),
]);

const kpcEvaluationChain = RunnableSequence.from([
  {
    script: (input) => input.script,
    kpcExtractionOutput: (input) => input.kpcExtractionOutput,
  },
  kpcEvalPrompt,
  model,
  new StringOutputParser(),
]);

const obsEvaluationChain = RunnableSequence.from([
  {
    script: (input) => input.script,
    obsExtractionOutput: (input) => input.obsExtractionOutput,
  },
  obsEvalPrompt,
  model,
  new StringOutputParser(),
]);


const overallChainPrompt = PromptTemplate.fromTemplate(`
Overall Chain Prompt:

Generate an overall score in percentage for the evaluation result of the script based on the drawbacks and benefits from each evaluation. 
Consider the following:

Script: {script}

Key Points Coverage (KPC) Evaluation: {kpcEvalOutput}

Overall Brand Safety(OBS) Evaluation: {obsEvalOutput}

Do's and Don'ts Compliance(DDC) Evaluation: {ddcEvalOutput}

Score: {{/* Provide a numeric percentage score from 0% - 100% based on the combined feedback */}}

Please respond with a single JSON object in the following structure:
{{
  "Overall_Score": "..."
}}
`);


export async function runFullEvaluation(inputData) {
  const ddcExtraction = await ddcExtractionChain.invoke({
    script: inputData.script,
    guidelines: inputData.guidelines,
  });
  const kpcExtraction = await kpcExtractionChain.invoke({
    script: inputData.script,
  });
  const obsExtraction = await obsExtractionChain.invoke({
    script: inputData.script,
  });

  const ddcEval = await ddcEvaluationChain.invoke({
    script: inputData.script,
    guidelines: inputData.guidelines,
    ddcExtractionOutput: ddcExtraction,
  });
  const kpcEval = await kpcEvaluationChain.invoke({
    script: inputData.script,
    kpcExtractionOutput: kpcExtraction,
  });
  const obsEval = await obsEvaluationChain.invoke({
    script: inputData.script,
    obsExtractionOutput: obsExtraction,
  });

  // 3. Run the overall chain prompt for final scoring
  const overallChain = RunnableSequence.from([
    {
      script: (input) => input.script,
      ddcEvalOutput: (input) => input.ddcEval,
      kpcEvalOutput: (input) => input.kpcEval,
      obsEvalOutput: (input) => input.obsEval,
    },
    overallChainPrompt,
    model,
    new StringOutputParser(),
  ]);

  const finalResult = await overallChain.invoke({
    script: inputData.script,
    ddcEval,
    kpcEval,
    obsEval,
  });

  // 4. Return or log the final JSON result
  return {ddc: ddcExtraction, kpc: kpcExtraction, obs: obsExtraction,Result: finalResult};
}



