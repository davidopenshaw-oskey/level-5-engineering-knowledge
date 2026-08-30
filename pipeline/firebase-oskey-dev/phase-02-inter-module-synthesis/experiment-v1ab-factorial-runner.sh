#!/bin/bash
# One-off driver for the V1-A/V1-B A/B/AB factorial experiment.
# See governance/roadmap/firebase-oskey-dev/06-v1-ab-factorial-experiment-plan.md
# for the design this executes -- worklist order is fixed and shuffled
# (seed 20260835) to avoid any two self-consistency runs of the same cell
# being issued back-to-back. Generated, not hand-written -- do not hand-edit
# the call order; regenerate from the plan doc's worklist if it needs to change.
set -e
cd "$(dirname "$0")/../../.."
TOTAL=63

echo '=== 1/63 cap-old-fix module=organization pack=organization_intercom_ communication run=0 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME='organization_intercom_ communication' LLM_CONFIG_KEY=gemini-default-v1ab-old-canonical COMPARISON_MODE=true CAPABILITY_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/00-capability-synthesis.OLD.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== copying the 18 already-old-contract canonical capability-syntheses into the old-canonical comparison namespace ==='
mkdir -p output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/tasks/capability-syntheses
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/tasks/capability-syntheses/_module_root.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/tasks/capability-syntheses/
mkdir -p output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/apps/capability-syntheses
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/apps/capability-syntheses/mail.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/apps/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/apps/capability-syntheses/notification.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/apps/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/apps/capability-syntheses/qr_code.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/apps/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/apps/capability-syntheses/sms.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/apps/capability-syntheses/
mkdir -p output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/_module_root.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_building.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_building_invitation.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_entity.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_inhabitant.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_onboarding_inhabitant.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_pending.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_prompt_templates.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_property.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_residents.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_user.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_user_access.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/
cp output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/knowledge-pipeline/modules/organization/capability-syntheses/organization_user_invitation.md output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/gemini-default-v1ab-old-canonical/organization/capability-syntheses/

echo '=== 2/63 cap-new module=organization pack=organization_intercom_ communication run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME='organization_intercom_ communication' LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 3/63 cap-new module=organization pack=organization_residents run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_residents LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 4/63 cap-new module=apps pack=sms run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=sms LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 5/63 cap-new module=organization pack=organization_user run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_user LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 6/63 cap-new module=organization pack=organization_prompt_templates run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_prompt_templates LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 7/63 cap-new module=organization pack=organization_user run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_user LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 8/63 cap-new module=apps pack=mail run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=mail LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 9/63 cap-new module=organization pack=organization_property run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_property LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 10/63 cap-new module=organization pack=organization_user_invitation run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_user_invitation LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 11/63 cap-new module=apps pack=mail run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=mail LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 12/63 cap-new module=apps pack=notification run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=notification LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 13/63 cap-new module=tasks pack=_module_root run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks CAPABILITY_NAME=_module_root LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 14/63 cap-new module=apps pack=qr_code run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=qr_code LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 15/63 cap-new module=organization pack=organization_prompt_templates run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_prompt_templates LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 16/63 cap-new module=organization pack=organization_entity run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_entity LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 17/63 cap-new module=organization pack=organization_building_invitation run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_building_invitation LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 18/63 cap-new module=organization pack=organization_building run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_building LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 19/63 cap-new module=apps pack=notification run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=notification LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 20/63 cap-new module=organization pack=organization_building_invitation run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_building_invitation LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 21/63 cap-new module=organization pack=organization_intercom_ communication run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME='organization_intercom_ communication' LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 22/63 cap-new module=organization pack=organization_user_access run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_user_access LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 23/63 cap-new module=apps pack=sms run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=sms LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 24/63 cap-new module=organization pack=organization_onboarding_inhabitant run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_onboarding_inhabitant LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 25/63 cap-new module=organization pack=organization_entity run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_entity LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 26/63 cap-new module=organization pack=organization_onboarding_inhabitant run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_onboarding_inhabitant LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 27/63 cap-new module=organization pack=organization_property run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_property LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 28/63 cap-new module=organization pack=_module_root run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=_module_root LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 29/63 cap-new module=organization pack=organization_inhabitant run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_inhabitant LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 30/63 cap-new module=organization pack=_module_root run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=_module_root LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 31/63 cap-new module=organization pack=organization_user_invitation run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_user_invitation LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 32/63 cap-new module=organization pack=organization_residents run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_residents LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 33/63 cap-new module=organization pack=organization_pending run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_pending LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 34/63 cap-new module=organization pack=organization_user_access run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_user_access LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 35/63 cap-new module=organization pack=organization_building run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_building LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 36/63 cap-new module=tasks pack=_module_root run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks CAPABILITY_NAME=_module_root LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 37/63 cap-new module=organization pack=organization_pending run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_pending LLM_CONFIG_KEY=gemini-default-v1ab-cap-run1 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 38/63 cap-new module=apps pack=qr_code run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps CAPABILITY_NAME=qr_code LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 39/63 cap-new module=organization pack=organization_inhabitant run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization CAPABILITY_NAME=organization_inhabitant LLM_CONFIG_KEY=gemini-default-v1ab-cap-run2 COMPARISON_MODE=true npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01d-regenerate-single-capability.ts

echo '=== 40/63 reduce module=organization arm=a run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-a-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 41/63 reduce module=tasks arm=current run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-current-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 42/63 reduce module=organization arm=b run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-b-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 43/63 reduce module=tasks arm=b run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-b-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 44/63 reduce module=apps arm=a run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-a-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 45/63 reduce module=organization arm=current run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-current-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 46/63 reduce module=tasks arm=ab run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-ab-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 47/63 reduce module=apps arm=b run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-b-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 48/63 reduce module=tasks arm=current run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-current-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 49/63 reduce module=organization arm=ab run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-ab-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 50/63 reduce module=apps arm=a run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-a-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 51/63 reduce module=organization arm=a run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-a-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 52/63 reduce module=apps arm=ab run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-ab-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 53/63 reduce module=tasks arm=b run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-b-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 54/63 reduce module=tasks arm=a run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-a-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 55/63 reduce module=apps arm=current run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-current-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 56/63 reduce module=organization arm=ab run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-ab-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 57/63 reduce module=tasks arm=ab run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-ab-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 58/63 reduce module=tasks arm=a run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=tasks LLM_CONFIG_KEY=gemini-default-v1ab-a-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 59/63 reduce module=apps arm=ab run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-ab-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-cap-run1 npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 60/63 reduce module=apps arm=current run=1 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-current-run1 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 61/63 reduce module=apps arm=b run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=apps LLM_CONFIG_KEY=gemini-default-v1ab-b-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 62/63 reduce module=organization arm=current run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-current-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical REDUCE_CONTRACT_PATHS_OVERRIDE=pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.OLD.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-instructions.md,pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/module-engineering-profile-task-template.md npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo '=== 63/63 reduce module=organization arm=b run=2 ==='
REPO_NAME=firebase-oskey-dev MODULE_NAME=organization LLM_CONFIG_KEY=gemini-default-v1ab-b-run2 COMPARISON_MODE=true CAPABILITY_SOURCE_CONFIG_KEY=gemini-default-v1ab-old-canonical npx tsx pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01c-generate-assembly-first-profile.ts

echo "=== V1-A/V1-B factorial experiment: all 63 calls completed ==="