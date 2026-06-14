"""
treatments.py — Disease treatment and prevention recommendations for TerraLeaf.

Each entry in TREATMENT_DB maps a disease class name (matching the labels in
class_indices.json) to a structured recommendation dictionary containing
severity, symptoms, treatment steps, and prevention advice.

The dictionary is intentionally comprehensive for common PlantVillage classes.
Add or extend entries as new crops / diseases are supported.
"""

from __future__ import annotations

from typing import TypedDict


class TreatmentInfo(TypedDict):
    """Type definition for a single disease treatment record."""

    severity: str
    symptoms: list[str]
    treatment: list[str]
    prevention: list[str]


# ---------------------------------------------------------------------------
# Default fallback — used when the predicted class is not in TREATMENT_DB.
# ---------------------------------------------------------------------------

DEFAULT_TREATMENT: TreatmentInfo = {
    "severity": "Unknown",
    "symptoms": [
        "Consult an agronomist for a precise symptom assessment.",
    ],
    "treatment": [
        "Isolate affected plants to prevent spread.",
        "Consult a local agricultural extension service for specific guidance.",
        "Apply a broad-spectrum fungicide or bactericide as a precaution.",
    ],
    "prevention": [
        "Maintain good garden hygiene — remove debris regularly.",
        "Ensure adequate plant spacing for airflow.",
        "Water at the base of plants; avoid wetting foliage.",
        "Inspect plants weekly for early signs of disease.",
    ],
}

# ---------------------------------------------------------------------------
# Disease treatment database — keyed by PlantVillage-style class names.
# ---------------------------------------------------------------------------

