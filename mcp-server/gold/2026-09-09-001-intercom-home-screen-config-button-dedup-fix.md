# Agent PRD — intercom-home-screen-config-button-dedup-fix

## MetaData

**Status:** Test run — atomic-prd-agent proof of concept<br>
**Persona:** `atomic-prd-agent` (governance/roadmap/mcp-direction/atomic-prd-agent-skills.md)<br>
**Model:** gemini-3.5-flash (Vertex AI, test-ai-oskey-io/global)<br>
**Snapshot freshness:** evidence below reflects:<br>
• <a id="cite-repo-1"></a>android-intercom-oskey-io @ 2026-09-09 ([R1](#repo-1))<br>
• <a id="cite-repo-2"></a>angular-app-oskey-io @ 2026-09-02 ([R2](#repo-2))<br>
• <a id="cite-repo-3"></a>firebase-oskey-dev @ 2026-09-02 ([R3](#repo-3))<br>
• <a id="cite-repo-4"></a>node-iot-api-oskey-io @ 2026-09-02 ([R4](#repo-4))<br>
**Tool calls made:** search_facts: 10, walk_cluster: 3, get_graph_neighbors: 1<br>
**Turns used:** 15 of 100<br>
**Run duration:** 4m 56s<br>
**Token usage:** 42,202 input, 1,044 output, 62,912 thinking, 34,705 cached (106,158 total)<br>
**Approx. document cost:** <a id="cite-cost"></a>[$0.5921](#cost-detail)

---

## Business Request

On the Intercom, we would like to add a new button(s) on the home page. This button would be linked to an item in the Call Directory.

An example could be for Concierge, or maybe the building has a Dentist etc, so the button would also have a label.

When the person in front of the Intercom presses this button, it would automatically call the recipient in the call directory.

The scope of this PRD is only to cover how the Intercom could read from a config file if it has to add a new button onto the home screen.

The trigger would be when the intercom reads its config file.

Outside of the scope of the PRD is how the PM in the PGO would add the button(s) and assign them to the Intercom configuration, and then parse the config to firebase, node-iot, mongoDB and the edge device.

---

## User Stories

- As a Visitor, I want press a custom button on the intercom home screen, so that instantly call a specific recipient in the call directory, such as Concierge or Dentist, without searching through the directory manually.

- As a Intercom Device, I want read custom home screen buttons from its configuration file upon startup or update, so that dynamically render the correct labels and link them to their respective call directory recipients.

---

## Technical Proposal

- <a id="cite-1"></a><a id="cite-2"></a>The intercom application reads its custom configuration from a local file, which is parsed into the OSKCustomConfiguration model.<br>(see [#1](#evidence-1), [#2](#evidence-2))

- <a id="cite-3"></a><a id="cite-4"></a>The OSKConfigurationData utility class maintains a static list of homeButtons that are populated during device initialization.<br>(see [#3](#evidence-3), [#4](#evidence-4))

- <a id="cite-5"></a><a id="cite-6"></a>The home screen UI (OSKHomeScreen) uses Compose components to render elements based on the loaded configuration data.<br>(see [#5](#evidence-5), [#6](#evidence-6))

---

## Acceptance Criteria

- [ ] The intercom device successfully parses the `homeButtons` field from the custom configuration file during the `getDeviceInfos` initialization flow.

- [ ] The home screen dynamically renders the custom buttons with their configured labels.

- [ ] Pressing a custom home button triggers a call to the recipient linked in the call directory.

- [ ] If the configuration file does not contain any custom home buttons, the home screen displays the default layout without errors.

---

## Constraints

- <a id="cite-7"></a><a id="cite-8"></a>The custom configuration file must be loaded and parsed safely via FileInputStream and cached in the application context.<br>(see [#7](#evidence-7), [#8](#evidence-8))

- <a id="cite-9"></a>The configuration file path is defined by the CUSTOM_CONFIGURATION_FILE constant in OSKConfigurationData.<br>(see [#9](#evidence-9))

---

## Evidence Used

### Repos

- <a id="repo-1"></a>[**R1**](#cite-repo-1) `android-intercom-oskey-io@a15cce18bf4a4f63f9a61a168c3af09b37f98ba3` (extracted 2026-09-09) [↩](#cite-repo-1)
- <a id="repo-2"></a>[**R2**](#cite-repo-2) `angular-app-oskey-io@8345d222a7f9879282de7b0a49f63f4771bdc1b2` (extracted 2026-09-02) [↩](#cite-repo-2)
- <a id="repo-3"></a>[**R3**](#cite-repo-3) `firebase-oskey-dev@00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3` (extracted 2026-09-02) [↩](#cite-repo-3)
- <a id="repo-4"></a>[**R4**](#cite-repo-4) `node-iot-api-oskey-io@a6cba122c0dcc02b75c3d26a39e10f2407d22144` (extracted 2026-09-02) [↩](#cite-repo-4)

### Fact-Ids

- <a id="evidence-1"></a>[**#1**](#cite-1) `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|homeButtons|OSKCustomConfiguration|#1` [↩](#cite-1)
- <a id="evidence-2"></a>[**#2**](#cite-2) `function_declaration|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|customConfiguration|OSKApplication|#1` [↩](#cite-2)
- <a id="evidence-3"></a>[**#3**](#cite-3) `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|homeButtons|OSKConfigurationData|#1` [↩](#cite-3)
- <a id="evidence-4"></a>[**#4**](#cite-4) `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|OSKConfigurationData.homeButtons.addAll|getDeviceInfos|OSKMainActivityViewModel|#1` [↩](#cite-4)
- <a id="evidence-5"></a>[**#5**](#cite-5) `source_file|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt` [↩](#cite-5)
- <a id="evidence-6"></a>[**#6**](#cite-6) `function_declaration|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|HomeElements|#1` [↩](#cite-6)
- <a id="evidence-7"></a>[**#7**](#cite-7) `call_expression|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|FileInputStream|customConfiguration|OSKApplication|#1` [↩](#cite-7)
- <a id="evidence-8"></a>[**#8**](#cite-8) `model_property|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|cachedCustomConfiguration|OSKApplication|#1` [↩](#cite-8)
- <a id="evidence-9"></a>[**#9**](#cite-9) `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|CUSTOM_CONFIGURATION_FILE|OSKConfigurationData|#1` [↩](#cite-9)

### Audit Trail

157 fact(s) gathered but not cited in this document — click a repo to expand:

<details>
<summary>android-intercom-oskey-io (137)</summary>

<sub>

- <a id="evidence-14"></a>**#14** `kotlin_object|app|app/src/main/java/io/oskey/intercom/navigation/OSKIntercomScreens.kt|Home|#1`

- <a id="evidence-15"></a>**#15** `call_expression|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|File|customConfiguration|OSKApplication|#2`

- <a id="evidence-17"></a>**#17** `call_expression|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|File|customConfiguration|OSKApplication|#1`

- <a id="evidence-18"></a>**#18** `source_class|app|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt|HomeScreen|#1`

- <a id="evidence-19"></a>**#19** `kotlin_object|app|app/src/main/java/io/oskey/intercom/ui/widgets/OSKNavigationBar.kt|Home|#1`

- <a id="evidence-20"></a>**#20** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Button|OSKHomeScreen|none|#1`

- <a id="evidence-24"></a>**#24** `source_file|app|app/src/main/java/io/oskey/intercom/core/repository/OSKConfigurationRepository.kt|app/src/main/java/io/oskey/intercom/core/repository/OSKConfigurationRepository.kt`

- <a id="evidence-26"></a>**#26** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|io.oskey.intercom.utils.OSKConfigurationData.Companion.homeButtons|#1`

- <a id="evidence-29"></a>**#29** `source_file|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt`

- <a id="evidence-32"></a>**#32** `source_class|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|OSKCustomConfiguration|#1`

- <a id="evidence-33"></a>**#33** `source_file|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt`

- <a id="evidence-34"></a>**#34** `source_class|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|OSKConfigurationData|#1`

- <a id="evidence-35"></a>**#35** `source_class|app|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt|OSKConfiguration|#1`

- <a id="evidence-36"></a>**#36** `source_file|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt`

- <a id="evidence-37"></a>**#37** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|customConfig|OSKMainActivityViewModel|#1`

- <a id="evidence-38"></a>**#38** `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|displaySettings|OSKConfigurationData|#1`

- <a id="evidence-39"></a>**#39** `model_property|app|app/src/main/java/io/oskey/intercom/data/OSKDataStore.kt|DEVICE_CONFIGURATION|OSKDataStore|#1`

- <a id="evidence-40"></a>**#40** `source_class|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|CustomInfo|#1`

- <a id="evidence-41"></a>**#41** `model_property|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|customConfigurationFile|OSKApplication|#1`

- <a id="evidence-42"></a>**#42** `source_class|kotlin-webrtc-domain-oskey-io|kotlin-webrtc-domain-oskey-io/src/main/java/io/oskey/webrtc_domain/OSKConfigurationData.kt|OSKConfigurationData|#1`

- <a id="evidence-43"></a>**#43** `source_file|app|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt`

- <a id="evidence-44"></a>**#44** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/settings/OSKSettingsScreen.kt|io.oskey.intercom.utils.OSKConfigurationData|#1`

- <a id="evidence-45"></a>**#45** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|dataStore|OSKConfigurationViewModel|#1`

- <a id="evidence-46"></a>**#46** `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|DEFAULT_LANGUAGE|OSKConfigurationData|#1`

- <a id="evidence-47"></a>**#47** `imports_dependency|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|io.oskey.intercom.utils.OSKConfigurationData.Companion.CUSTOM_CONFIGURATION_FILE|#1`

- <a id="evidence-48"></a>**#48** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|io.oskey.intercom.utils.OSKConfigurationData|#1`

- <a id="evidence-49"></a>**#49** `call_expression|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|synchronized|customConfiguration|OSKApplication|#1`

- <a id="evidence-50"></a>**#50** `imports_dependency|app|app/src/main/java/io/oskey/intercom/data/OSKDataStore.kt|io.oskey.intercom.model.OSKConfiguration|#1`

- <a id="evidence-52"></a>**#52** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 43.dp, start = 15.dp, end = 15.dp),
        horizontalArrangement = Arrangement.Center
    )|HomeElements|none|#1`

- <a id="evidence-53"></a>**#53** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|androidx.compose.material3.Button|#1`

- <a id="evidence-54"></a>**#54** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|ButtonDefaults.buttonColors|OSKHomeScreen|none|#1`

- <a id="evidence-55"></a>**#55** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|homeButtons.contains|OSKGetCurrentLocation|none|#2`

- <a id="evidence-56"></a>**#56** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|homeButtons.contains|OSKGetCurrentLocation|none|#1`

- <a id="evidence-57"></a>**#57** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Row(
        modifier = Modifier
            .fillMaxWidth(),
        horizontalArrangement = Arrangement.Center
    )|HomeElements|none|#1`

- <a id="evidence-58"></a>**#58** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Row|HomeElements|none|#3`

- <a id="evidence-59"></a>**#59** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|homeButtons.contains|OSKGetCurrentLocation|none|#3`

- <a id="evidence-60"></a>**#60** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/settings/OSKSettingsScreen.kt|Button(
                modifier = Modifier
                    .weight(1f)
                    .defaultMinSize(1.dp, 60.dp),
                onClick = {
                    navController.navigate(route = BottomNavItem.Home.route)
                })|OSKSettingsScreen|none|#1`

- <a id="evidence-61"></a>**#61** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 36.dp, bottom = 36.dp),
        horizontalArrangement = Arrangement.Center
    )|HomeElements|none|#1`

- <a id="evidence-62"></a>**#62** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|androidx.compose.material3.ButtonDefaults|#1`

- <a id="evidence-63"></a>**#63** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Modifier.size|HomeElements|none|#1`

- <a id="evidence-64"></a>**#64** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Row|HomeElements|none|#2`

- <a id="evidence-65"></a>**#65** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|configurationViewModel.updateData|HomeElements|none|#1`

- <a id="evidence-66"></a>**#66** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|homeButtons.isNotEmpty|OSKGetCurrentLocation|none|#1`

- <a id="evidence-67"></a>**#67** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|Row|HomeElements|none|#1`

- <a id="evidence-68"></a>**#68** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|remember|HomeElements|none|#1`

- <a id="evidence-69"></a>**#69** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|stringResource|HomeElements|none|#1`

- <a id="evidence-70"></a>**#70** `function_declaration|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-71"></a>**#71** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|viewModelScope.launch|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-72"></a>**#72** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|viewModelScope.launch(Dispatchers.IO + exceptionHandler)|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-73"></a>**#73** `function_declaration|app|app/src/main/java/io/oskey/intercom/ui/screens/benchmark/OSKBaseBenchmarkViewModel.kt|getDeviceInfos|OSKBaseBenchmarkViewModel|#1`

- <a id="evidence-74"></a>**#74** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|context.getSystemService|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-75"></a>**#75** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|getDeviceInfos|anon|OSKMainActivityViewModel|#1`

- <a id="evidence-76"></a>**#76** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|customConfiguration|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-77"></a>**#77** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#6`

- <a id="evidence-78"></a>**#78** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|customConfig?.let|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-79"></a>**#79** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#8`

- <a id="evidence-80"></a>**#80** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#3`

- <a id="evidence-81"></a>**#81** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#4`

- <a id="evidence-82"></a>**#82** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-83"></a>**#83** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#6`

- <a id="evidence-84"></a>**#84** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#2`

- <a id="evidence-85"></a>**#85** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#4`

- <a id="evidence-86"></a>**#86** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#8`

- <a id="evidence-87"></a>**#87** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).d|getDeviceInfos|OSKMainActivityViewModel|#7`

- <a id="evidence-88"></a>**#88** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-89"></a>**#89** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#7`

- <a id="evidence-90"></a>**#90** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#10`

- <a id="evidence-91"></a>**#91** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag|getDeviceInfos|OSKMainActivityViewModel|#2`

- <a id="evidence-92"></a>**#92** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|Timber.tag(TAG).e|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-93"></a>**#93** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|dataStore.getDeviceUUId()?.let|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-94"></a>**#94** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|OSKDataStore|getDeviceInfos|OSKMainActivityViewModel|#1`

- <a id="evidence-95"></a>**#95** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|io.oskey.intercom.OSKApplication.Companion.customConfiguration|#1`

- <a id="evidence-96"></a>**#96** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/benchmark/OSKBaseBenchmarkViewModel.kt|customConfig|OSKBaseBenchmarkViewModel|#1`

- <a id="evidence-97"></a>**#97** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|OSKConfigurationViewModel|#1`

- <a id="evidence-98"></a>**#98** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|configurationViewModel|#1`

- <a id="evidence-99"></a>**#99** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivity.kt|customConfiguration(this)?.let|onCreate|OSKMainActivity|#1`

- <a id="evidence-100"></a>**#100** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKMainViewModel.kt|OSKMainViewModel|#1`

- <a id="evidence-101"></a>**#101** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivity.kt|customConfiguration|onCreate|OSKMainActivity|#1`

- <a id="evidence-102"></a>**#102** `source_file|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt`

- <a id="evidence-103"></a>**#103** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|OSKMainActivityViewModel|#1`

- <a id="evidence-104"></a>**#104** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|io.oskey.intercom.OSKApplication.Companion.getDeviceConfiguration|#1`

- <a id="evidence-105"></a>**#105** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|spec|OSKMainActivityViewModel|#1`

- <a id="evidence-106"></a>**#106** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKAccessViewModel.kt|io.oskey.intercom.OSKApplication.Companion.customConfiguration|#1`

- <a id="evidence-107"></a>**#107** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|io.oskey.intercom.ui.screens.OSKConfigurationViewModel|#1`

- <a id="evidence-108"></a>**#108** `imports_dependency|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|androidx.lifecycle.ViewModel|#1`

- <a id="evidence-109"></a>**#109** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|TAG|OSKMainActivityViewModel|#1`

- <a id="evidence-110"></a>**#110** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivity.kt|mainActivityViewModel|OSKMainActivity|#1`

- <a id="evidence-111"></a>**#111** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|activityRequest|OSKMainActivityViewModel|#1`

- <a id="evidence-112"></a>**#112** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|TAG|OSKMainActivityViewModel|#2`

- <a id="evidence-113"></a>**#113** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/benchmark/OSKBaseBenchmarkViewModel.kt|config|OSKBaseBenchmarkViewModel|#1`

- <a id="evidence-114"></a>**#114** `imports_dependency|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|io.oskey.intercom.model.OSKCustomConfiguration|#1`

- <a id="evidence-115"></a>**#115** `function_declaration|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|getConfiguration|OSKConfigurationViewModel|#1`

- <a id="evidence-116"></a>**#116** `source_class|app|app/src/main/java/io/oskey/intercom/core/repository/OSKConfigurationRepository.kt|OSKConfigurationRepositoryImpl|#1`

- <a id="evidence-117"></a>**#117** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|infosData|CustomInfo|#1`

- <a id="evidence-118"></a>**#118** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|local|CustomInfo|#1`

- <a id="evidence-119"></a>**#119** `call_expression|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|listOf|anon|CustomInfo|#1`

- <a id="evidence-120"></a>**#120** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|homeInfos|OSKCustomConfiguration|#1`

- <a id="evidence-121"></a>**#121** `model_property|app|app/src/main/java/io/oskey/intercom/ui/view/OSKSliderLayout.kt|infoData|#1`

- <a id="evidence-122"></a>**#122** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt|infosData|Message|#1`

- <a id="evidence-125"></a>**#125** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/benchmark/OSKBaseBenchmarkViewModel.kt|packageInfo|#1`

- <a id="evidence-126"></a>**#126** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|imei1|OSKCustomConfiguration|#1`

- <a id="evidence-128"></a>**#128** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/benchmark/OSKBaseBenchmarkViewModel.kt|customConfig?.let|getDeviceInfos|OSKBaseBenchmarkViewModel|#1`

- <a id="evidence-130"></a>**#130** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/benchmark/OSKBaseBenchmarkViewModel.kt|customConfiguration|getDeviceInfos|OSKBaseBenchmarkViewModel|#1`

- <a id="evidence-133"></a>**#133** `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|DEVICE_CONFIGURATION_FILE|OSKConfigurationData|#1`

- <a id="evidence-134"></a>**#134** `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|LAUNCHER_PACKAGE_NAME|OSKConfigurationData|#1`

- <a id="evidence-135"></a>**#135** `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|backgroundImage|OSKConfigurationData|#1`

- <a id="evidence-136"></a>**#136** `model_property|app|app/src/main/java/io/oskey/intercom/utils/OSKConfigurationData.kt|isJwtNeedValidated|OSKConfigurationData|#1`

- <a id="evidence-137"></a>**#137** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt|homeScreen|OSKConfiguration|#1`

- <a id="evidence-138"></a>**#138** `model_property|app|app/src/main/java/io/oskey/intercom/model/OSKCustomConfiguration.kt|isNeedScreenSaver|OSKCustomConfiguration|#1`

- <a id="evidence-139"></a>**#139** `model_property|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|deviceConfigurationFile|OSKApplication|#2`

- <a id="evidence-140"></a>**#140** `source_class|app|app/src/main/java/io/oskey/intercom/model/OSKDeviceConfiguration.kt|OSKDeviceConfiguration|#1`

- <a id="evidence-141"></a>**#141** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|modificationDate|OSKConfigurationViewModel|#1`

- <a id="evidence-142"></a>**#142** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|uiState|OSKConfigurationViewModel|#1`

- <a id="evidence-143"></a>**#143** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKMainActivityViewModel.kt|data|OSKMainActivityViewModel|#1`

- <a id="evidence-144"></a>**#144** `source_class|app|app/src/main/java/io/oskey/intercom/model/OSKConfiguration.kt|HomeMessage|#1`

- <a id="evidence-145"></a>**#145** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|HomeMessage|#1`

- <a id="evidence-146"></a>**#146** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|State|#1`

- <a id="evidence-147"></a>**#147** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|Message|#1`

- <a id="evidence-148"></a>**#148** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|selected|#1`

- <a id="evidence-149"></a>**#149** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|homeMessage|OSKConfigurationViewModel|#1`

- <a id="evidence-150"></a>**#150** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|madeInFrance|#1`

- <a id="evidence-151"></a>**#151** `function_declaration|app|app/src/main/java/io/oskey/intercom/ui/screens/OSKConfigurationViewModel.kt|getLocalConfiguration|OSKConfigurationViewModel|#1`

- <a id="evidence-152"></a>**#152** `source_class|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|LanguageOption|#1`

- <a id="evidence-153"></a>**#153** `model_property|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKHomeScreen.kt|languageOption|#1`

- <a id="evidence-154"></a>**#154** `function_declaration|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|OSKHomeButtonNavigation|#1`

- <a id="evidence-155"></a>**#155** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Card(
        onClick = { navCallback.invoke() },
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(
            0.5.dp,
            Color("#BFBFBF".toColorInt()).copy(0.35f)
        ),
        colors = CardDefaults.cardColors(
            containerColor = Color("#1B1B1D".toColorInt())
        ),
        elevation = CardDefaults.cardElevation(500.dp),
        modifier = Modifier
            .width(152.dp)
            .height(152.dp)
    )|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-156"></a>**#156** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Modifier
            .width(152.dp)
            .height|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-157"></a>**#157** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Card|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-158"></a>**#158** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Image|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-159"></a>**#159** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Color|OSKHomeButtonNavigation|none|#2`

- <a id="evidence-160"></a>**#160** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Color|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-161"></a>**#161** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|painterResource|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-162"></a>**#162** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Modifier
                    .scale(1F)
                    .size|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-163"></a>**#163** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|"#1B1B1D".toColorInt|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-164"></a>**#164** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|navCallback.invoke|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-165"></a>**#165** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Text|OSKHomeButtonNavigation|none|#1`

- <a id="evidence-166"></a>**#166** `call_expression|app|app/src/main/java/io/oskey/intercom/ui/screens/main/OSKGetCurrentLocation.kt|Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        )|OSKHomeButtonNavigation|none|#1`

</sub>

</details>

<details>
<summary>angular-app-oskey-io (2)</summary>

<sub>

- <a id="evidence-127"></a>**#127** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/types/communication.model.ts|OSKLocalizedInfoBlock|infosData|#1`

- <a id="evidence-129"></a>**#129** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/message-center/types/communication.model.ts|OSKCreateIntercomCommunicationRequestData|homeInfo|#1`

</sub>

</details>

<details>
<summary>firebase-oskey-dev (15)</summary>

<sub>

- <a id="evidence-11"></a>**#11** `source_file|building|functions/src/modules/building/modules/building_intercom/index.ts|functions/src/modules/building/modules/building_intercom/index.ts`

- <a id="evidence-12"></a>**#12** `source_file|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts`

- <a id="evidence-13"></a>**#13** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService._updateDeviceConfigWithMessage|createIntercomCommunication|buildingId,doorId,{
                                        communicationId,
                                        homeInfos: translatedHomeInfos,
                                        schedule: scheduleFormated,
                                        priority,
                                    }|#1`

- <a id="evidence-16"></a>**#16** `imports_dependency|call|functions/src/modules/call/services/call.service.ts|@oskey/building/intercom|#1`

- <a id="evidence-21"></a>**#21** `type_alias|building|functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts|OSKCallSettingsMode|#1`

- <a id="evidence-22"></a>**#22** `external_hook|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|intercomId|#1`

- <a id="evidence-23"></a>**#23** `model_property|organization|functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts|OSKIntercomCommunicationConfig|homeInfos|#1`

- <a id="evidence-25"></a>**#25** `imports_dependency|building|functions/src/modules/building/index.ts|@oskey/building/intercom|#1`

- <a id="evidence-27"></a>**#27** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKAccessControlDeviceConfigController.default.save|deleteIntercomCommunication|newConfig|#1`

- <a id="evidence-28"></a>**#28** `controller_method|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController|create|#1`

- <a id="evidence-30"></a>**#30** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|allDoors.map|createIntercomCommunication|(door) => door.doorId|#1`

- <a id="evidence-31"></a>**#31** `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingDoorController.default.getSafe|createIntercomEntry|buildingId,doorId|#1`

- <a id="evidence-123"></a>**#123** `service_method|core|functions/src/modules/core/services/logging.service.ts|OSKLoggingService|logInfo|#1`

- <a id="evidence-131"></a>**#131** `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercom_allowUnitNumber.service.ts|OSKDbIntercomUnitNumberService.logger.logInfo|constructIntercomEntriesFields|`maintenance - - creating new entry for unit ${intercomEntry.unitId}`,{
                    intercomEntry,
                    newEntry,
                }|#1`

- <a id="evidence-132"></a>**#132** `model_property|organization|functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts|OSKCreateIntercomCommunicationRequestData|homeInfo|#1`

</sub>

</details>

<details>
<summary>node-iot-api-oskey-io (3)</summary>

<sub>

- <a id="evidence-10"></a>**#10** `source_file|access_control_device|src/v1/schema/access_control_device_intercom_entry.schema.ts|src/v1/schema/access_control_device_intercom_entry.schema.ts`

- <a id="evidence-51"></a>**#51** `type_alias|access_control_device|src/v1/models/access_control_device_config.model.ts|OSKContentData|#1`

- <a id="evidence-124"></a>**#124** `model_property|access_control_device|src/v1/models/access_control_device_config.model.ts|OSKLocalizedInfoBlock|infosData|#1`

</sub>

</details>

### Cost

<a id="cost-detail"></a>**$0.5921** — approx., this document's own Vertex AI token cost only, computed from real-time pricing (live Cloud Billing Catalog API lookup, prices effective as of 2026-09-09 07:00 UTC); excludes subscriptions, infra, and other real overhead. [↩](#cite-cost)
