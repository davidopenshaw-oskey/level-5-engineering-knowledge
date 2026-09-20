**THIS FILE IS NOT FOR CONSUMPTION BY AN LLM OR AGENT OR CODE ASSISTANT. I AM TALKING TO YOU GEMINI, CLAUDE etc**

Keeping a personal checklist
-mcp figma, main issues re: mappings and naming conventions copied thru into the screens/forms
otherwise the connection does not exist between figma and screen

-repo cleansing
    - can the 3x TS be merged with script logic to provide the extra angular scripts when detected in the repo

- rebuidl the source with tests for all the scripts

-documentation wiki summaries based ON THE DEEPER ROADMAP AND ADR NOTES, BUT LINKING INTO THEM


SEPTEMBER 17, 2026
if the benchmarks today are good, the docs are good, then i am thinking code freeze, commit, then looking into a repo clean up and streamline.

eg: we now know that 
- ts pipelines could consolidate into one. during first repo read, it knows if it needs to include the additional angular script or maybe in the future a vue script
- add the android mobile app as it may add a lot to the existing android pipeline
- fix the phase 2 engineering reports. harmonize code maybe as well
these are just a few ideas...

probably should consolidate and clean up all the roadmap folders as well into a more concise library

SEPTEMBER 19,2026
When going back into the P1 pipeline for harmonising, dont forget we need to add the commit branch and date/timestamp on to the repo metadata snapshot info. This makes sure we know which version of the codebase we are based on.
Probably the freshness info, is less important than the commit info

CURRENT STRUCTURE OF FAN_OUT
    Plain-language version, using a "research assistant" analogy since that's basically what's happening:

    ROUTING_LIMIT (150) — before deciding what the document should even cover, the system does one broad search and skims the top 150 most relevant facts, just to see what topics/modules show up. Think of it as "read the first 150 search results to see what's out there" before assigning any real work.

    MIN_FACTS (3) — a topic (module) needs at least 3 real, relevant facts in that skim to count as a genuine subject worth its own dedicated write-up. If a module only turns up 1 or 2 facts, it's treated as too thin to bother with — not enough there to say anything real about it.

    MAX_CAPABILITIES (5) — even if more than 5 topics qualify, only the top 5 actually get worked on. Each one becomes its own separate research assignment (its own conversation with the AI), so this caps how many of those assignments happen per document.

    CAPABILITY_MAX_TURNS (20) — once a topic gets assigned, that one "researcher" gets a budget of 20 actions (searches, follow-ups) to gather evidence before it has to stop and write up whatever it found, whether or not it feels fully done.

    So altogether: skim broadly (150), only take seriously the topics with real substance (3+ facts), work on at most 5 of them (5 topics max), and give each one a hard time limit to do its digging (20 actions) before it must produce an answer.