TREATMENT_DB: dict[str, TreatmentInfo] = {
    # ── Apple ─────────────────────────────────────────────────────────────────
    "Apple___Apple_scab": {
        "severity": "Moderate",
        "symptoms": [
            "Olive-green to brown velvety lesions on leaves",
            "Scabby, cracked spots on fruit surface",
            "Premature defoliation in severe cases",
            "Twisted or distorted young leaves",
        ],
        "treatment": [
            "Apply captan, mancozeb, or myclobutanil fungicide at 7–10-day intervals",
            "Remove and destroy fallen leaves to reduce overwintering inoculum",
            "Prune canopy to improve light penetration and air circulation",
            "Thin fruit clusters to reduce surface moisture retention",
        ],
        "prevention": [
            "Plant scab-resistant cultivars (e.g., Liberty, Enterprise, Redfree)",
            "Apply preventive fungicide sprays starting at green-tip stage",
            "Rake and compost (or burn) leaf litter each autumn",
            "Avoid overhead irrigation; use drip systems when possible",
        ],
    },
    "Apple___Black_rot": {
        "severity": "High",
        "symptoms": [
            "Circular, purple-bordered brown lesions on leaves (frog-eye spots)",
            "Mummified, black, shrivelled fruit remaining on the tree",
            "Cankers with reddish-brown margins on branches",
            "Black pycnidia (spore bodies) visible on dead tissue",
        ],
        "treatment": [
            "Remove and destroy infected fruit, branches, and mummified fruit",
            "Apply captan or thiophanate-methyl fungicide during growing season",
            "Prune cankers at least 15 cm below visible disease margin",
            "Disinfect pruning tools with 70% ethanol between cuts",
        ],
        "prevention": [
            "Keep the orchard free of dead wood and mummified fruit",
            "Maintain tree vigour through balanced fertilisation",
            "Apply dormant copper spray to reduce overwintering spores",
            "Choose resistant varieties where available",
        ],
    },
    "Apple___Cedar_apple_rust": {
        "severity": "Moderate",
        "symptoms": [
            "Bright orange-yellow spots on upper leaf surface",
            "Tube-like spore structures (aecia) on leaf undersides in summer",
            "Lesions on fruit causing deformation",
            "Premature defoliation weakening the tree",
        ],
        "treatment": [
            "Apply myclobutanil, propiconazole, or trifloxystrobin at pink stage",
            "Repeat applications every 7–10 days during wet weather",
            "Remove nearby Eastern red cedar or juniper hosts if feasible",
        ],
        "prevention": [
            "Plant rust-resistant apple cultivars",
            "Avoid planting apples near junipers or cedars",
            "Apply preventive fungicide starting at silver-tip bud stage",
            "Monitor local cedar gall emergence in spring as a spray trigger",
        ],
    },
    "Apple___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Continue regular scouting (weekly during growing season)",
            "Maintain balanced fertilisation and proper irrigation",
            "Keep pruning tools clean and sharp",
            "Remove fallen leaves and fruit to minimise disease pressure",
        ],
    },
    # ── Blueberry ─────────────────────────────────────────────────────────────
    "Blueberry___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Maintain soil pH between 4.5 and 5.5",
            "Mulch with pine bark or wood chips to retain moisture",
            "Scout for mummy berry and mites during blooming",
        ],
    },
    # ── Cherry ────────────────────────────────────────────────────────────────
    "Cherry_(including_sour)___Powdery_mildew": {
        "severity": "Moderate",
        "symptoms": [
            "White powdery fungal growth on young leaves and shoots",
            "Leaf curling and distortion, especially on new growth",
            "Premature defoliation in severe infections",
            "Reduced fruit set and quality",
        ],
        "treatment": [
            "Apply sulphur-based fungicide or potassium bicarbonate at first signs",
            "Use systemic fungicides (tebuconazole or myclobutanil) for severe infections",
            "Prune and destroy infected shoots",
            "Improve air circulation by thinning the canopy",
        ],
        "prevention": [
            "Choose mildew-resistant cherry varieties",
            "Avoid excessive nitrogen fertilisation which promotes soft, susceptible tissue",
            "Apply preventive sulphur sprays from bud break",
            "Ensure good light penetration and air circulation through annual pruning",
        ],
    },
    "Cherry_(including_sour)___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Apply dormant oil spray in late winter to control scale insects",
            "Scout for brown rot during bloom and wet periods",
            "Remove and destroy any mummified fruit after harvest",
        ],
    },
    # ── Corn / Maize ──────────────────────────────────────────────────────────
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "severity": "High",
        "symptoms": [
            "Rectangular, tan to grey lesions limited by leaf veins",
            "Lesions elongate parallel to veins over time",
            "Severe blighting of leaves reducing photosynthetic area",
            "Premature senescence of lower leaves",
        ],
        "treatment": [
            "Apply strobilurin or triazole fungicide (e.g., azoxystrobin, propiconazole) at tasselling",
            "Destroy crop residue by deep tillage or rapid decomposition",
            "Avoid continuous maize monoculture",
        ],
        "prevention": [
            "Plant resistant hybrids — consult seed supplier ratings",
            "Rotate with non-host crops (soybean, wheat) for at least one season",
            "Reduce plant density to improve airflow",
            "Time planting to avoid prolonged warm, humid periods during grain fill",
        ],
    },
    "Corn_(maize)___Common_rust_": {
        "severity": "Moderate",
        "symptoms": [
            "Circular to elongated brick-red pustules on both leaf surfaces",
            "Pustules rupture releasing powdery brown spores",
            "Severe infections cause premature leaf death",
            "Yield losses highest when infection occurs before silking",
        ],
        "treatment": [
            "Apply triazole or strobilurin fungicide if rust appears before tasselling",
            "Early fungicide application (before significant pustule development) is most effective",
        ],
        "prevention": [
            "Grow rust-resistant hybrids (most modern commercial hybrids have moderate resistance)",
            "Avoid late planting that prolongs exposure during cool, moist nights",
            "Monitor fields from V6 growth stage onwards",
        ],
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "severity": "High",
        "symptoms": [
            "Large, elongated grey-green to tan cigar-shaped lesions (5–15 cm long)",
            "Lesions appear first on lower leaves then spread upward",
            "Severe blighting can kill entire leaves",
            "Dark greenish-grey spore masses on lesion surface in humid weather",
        ],
        "treatment": [
            "Apply triazole or strobilurin fungicide at first sign of disease, particularly before tasselling",
            "Remove severely infected crop residue after harvest",
        ],
        "prevention": [
            "Plant resistant hybrids (Ht gene resistance confers protection against race 0)",
            "Rotate crops; avoid planting maize after maize",
            "Till to bury infected residue and speed decomposition",
            "Monitor weather: risk increases with warm days (18–27 °C) and wet nights",
        ],
    },
    "Corn_(maize)___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Scout fields weekly from V6 through grain fill",
            "Maintain soil fertility per soil test recommendations",
            "Use certified, treated seed for next season",
        ],
    },
    # ── Grape ─────────────────────────────────────────────────────────────────
    "Grape___Black_rot": {
        "severity": "High",
        "symptoms": [
            "Small tan or brown circular lesions with dark borders on leaves",
            "Black, shrivelled mummified berries (raisins) that persist on the cluster",
            "Lesions on shoots, tendrils, and leaf petioles",
            "Infected berries rot rapidly in warm, wet weather",
        ],
        "treatment": [
            "Apply mancozeb, captan, or myclobutanil fungicide from bud break through veraison",
            "Remove and destroy all mummified berries and infected shoot tissue",
            "Maintain open canopy through shoot thinning and leaf removal",
        ],
        "prevention": [
            "Remove all mummified fruit and diseased canes during dormant pruning",
            "Apply first fungicide spray at 2–4 cm shoot growth",
            "Choose disease-resistant varieties (e.g., Concord, Catawba)",
            "Train vines to promote air circulation and rapid drying after rain",
        ],
    },
    "Grape___Esca_(Black_Measles)": {
        "severity": "High",
        "symptoms": [
            "Interveinal chlorosis and necrosis creating a 'tiger stripe' pattern on leaves",
            "Dark brown streaking in cross-section of older wood",
            "Sudden wilting of entire shoots or canes (apoplexy)",
            "Berries show dark, sunken spots giving a 'measles' appearance",
        ],
        "treatment": [
            "No fully curative chemical treatment is available",
            "Remove and burn severely infected vines",
            "Prune infected wood well below visible staining; seal large wounds",
            "Apply wound protectants (Trichoderma-based products) immediately after pruning",
        ],
        "prevention": [
            "Avoid large pruning wounds; prune during dry weather",
            "Apply wound protectant paste (thiophanate-methyl or Trichoderma) to all cuts",
            "Use clean, disinfected pruning tools",
            "Maintain vine vigour through balanced nutrition and irrigation",
        ],
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "severity": "Moderate",
        "symptoms": [
            "Angular, dark brown to black lesions on leaf margins",
            "Lesions may coalesce to cover large leaf areas",
            "Premature defoliation weakening vines",
            "Lesions on berries causing shrivelling",
        ],
        "treatment": [
            "Apply copper-based fungicides or mancozeb at 10–14-day intervals",
            "Remove and destroy fallen infected leaves",
            "Improve canopy management to increase airflow",
        ],
        "prevention": [
            "Apply preventive copper sprays from bud break in disease-prone areas",
            "Maintain open canopy architecture",
            "Avoid overhead irrigation; use drip irrigation",
            "Monitor weather forecasts — warm, wet conditions favour disease",
        ],
    },
    "Grape___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — vine appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Conduct dormant pruning to maintain open canopy structure",
            "Scout for mildew and botrytis from bud break onwards",
            "Maintain balanced soil fertility; excess nitrogen increases disease susceptibility",
        ],
    },
    # ── Orange ────────────────────────────────────────────────────────────────
    "Orange___Haunglongbing_(Citrus_greening)": {
        "severity": "Critical",
        "symptoms": [
            "Asymmetric blotchy mottling of leaves (not following veins)",
            "Yellow shoot (huanglongbing) — entire shoots turn yellow",
            "Small, lopsided, bitter fruit with aborted seeds",
            "Premature fruit drop and progressive tree decline",
        ],
        "treatment": [
            "No cure currently exists — infected trees should be removed and destroyed",
            "Control Asian citrus psyllid vector with imidacloprid or spirotetramat",
            "Nutritional sprays (zinc, manganese, micronutrients) may temporarily improve symptoms",
            "Report suspected HLB to local plant health authorities immediately",
        ],
        "prevention": [
            "Use certified HLB-free nursery stock",
            "Apply systemic insecticides to control the psyllid vector",
            "Inspect all new planting material carefully",
            "Establish monitoring traps for Asian citrus psyllid (Diaphorina citri)",
        ],
    },
    # ── Peach ─────────────────────────────────────────────────────────────────
    "Peach___Bacterial_spot": {
        "severity": "Moderate",
        "symptoms": [
            "Small, water-soaked lesions turning purple-brown on leaves",
            "Lesions fall out creating a 'shot-hole' appearance",
            "Sunken, dark, crater-like spots on fruit",
            "Cankers on twigs causing dieback",
        ],
        "treatment": [
            "Apply copper-based bactericide preventively from petal fall",
            "Apply oxytetracycline sprays during bloom for severe pressure",
            "Prune and destroy infected twigs and cankers during dormancy",
        ],
        "prevention": [
            "Plant resistant cultivars (e.g., Contender, Reliance)",
            "Avoid sites with poor air drainage",
            "Minimise wounding during harvest and cultural operations",
            "Apply copper sprays at leaf fall in autumn to reduce inoculum",
        ],
    },
    "Peach___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Apply dormant copper spray to reduce brown rot and leaf curl pressure",
            "Thin fruit to improve airflow and reduce brown rot incidence",
            "Scout for oriental fruit moth and peach twig borer regularly",
        ],
    },
    # ── Bell Pepper ───────────────────────────────────────────────────────────
    "Pepper,_bell___Bacterial_spot": {
        "severity": "Moderate",
        "symptoms": [
            "Small, water-soaked spots on leaves becoming yellow-green then necrotic",
            "Raised, scabby lesions on fruit surface",
            "Defoliation of lower leaves in severe infections",
            "Wilt of young seedlings (damping-off) in high inoculum nurseries",
        ],
        "treatment": [
            "Apply copper bactericide + mancozeb tank mix at first symptom appearance",
            "Remove and destroy heavily infected plant material",
            "Avoid working in the field when foliage is wet",
        ],
        "prevention": [
            "Use certified pathogen-free or hot-water-treated seed",
            "Rotate peppers away from solanaceous crops for 2–3 years",
            "Apply copper sprays preventively during warm, wet weather",
            "Avoid overhead irrigation; use drip systems",
        ],
    },
    "Pepper,_bell___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Scout for aphids and whitefly — both vector viral diseases",
            "Maintain balanced fertilisation; excess nitrogen promotes soft tissue",
            "Use reflective mulch to repel aphid vectors",
        ],
    },
    # ── Potato ────────────────────────────────────────────────────────────────
    "Potato___Early_blight": {
        "severity": "Moderate",
        "symptoms": [
            "Dark brown circular lesions with concentric rings (target-board pattern)",
            "Yellow chlorotic halo surrounding lesions",
            "Lower, older leaves affected first",
            "Premature defoliation reducing yield",
        ],
        "treatment": [
            "Apply chlorothalonil, mancozeb, or azoxystrobin fungicide at 7–10-day intervals",
            "Remove and destroy heavily infected leaves",
            "Avoid overhead irrigation; if used, irrigate early morning so foliage dries quickly",
        ],
        "prevention": [
            "Use certified disease-free seed potatoes",
            "Rotate potatoes with non-solanaceous crops for 2–3 years",
            "Maintain adequate potassium and calcium nutrition",
            "Hill up soil around stems to protect tubers and improve drainage",
        ],
    },
    "Potato___Late_blight": {
        "severity": "Critical",
        "symptoms": [
            "Water-soaked, pale green to brown lesions on leaves",
            "White cottony sporulation on lesion undersides in humid conditions",
            "Rapid collapse and blackening of entire foliage",
            "Brown, granular rot extending into tuber flesh",
        ],
        "treatment": [
            "Apply protectant fungicide (mancozeb, chlorothalonil) preventively before symptoms",
            "Switch to systemic fungicide (cymoxanil, metalaxyl, dimethomorph) once disease appears",
            "Destroy infected haulm (vines) before harvest to protect tubers",
            "Do not harvest tubers until 2 weeks after haulm destruction",
        ],
        "prevention": [
            "Use certified blight-free seed; inspect tubers for rot before planting",
            "Plant resistant varieties (e.g., Sarpo Mira, Defender)",
            "Monitor blight forecasting services (e.g., BlightWatch) and spray preventively",
            "Avoid excessively dense planting; maintain airflow",
        ],
    },
    "Potato___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Monitor for Colorado potato beetle — a major vector entry point",
            "Scout for early blight symptoms from mid-season onward",
            "Ensure proper hilling to prevent greening and tuber exposure",
        ],
    },
    # ── Raspberry ─────────────────────────────────────────────────────────────
    "Raspberry___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Prune and remove old fruited canes after harvest",
            "Scout for cane blight and botrytis fruit rot",
            "Maintain open row structure for airflow",
        ],
    },
    # ── Soybean ───────────────────────────────────────────────────────────────
    "Soybean___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Monitor for soybean rust, sudden death syndrome, and SCN",
            "Use seed treatments containing fungicide and insecticide",
            "Rotate with non-legume crops to manage SCN populations",
        ],
    },
    # ── Squash ────────────────────────────────────────────────────────────────
    "Squash___Powdery_mildew": {
        "severity": "Moderate",
        "symptoms": [
            "White, powdery fungal growth on upper leaf surfaces",
            "Infected leaves turn yellow and eventually brown",
            "Reduced photosynthesis and premature senescence",
            "Stems and petioles may also be affected",
        ],
        "treatment": [
            "Apply sulphur, potassium bicarbonate, or neem oil at first sign of infection",
            "Use systemic fungicide (myclobutanil, trifloxystrobin) for heavy infections",
            "Remove and destroy heavily infected leaves",
        ],
        "prevention": [
            "Plant resistant varieties where available",
            "Avoid excessive nitrogen fertilisation",
            "Space plants adequately for good air circulation",
            "Water at the base; avoid wetting foliage",
        ],
    },
    # ── Strawberry ────────────────────────────────────────────────────────────
    "Strawberry___Leaf_scorch": {
        "severity": "Moderate",
        "symptoms": [
            "Small, dark purple or red circular spots on leaves",
            "Spots enlarge; centres become tan or grey",
            "Severely infected leaves appear scorched",
            "Plant vigour and fruit yield decline in heavy infections",
        ],
        "treatment": [
            "Apply captan or thiram fungicide at first sign of disease",
            "Remove and destroy heavily infected leaves and old plant debris",
            "Renovate severely affected beds after harvest",
        ],
        "prevention": [
            "Use certified disease-free transplants",
            "Avoid overhead irrigation; use drip systems",
            "Remove old leaves during renovation to reduce inoculum",
            "Apply preventive fungicide sprays during periods of warm, wet weather",
        ],
    },
    "Strawberry___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Renovate matted-row beds after harvest by mowing and narrowing rows",
            "Scout for two-spotted spider mite and cyclamen mite regularly",
            "Apply straw mulch to reduce soil splash and fruit rot",
        ],
    },
    # ── Tomato ────────────────────────────────────────────────────────────────
    "Tomato___Bacterial_spot": {
        "severity": "Moderate",
        "symptoms": [
            "Small, water-soaked lesions on leaves turning brown with yellow margins",
            "Raised, scabby, irregular lesions on fruit",
            "Defoliation of lower leaves",
            "Wilt and collapse of young transplants in severe cases",
        ],
        "treatment": [
            "Apply copper hydroxide + mancozeb tank mix at 5–7-day intervals",
            "Remove and destroy infected plant material",
            "Avoid working in the garden during wet weather",
        ],
        "prevention": [
            "Use pathogen-free seed or seed treated with hot water (50 °C, 25 min)",
            "Rotate tomatoes away from solanaceous crops for 2–3 years",
            "Use drip irrigation; avoid overhead watering",
            "Disinfect cages, stakes, and tools between seasons",
        ],
    },
    "Tomato___Early_blight": {
        "severity": "Moderate",
        "symptoms": [
            "Brown circular lesions with concentric rings (target-board pattern) on older leaves",
            "Yellow chlorotic halo surrounding each lesion",
            "Lesions may also appear on stems and fruit (collar rot)",
            "Progressive defoliation from base upward",
        ],
        "treatment": [
            "Apply copper fungicide, chlorothalonil, or azoxystrobin at 7-day intervals",
            "Remove and destroy infected leaves promptly",
            "Mulch around plant base to reduce soil splash",
        ],
        "prevention": [
            "Rotate with non-solanaceous crops for 2–3 years",
            "Stake or cage plants to keep foliage off the ground",
            "Avoid overhead irrigation; if unavoidable, water in the morning",
            "Maintain adequate potassium and calcium through balanced fertilisation",
        ],
    },
    "Tomato___Late_blight": {
        "severity": "Critical",
        "symptoms": [
            "Large, irregular, pale green to brown lesions on leaves",
            "White cottony mould on lesion undersides in humid weather",
            "Rapid collapse and blackening of entire plant",
            "Brown, firm rot penetrating fruit surface",
        ],
        "treatment": [
            "Apply mancozeb or chlorothalonil protectant fungicide at first warning",
            "Switch to systemic fungicide (cymoxanil, dimethomorph, fluopicolide) once disease appears",
            "Remove and bag infected plant material; do not compost",
            "Destroy entire planting if infection is severe and harvest is near",
        ],
        "prevention": [
            "Plant late-blight-resistant varieties (e.g., Mountain Merit, Plum Regal, Jasper)",
            "Monitor regional blight alerts and apply preventive sprays ahead of rain",
            "Avoid planting near potato crops",
            "Ensure good plant spacing and staking for rapid foliage drying",
        ],
    },
    "Tomato___Leaf_Mold": {
        "severity": "Moderate",
        "symptoms": [
            "Pale yellow spots on upper leaf surface corresponding to olive-green mould below",
            "Velvet-like olive to brown fungal growth on leaf undersides",
            "Leaves yellow, curl, and drop in severe cases",
            "Fruit infection rare but possible near calyx",
        ],
        "treatment": [
            "Apply chlorothalonil, mancozeb, or copper fungicide at 7-day intervals",
            "Increase ventilation in greenhouses; reduce relative humidity below 85%",
            "Remove and destroy infected leaves",
        ],
        "prevention": [
            "Choose resistant tomato varieties (Cf-resistance genes)",
            "Maintain greenhouse humidity below 85% through adequate ventilation and heating",
            "Avoid dense planting; prune for airflow",
            "Rotate production houses or sterilise greenhouse structures between crops",
        ],
    },
    "Tomato___Septoria_leaf_spot": {
        "severity": "Moderate",
        "symptoms": [
            "Small, circular spots with dark brown borders and grey-white centres on lower leaves",
            "Tiny black specks (pycnidia) visible in lesion centres",
            "Rapid defoliation from the bottom upward",
            "Severely defoliated plants produce sunscalded fruit",
        ],
        "treatment": [
            "Apply chlorothalonil, mancozeb, or copper fungicide at 7-day intervals from first symptom",
            "Remove and destroy infected lower leaves",
            "Avoid working among plants when wet",
        ],
        "prevention": [
            "Rotate with non-solanaceous crops for 2 years",
            "Mulch soil surface to reduce splash dispersal",
            "Stake plants and remove suckers to open the canopy",
            "Use drip irrigation to keep foliage dry",
        ],
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "severity": "Moderate",
        "symptoms": [
            "Fine stippling or bronzing of leaf upper surface",
            "Fine silken webbing on leaf undersides and between leaves",
            "Leaves turn yellow, bronze, and eventually drop",
            "Severe infestations can defoliate entire plants rapidly in hot, dry weather",
        ],
        "treatment": [
            "Apply miticide (abamectin, spiromesifen, or bifenazate) — rotate modes of action",
            "Spray forcefully with water to dislodge mites from leaf undersides",
            "Release predatory mites (Phytoseiulus persimilis) for biological control",
            "Remove and destroy severely infested plant parts",
        ],
        "prevention": [
            "Maintain adequate soil moisture — drought stress promotes mite outbreaks",
            "Avoid broad-spectrum pesticide applications that kill natural predators",
            "Scout leaf undersides weekly in hot, dry conditions",
            "Introduce predatory mites preventively in greenhouse production",
        ],
    },
    "Tomato___Target_Spot": {
        "severity": "Moderate",
        "symptoms": [
            "Round to irregular tan lesions with concentric rings on leaves",
            "Dark brown border around lesions",
            "Fruit lesions: small, raised, dark spots with lighter centres",
            "Defoliation of lower leaves in advanced cases",
        ],
        "treatment": [
            "Apply azoxystrobin, chlorothalonil, or mancozeb at first symptom",
            "Remove infected lower leaves to slow upward progression",
            "Improve canopy airflow through staking and pruning",
        ],
        "prevention": [
            "Rotate with non-host crops for 2 years",
            "Avoid overhead irrigation",
            "Apply preventive fungicide during warm, wet weather",
            "Remove and destroy crop debris after season",
        ],
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "severity": "Critical",
        "symptoms": [
            "Upward curling and cupping of leaves, especially younger leaves",
            "Leaf yellowing (chlorosis) at margins",
            "Stunted plant growth and reduced internode length",
            "Flower drop and severely reduced fruit set",
        ],
        "treatment": [
            "No cure — remove and destroy infected plants immediately to prevent spread",
            "Control whitefly vector with imidacloprid, thiamethoxam, or spirotetramat",
            "Use yellow sticky traps to monitor and reduce whitefly populations",
            "Apply reflective mulch to deter whiteflies",
        ],
        "prevention": [
            "Plant TYLCV-resistant varieties (Ty-1, Ty-3 gene resistance)",
            "Use virus-free certified transplants from disease-free nurseries",
            "Install fine insect-proof mesh (50-mesh) in greenhouse openings",
            "Apply systemic insecticide drench at transplanting to protect seedlings",
        ],
    },
    "Tomato___Tomato_mosaic_virus": {
        "severity": "High",
        "symptoms": [
            "Light and dark green mosaic mottling pattern on leaves",
            "Leaf distortion, blistering, and fern-leaf malformation",
            "Stunted plant growth and reduced fruit production",
            "Fruit shows uneven ripening and internal browning",
        ],
        "treatment": [
            "No chemical cure — remove and destroy infected plants",
            "Disinfect tools and hands with 10% bleach solution between plants",
            "Control aphid vectors with insecticidal soap or pyrethrin sprays",
        ],
        "prevention": [
            "Use ToMV-resistant varieties (Tm-2a gene resistance)",
            "Wash hands thoroughly before handling plants",
            "Never smoke near tomato plants — tobacco can carry the virus",
            "Disinfect all tools and greenhouse structures between crops",
        ],
    },
    "Tomato___healthy": {
        "severity": "None",
        "symptoms": ["No disease symptoms detected — plant appears healthy."],
        "treatment": ["No treatment required at this time."],
        "prevention": [
            "Continue weekly scouting for early blight, late blight, and spider mites",
            "Maintain consistent watering to prevent blossom-end rot",
            "Side-dress with calcium nitrate to support fruit quality",
            "Stake or cage plants to keep foliage off the soil",
        ],
    },
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_treatment(disease_name: str) -> TreatmentInfo:
    """
    Return treatment information for *disease_name*.

    Lookup is first attempted with the exact key, then with common
    normalisation (replacing spaces with underscores, stripping surrounding
    whitespace).  Falls back to DEFAULT_TREATMENT if no match is found.

    Args:
        disease_name: Disease label as returned by the model (e.g. ``"Tomato___Early_blight"``).

    Returns:
        TreatmentInfo dictionary with severity, symptoms, treatment, and prevention.
    """
    # Exact match.
    if disease_name in TREATMENT_DB:
        return TREATMENT_DB[disease_name]

    # Normalised match (spaces → underscores, stripped).
    normalised = disease_name.strip().replace(" ", "_")
    if normalised in TREATMENT_DB:
        return TREATMENT_DB[normalised]

    # Partial / case-insensitive match — useful when model labels differ slightly.
    lower_name = normalised.lower()
    for key, value in TREATMENT_DB.items():
        if key.lower() == lower_name:
            return value

    # Return the default fallback.
    return DEFAULT_TREATMENT
