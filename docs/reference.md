Here is the complete, compiled bibliography of clinical guidelines, health authorities, and peer-reviewed pediatric literature used across Materna—from the **52-Week Baby Milestones & Physical Growth** to the **Recommended Wake Windows & Sleep Architecture**.

---

### Part 1: Baby Milestones & Physical Growth Standards

Used in [`lib/data/babyMilestones52.ts`](file:///c:/Users/Claire%20Nicole%20Bay/OneDrive/Desktop/Materna/lib/data/babyMilestones52.ts) and [`components/postpartum/NewbornGrowthMilestones.tsx`](file:///c:/Users/Claire%20Nicole%20Bay/OneDrive/Desktop/Materna/components/postpartum/NewbornGrowthMilestones.tsx).

#### 1. World Health Organization (WHO) Child Growth Standards (0–24 Months)

- **Issuing Body:** World Health Organization (WHO) & Multicentre Growth Reference Study Group.
- **Standards Used:**
  - Sex-pooled 50th-percentile ($P_{50}$ median) non-linear velocity curve for length (`cm`/`in`) and weight (`kg`/`lbs`) across Weeks 1–52.
  - Z-score distribution parameters for infant percentile calculations ($5^{\text{th}}$ to $99^{\text{th}}$ percentile).
- **Official Primary Links:**
  - **WHO Child Growth Standards Overview:** [https://www.who.int/tools/child-growth-standards](https://www.who.int/tools/child-growth-standards)
  - **Weight-for-Age Data Tables (Weeks 0–13 & Months 0–24):** [https://www.who.int/tools/child-growth-standards/standards/weight-for-age](https://www.who.int/tools/child-growth-standards/standards/weight-for-age)
  - **Length-for-Age Data Tables (Weeks 0–13 & Months 0–24):** [https://www.who.int/tools/child-growth-standards/standards/length-height-for-age](https://www.who.int/tools/child-growth-standards/standards/length-height-for-age)

#### 2. CDC & American Academy of Pediatrics (AAP) Milestone Surveillance Revision

- **Issuing Body:** Centers for Disease Control and Prevention (CDC) National Center on Birth Defects and Developmental Disabilities & AAP.
- **Standards Used:**
  - Sequencing of all 52 weekly milestones across 4 domains (Motor, Cognitive, Language, Social).
  - Enforces the $\ge 75\%$ population attainment criterion (replacing obsolete 50% benchmarks).
- **Clinical Publication & Primary Links:**
  - **Peer-Reviewed Article:** Zubler, J. M., et al. (2022). _Evidence-Informed Milestones for Developmental Surveillance Tools._ **Pediatrics**, 149(3), e2021052138. [https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748/](https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748/)
  - **CDC "Learn the Signs. Act Early." Milestones:** [https://www.cdc.gov/ncbddd/actearly/milestones/index.html](https://www.cdc.gov/ncbddd/actearly/milestones/index.html)
  - **AAP HealthyChildren.org Ages & Stages:** [https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx](https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx)

#### 3. CDC Clinical Adoption of WHO Standards in the United States

- **Issuing Body:** Centers for Disease Control and Prevention (CDC) & American Academy of Pediatrics (AAP).
- **Application:** Clinical protocol mandating that all infants aged 0 to 24 months be measured against WHO international standards rather than national CDC 2000 charts.
- **Official Link:**
  - **CDC WHO Growth Charts:** [https://www.cdc.gov/growthcharts/who-charts.htm](https://www.cdc.gov/growthcharts/who-charts.htm)

---

### Part 2: Recommended Wake Windows & Sleep Architecture

Used in [`lib/utils.ts`](file:///c:/Users/Claire%20Nicole%20Bay/OneDrive/Desktop/Materna/lib/utils.ts#L98-L111) (`recommendedWakeWindowMins`) and [`components/postpartum/NextNapPredictor.tsx`](file:///c:/Users/Claire%20Nicole%20Bay/OneDrive/Desktop/Materna/components/postpartum/NextNapPredictor.tsx).

#### 4. The Two-Process Model of Sleep Regulation (Homeostatic Sleep Pressure)

- **Original Clinical Framework:** Borbély, A. A. (1982). _A two process model of sleep regulation._ **Human Neurobiology**, 1(3), 195–204.
- **Application in Materna:**
  - Explains **Process S (Homeostatic Sleep Drive)**: the rate at which extracellular adenosine accumulates in the infant basal forebrain.
  - Explains why a newborn's brain tolerates only ~45–60 minutes of awake time before requiring neurochemical clearance, expanding to 120+ minutes by Month 6.
- **Reference & Review:**
  - Borbély, A. A., et al. (2016). _The two-process model of sleep regulation: a reappraisal._ **Journal of Sleep Research**, 25(2), 131–143. [https://onlinelibrary.wiley.com/doi/10.1111/jsr.12371](https://onlinelibrary.wiley.com/doi/10.1111/jsr.12371)

#### 5. National Sleep Foundation (NSF) Sleep Duration Consensus Recommendations

- **Issuing Body:** National Sleep Foundation (Consensus Panel of Pediatricians, Neurologists, and Sleep Specialists).
- **Standards Used:** Baseline total daily sleep durations (14–17 hours for newborns, 12–15 hours for infants) and daytime nap consolidation intervals across the first year.
- **Clinical Publication & Primary Link:**
  - Hirshkowitz, M., et al. (2015). _National Sleep Foundation’s sleep time duration recommendations: methodology and results summary._ **Sleep Health**, 1(1), 40–43. [https://www.sleephealthjournal.org/article/S2352-7218(15)00015-7/fulltext](<https://www.sleephealthjournal.org/article/S2352-7218(15)00015-7/fulltext>)
  - **NSF Infant Sleep Guidelines:** [https://www.thensf.org/how-much-sleep-do-we-really-need/](https://www.thensf.org/how-much-sleep-do-we-really-need/)

#### 6. American Academy of Pediatrics (AAP) Safe Sleep & Infant Sleep Maturation

- **Issuing Body:** American Academy of Pediatrics Task Force on Sudden Infant Death Syndrome.
- **Standards Used:**
  - Understanding the 4-month transition from primitive neonatal sleep cycles to consolidated 4-stage non-REM/REM cycles.
  - Identification of subtle early sleepy cues (gaze aversion, red eyebrows, eye rubbing) to prevent cortisol hyperarousal.
- **Clinical Policy & Guidance Links:**
  - **AAP Clinical Practice Guideline (2022):** Moon, R. Y., et al. _Sleep-Related Infant Deaths: Updated 2022 Recommendations._ **Pediatrics**, 150(1), e2022057990. [https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/](https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/)
  - **HealthyChildren.org Sleep Guidance:** [https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx](https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx)

#### 7. Pediatric Endocrinology of Overtiredness (HPA Axis & Cortisol)

- **Scientific Foundations:**
  - Explains how exceeding the optimal wake window triggers the **Hypothalamic-Pituitary-Adrenal (HPA) axis**, flooding the bloodstream with cortisol and catecholamines (adrenaline).
  - Accounts for the paradox where an overtired baby resists settling down and experiences fragmented, shorter naps.
- **Peer-Reviewed Reference:**
  - Gunnar, M. R., & Donzella, B. (2002). _Social regulation of the cortisol levels in early human development._ **Psychoneuroendocrinology**, 27(1-2), 199–220. [https://doi.org/10.1016/S0306-4530(01)00045-2](<https://doi.org/10.1016/S0306-4530(01)00045-2>)
  - Mindell, J. A., et al. (2015). _Sleep patterns and sleep disruptions in infants (0–11 months)._ **Sleep Medicine**, 16(11), 1317–1324. [https://doi.org/10.1016/j.sleep.2015.07.020](https://doi.org/10.1016/j.sleep.2015.07.020)
