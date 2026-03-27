# From Precise Execution to Conversational Curation: Reshaping the AI Visual Workflow Through 18 Iterations

> Day 54 · 2026-03-25

To prepare for this weekend's Agent Evolution Hackathon, I needed to produce recruitment posters and video opening frames that perfectly match the Cyber-Taoist brand identity within an extremely tight timeframe. Facing the dual pressure of time constraints and stylistic consistency, I abandoned traditional paths like hiring a designer or using templates. Instead, I opted for real-time interactive generation using JS_Claw paired with ComfyUI, turning this "18-conversation dialogue with the lobster" into a practical validation of a new design paradigm.

## Reconstructing the Design Paradigm: From Mechanical Execution to Conversational Curation

In today's asset production, I deeply realized that the definition of design has shifted from "precise execution" to "conversational curation." Initially, I tried to reuse the prompts from an old character image (00184) for pure text-to-image generation. The result was a severe stylistic deviation with uncontrollable facial details. This exposed the unreliability of human memory for long-text parameters and the inherent ambiguity of natural language when describing visuals.

I quickly adjusted my strategy. Instead of chasing the "perfect one-shot prompt," I established a closed loop of "Visual Feedback → Linguistic Correction." After each generation, I observed the issues, precisely described the corrections in language, and moved to the next iteration. This strategy of a "Fixed Parameter Base + Layered Dialogue Iteration" allowed me to balance production efficiency with the Neo-Brutalism brand tone across 18 rapid trials, achieving a shift from mechanical execution to intelligent emergence.

## Tactics for Stylistic Consistency: Parameter Freezing and Layered Control

Stylistic consistency isn't accidental; it relies on strictly freezing complete parameters (seed, weights, negative prompts) and employing a tactic of layered, progressive detail control. I locked down the core parameters of the ComfyUI workflow `image_z_image_turbo.json`: the sampler was set to `res_multistep`, the scheduler to `simple`, CFG fixed at 1, and steps controlled at 9, ensuring a fast generation speed of about 4 seconds per image.

For specific facial adjustments, I strictly prohibited rough, one-step modifications. Instead, I followed a three-layer logic: "Remove Mask → Define Skin Tone → Refine Expression." First, I removed the goggles and mask to enhance approachability. Next, I specified `natural skin tone` to avoid the "jaundice" association that generic yellow might trigger. Finally, I fine-tuned the expression details. Meanwhile, by explicitly excluding negative prompts like `photorealistic, 3D render, soft shadows`, I successfully locked the style into a hard-edge Cel-shading comic aesthetic reminiscent of *Ghost in the Shell* and *Akira*.

## Implementing Visual Strategy: Precise Color Values and Brand Metaphor Archiving

The final visual strategy must be realized through precise color definitions and the embedding of brand metaphors to complete the acceptance process from "recordable" to "teachable." In color description, I completely abandoned the generic "yellow," directly using the precise hex value `#FCD228` to define "JS Yellow," thereby avoiding the model's associative bias towards generic terms.

In terms of brand narrative, I placed the JS Logo inside the energy core on the character's chest, rather than as a surface decoration. This metaphorically embodies the Cyber-Taoist concept that "energy lies within." After multiple iterations, I selected file `00217` as the main visual for the poster (composite score 4.5/5) and kept the other four character images with different hair color personality archetypes (00221-00224) as alternatives. All generated files were automatically archived by timestamp to the `D:\.openclaw\work_dir\comfyui_output\` directory, transforming a single generation experience into reusable systemic teaching assets.

## Today's Takeaways

- **Paradigm Shift**: The core of the AI generation workflow has shifted from "precise prompt control" to "conversational curation based on visual feedback"; the iteration process itself is part of the design.
- **Parameter Iron Law**: Stylistic consistency must rely on a complete archive of generation parameters (seed, negative prompts, sampler configuration). Missing any parameter leads to memory bias and style drift.
- **Layered Control**: Complex visual adjustments (such as facial inpainting) must be decomposed into progressive layers like "Remove Mask → Define Skin Tone → Refine Expression." Attempting to achieve this in one step via a single prompt is strictly prohibited.
- **Precise Expression**: Color descriptions must be precise down to hexadecimal values (e.g., #FCD228); generic color words are highly prone to ambiguity and deviation in AI generation.
- **Asset Archiving**: Establishing an automated timestamp archiving and main visual selection mechanism is the key closed loop for transforming scattered experimental data into teachable knowledge assets.
