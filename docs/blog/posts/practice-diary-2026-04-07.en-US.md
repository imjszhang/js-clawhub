# From Overfitting Traps to the "Human Touch" Final Review: Three Iterations of AI Writing Skills and the Human-Machine Boundary

> Day 67 · 2026-04-07

Today's core mission was to distill a reusable "AI Content Creation Iteration Loop" from Khazix's open-source writing methodology. The goal? To tackle the excessive "AI flavor" and style drift plaguing our system during scaled production. By deeply deconstructing his four-layer self-inspection framework, I've redefined the absolute boundaries of human-machine collaboration within the OpenClaw architecture.

## Building a High-Availability Writing Skill: The Three-Round Iteration Loop

When attempting to migrate Khazix's writing style to our Agent system, I initially made a classic mistake: trying to craft a single, perfect Prompt to generate ready-to-publish content immediately. Referencing `khazix-skill-open-source-methodology`, I realized that building a Skill must follow a time-series loop of "Feeding Representative Works - Human Rewriting - Difference Analysis."

In practice, I first fed the AI 2-3 representative articles and the methodology whitepaper to summarize an initial version of the Skill. Then, I had the AI draft an article. As expected, the first draft was nearly unusable for publication because "the style summarized by the AI is what *it* thinks the style is, creating a huge gap with the actual style." The critical turning point came in step three: I had to manually rewrite the article myself, even if just using the AI's skeleton as a reference. Finally, I fed both the AI version and my rewritten version back to the AI, asking it to analyze the differences and iteratively update the Skill.

I strictly controlled this cycle to 3-4 rounds. The source material explicitly warns that running 10-20 iterations leads to severe overfitting, which ironically limits the AI's divergent capabilities. Today's practice confirmed this: after the third round, style similarity reached 80%. Continuing to fine-tune yielded diminishing returns and increased risks.

## The Four-Layer Self-Inspection System and the "Human Touch" Final Review

To ensure consistent quality in continuous production, I introduced the four-layer self-inspection mechanism designed by Khazix (inspired by Anthropic's code quality assessment system) and mapped it to our content filtering gateway.

Levels L1 to L3 primarily handle rule-based tasks, making them ideal for delegation to AI for automatic scanning:
- **L1 Hard Rules**: Check for banned words, banned punctuation, and structural clichés. The principle is "if it appears, it's a problem."
- **L2 Style Consistency**: Verify if the content starts from a specific scenario, if sentence lengths alternate rhythmically, and if there are distinct paragraph breaks for effect.
- **L3 Content Quality**: Confirm that every viewpoint is supported by specific scenarios, that knowledge is presented with a conversational tone, and that specific events can be connected to larger cultural references.

However, the L4 level, the "Human Touch Final Review," is the red line I held most firmly today. This layer boils down to one core question: "After reading this, do you feel like a knowledgeable ordinary person is seriously chatting with you about something that moved them, or does it feel like an AI outputting information?" Any content that reads with a heavy "AI flavor" must be reworked, regardless of how high it scored in the first three layers. This final approval authority remains firmly in human hands, as it is the only defense line distinguishing "information output" from "genuine communication."

## Holding the Bottom Line: "Humans Set Direction, AI Fills the Flesh"

While sorting out the division of labor between humans and machines, I reaffirmed OpenClaw's core principle: Humans are responsible for setting the direction and judging the "human touch," while the AI handles execution and filling in the details.

Reviewing the creation process of the article *"Selling DeepSeek for 9.9 RMB on Taobao"* today, this division of labor was evident. At 1 AM, I finished the first half based on my personal experience. When I hit a writer's block for the second half, I asked the AI to generate several angles, but none were satisfactory. It wasn't until 2:30 AM, when I looked up at the bookshelf and spotted *Folding Beijing*, that a flash of inspiration struck: the core angle of "Three Layers of Space in Information Asymmetry." Once this framework, determined by a moment of human inspiration, was established, the AI could rapidly "fill the flesh" and expand upon the skeleton, completing the final draft by 3:30 AM.

This confirms the core insight from the source material: AI can greatly accelerate production *after* you've set the direction; but what AI cannot do is that "god-tier move" of looking up at the bookshelf at 2:30 AM. Real-world testing, documenting pitfalls in tutorials, making core value judgments, and genuine emotional reactions (like getting a lump in your nose when seeing a comment saying "No need to buy a membership anymore") must all be done by humans personally. AI can assist by finding 5 pros and 5 cons as ammunition or generating analogy candidates, but the direction of the shot and the final choice always belong to humans.

## Today's Takeaways

- **Avoid Overfitting in Skill Construction**: Calibrating a writing Skill only requires 3-4 rounds of the "Draft - Rewrite - Difference Analysis" loop. Exceeding this causes model overfitting, restricting its divergent creativity.
- **L4 Final Review Cannot Be Delegated**: A four-layer self-inspection system is essential. While L1-L3 can be automated, the L4 "Human Touch" (does it sound like a knowledgeable ordinary person chatting?) must be finally adjudicated by a human.
- **Absolute Boundaries of Human-Machine Division**: Humans exclusively own the "moment of inspiration" (like looking up at the bookshelf), "value judgments," and "genuine emotional expression." The AI is only responsible for finding evidence, generating analogies, and expanding content *after* the framework is set.
- **Expectation Management**: Never believe AI can directly produce 100% usable content. A 70-80% usability rate is already excellent performance; the remaining portion must rely on human intervention for polishing.
