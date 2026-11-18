export interface RecoveryCheckpoint {
  title: string;
  status: string;
  desc: string;
}

export interface RecoveryExercise {
  id: string;
  name: string;
  duration: string;
  benefit: string;
  reps: string;
}

export interface FoodItem {
  name: string;
  note: string;
}

export interface NutritionGroup {
  category: string;
  accent: string;
  foods: FoodItem[];
}

export interface MaternalRecoveryPhase {
  stageNumber: 1 | 2 | 3 | 4;
  stageName: string;
  weekRangeLabel: string;
  weekMin: number;
  weekMax: number;
  tagline: string;
  pelvicFloorStage: string;
  recoveryStageLabel: string;
  checkpoints: RecoveryCheckpoint[];
  exercises: RecoveryExercise[];
  nutrition: NutritionGroup[];
}

export const MATERNAL_RECOVERY_PHASES: MaternalRecoveryPhase[] = [
  // Stage 1: Acute Healing & Down-Regulation (Weeks 1 - 3)
  {
    stageNumber: 1,
    stageName: 'Acute Healing & Down-Regulation',
    weekRangeLabel: 'Weeks 1–3',
    weekMin: 1,
    weekMax: 3,
    tagline: 'Horizontal rest, peri-care, fluid rebalancing, and gentle nervous system down-regulation.',
    pelvicFloorStage: 'Pelvic Rest & Gentle Connection',
    recoveryStageLabel: 'Early Fourth Trimester',
    checkpoints: [
      {
        title: 'Uterine Involution',
        status: 'Active Descent',
        desc: 'The uterus contracts downward from the navel toward the pelvis; mild afterpains during breastfeeding are normal oxytocin contractions.',
      },
      {
        title: 'Lochia Progression',
        status: 'Rubra → Serosa Transition',
        desc: 'Flow transitions from bright red (rubra) to pinkish-brown (serosa) as the placental detachment site vascularizes and heals.',
      },
      {
        title: 'Perineal / Incision Closure',
        status: 'Acute Epithelialization',
        desc: 'Superficial skin and mucosal layers close. Prioritize peri-bottle warm rinses, ice packs, and lying flat to relieve pelvic congestion.',
      },
    ],
    exercises: [
      {
        id: 's1-ex-1',
        name: '360° Diaphragmatic Ribcage Breathing',
        duration: '3m',
        benefit: 'Gently expands lower ribcage and relaxes the pelvic floor on inhale without downward pressure.',
        reps: '8 to 10 slow breaths',
      },
      {
        id: 's1-ex-2',
        name: 'Passive Pelvic Floor Release',
        duration: '4m',
        benefit: 'Focuses entirely on lengthening and releasing hypertonic pelvic muscles rather than contracting.',
        reps: '5 relaxation cycles',
      },
      {
        id: 's1-ex-3',
        name: 'Supine Ankle Pumps & Gentle Heel Slides',
        duration: '3m',
        benefit: 'Stimulates calf muscle venous pumps to prevent edema, blood pooling, and deep vein thrombosis.',
        reps: '15 ankle pumps per leg',
      },
      {
        id: 's1-ex-4',
        name: 'Seated Neck & Upper Trapezius Rolls',
        duration: '4m',
        benefit: 'Releases severe neck and collarbone tightness caused by forward-curled newborn nursing positions.',
        reps: '6 gentle roll cycles',
      },
    ],
    nutrition: [
      {
        category: 'Tissue Repair & Collagen Synthesis',
        accent: 'bg-[#F9EFF6] border-[#ECDDEC] text-[#9E4875]',
        foods: [
          {
            name: 'Slow-Simmered Bone Broth & Collagen',
            note: 'Provides proline, glycine, and amino acids to accelerate perineal and C-section fascial healing.',
          },
          {
            name: 'Warm Stewed Chicken & Turmeric Congee',
            note: 'Easily digestible warm starches that spare metabolic energy while stabilizing digestion.',
          },
          {
            name: 'Citrus Slices & Dark Berries',
            note: 'Vitamin C co-factors essential for cross-linking new collagen fibers in repaired tissues.',
          },
        ],
      },
      {
        category: 'Iron & Maternal Blood Replenishment',
        accent: 'bg-[#FFF3EC] border-[#FCE2D6] text-[#A65431]',
        foods: [
          {
            name: 'Lentils & Slow-Cooked Grass-Fed Beef',
            note: 'Bioavailable heme and non-heme iron to rebuild red blood cells lost during labor.',
          },
          {
            name: 'Warm Rolled Oats & Black Sesame',
            note: 'Sustained zinc and magnesium to support early colostrum and transition milk establishment.',
          },
          {
            name: 'Steamed Spinach with Ghee',
            note: 'Vitamin K and healthy dietary lipids supporting coagulation and cellular membrane recovery.',
          },
        ],
      },
    ],
  },

  // Stage 2: Gentle Tissue Remodeling (Weeks 4 - 7)
  {
    stageNumber: 2,
    stageName: 'Gentle Tissue Remodeling',
    weekRangeLabel: 'Weeks 4–7',
    weekMin: 4,
    weekMax: 7,
    tagline: 'Supporting ligamentous stabilization, initial core reactivation, and mature milk production.',
    pelvicFloorStage: 'Pelvic Floor Lift & Relax Coordination',
    recoveryStageLabel: 'Tissue Remodeling Phase',
    checkpoints: [
      {
        title: 'Uterine Involution Completion',
        status: 'Pelvic True Baseline',
        desc: 'Uterus has fully descended behind the protective pubic bone and returned to its pre-pregnancy volume.',
      },
      {
        title: 'Lochia Cessation',
        status: 'Lochia Alba Nearing Resolution',
        desc: 'Discharge lightens to scant yellowish-white lochia alba before stopping completely around weeks 6–8.',
      },
      {
        title: 'Incision & Pelvic Remodeling',
        status: 'Initial Collagen Cross-Linking',
        desc: 'Perineal scars and C-section incisions gain 50%+ tensile strength; safe for gentle scar desensitization.',
      },
    ],
    exercises: [
      {
        id: 's2-ex-1',
        name: 'Transverse Abdominis ("Hug the Baby") Activations',
        duration: '4m',
        benefit: 'Re-establishes neuromuscular connection to deep transverse abs without doming the linea alba.',
        reps: '2 sets of 10 breaths',
      },
      {
        id: 's2-ex-2',
        name: 'Pelvic Floor Coordinated Lift & Release (Kegels)',
        duration: '4m',
        benefit: 'Ascending lift coordinated strictly on the exhale, with a full, unhurried release on the inhale.',
        reps: '3 sets of 8 reps',
      },
      {
        id: 's2-ex-3',
        name: 'Side-Lying Clamshells with Neutral Pelvis',
        duration: '5m',
        benefit: 'Awakens the gluteus medius to stabilize the sacroiliac (SI) joint against lingering relaxin.',
        reps: '10 reps per side',
      },
      {
        id: 's2-ex-4',
        name: 'Seated Cat-Cow & Thoracic Extension',
        duration: '4m',
        benefit: 'Opens mid-thoracic spinal curvature compressed from constant baby-carrying and nursing.',
        reps: '8 gentle cycles',
      },
    ],
    nutrition: [
      {
        category: 'Galactagogues & Mature Milk Supply',
        accent: 'bg-[#F9EFF6] border-[#ECDDEC] text-[#9E4875]',
        foods: [
          {
            name: 'Steel-Cut Oats with Ground Flaxseed',
            note: 'Rich in beta-glucans and plant lignans that support optimal prolactin receptor sensitivity.',
          },
          {
            name: 'Brewer’s Yeast & Chia Seed Pudding',
            note: 'High in B vitamins and bioavailable trace minerals depleted by continuous nursing demands.',
          },
          {
            name: 'Fennel & Fenugreek Infusion (Optional)',
            note: 'Gentle traditional digestive herbs that comfort maternal bloating and support milk letdowns.',
          },
        ],
      },
      {
        category: 'Fatty Acid Transport & Infant Brain Support',
        accent: 'bg-[#FFF3EC] border-[#FCE2D6] text-[#A65431]',
        foods: [
          {
            name: 'Wild-Caught Salmon & Sardines',
            note: 'Concentrated DHA and EPA omega-3s directly enriching breast milk for infant neurological growth.',
          },
          {
            name: 'Avocado & Raw Pumpkin Seeds',
            note: 'Monounsaturated fatty acids and dietary zinc supporting maternal endocrine synthesis.',
          },
          {
            name: 'Walnuts & Cold-Pressed Extra Virgin Olive Oil',
            note: 'Antioxidant polyphenols protecting cell membranes from cumulative postpartum oxidative stress.',
          },
        ],
      },
    ],
  },

  // Stage 3: Core & Pelvic Reintegration (Weeks 8 - 16)
  {
    stageNumber: 3,
    stageName: 'Core & Pelvic Reintegration',
    weekRangeLabel: 'Weeks 8–16',
    weekMin: 8,
    weekMax: 16,
    tagline: 'Rebuilding diastasis recti tension, functional lifting strength, and maternal metabolic stamina.',
    pelvicFloorStage: 'Deep Core & Diastasis Recti Conditioning',
    recoveryStageLabel: 'Strength & Mobility Phase',
    checkpoints: [
      {
        title: 'Linea Alba & Diastasis Recti Tension',
        status: 'Fascial Recoil Restoration',
        desc: 'Focus shifts from gap width to deep fascial tension; the midline wall should firm upon activation without bulging.',
      },
      {
        title: 'Endocrine & Thyroid Balance',
        status: 'Postpartum Hormone Stabilization',
        desc: 'Estrogen and progesterone gradually reset; monitor energy for signs of postpartum thyroid fluctuation.',
      },
      {
        title: 'C-Section / Perineal Scar Mobility',
        status: 'Fascial Mobilization Window',
        desc: 'Skin and underlying fascia are mature enough for gentle clockwise massage to prevent internal adhesions.',
      },
    ],
    exercises: [
      {
        id: 's3-ex-1',
        name: 'Supported Glute Bridges with Pelvic Floor Exhale',
        duration: '5m',
        benefit: 'Firms the posterior chain while training the pelvic floor to automatically stabilize under light hip extension.',
        reps: '2 sets of 10 to 12 reps',
      },
      {
        id: 's3-ex-2',
        name: 'Quadruped Bird-Dog Stability',
        duration: '5m',
        benefit: 'Cross-body slings activate anterior and posterior obliques without placing shear stress on the midline.',
        reps: '8 slow reps per side',
      },
      {
        id: 's3-ex-3',
        name: 'Supported Squats with Upward Exhale Breath',
        duration: '4m',
        benefit: 'Ingrains safe lifting mechanics for car seats, bassinet transfers, and stroller folding.',
        reps: '12 controlled reps',
      },
      {
        id: 's3-ex-4',
        name: 'Half-Kneeling Hip Flexor & Psoas Opener',
        duration: '4m',
        benefit: 'Counteracts prolonged sitting while feeding by restoring length to anterior hip flexors and lumbar spine.',
        reps: '45 seconds per side',
      },
    ],
    nutrition: [
      {
        category: 'Cognitive Stamina & "Mom Brain" Repair',
        accent: 'bg-[#F9EFF6] border-[#ECDDEC] text-[#9E4875]',
        foods: [
          {
            name: 'Pasture-Raised Eggs with Yolks',
            note: 'Highest dietary source of choline, required for acetylcholine synthesis and maternal memory retention.',
          },
          {
            name: 'Blueberries & Antioxidant Rich Greens',
            note: 'Flavonoids that cross the blood-brain barrier to combat sleep-deprivation neuroinflammation.',
          },
          {
            name: 'Dark Cocoa (75%+) & Pumpkin Seeds',
            note: 'Magnesium and theobromine supporting peripheral blood flow and evening nervous system calming.',
          },
        ],
      },
      {
        category: 'Adrenal & Thyroid Nutrient Support',
        accent: 'bg-[#FFF3EC] border-[#FCE2D6] text-[#A65431]',
        foods: [
          {
            name: 'Roasted Sweet Potatoes & Quinoa',
            note: 'Complex slow-burn carbohydrates preventing hypoglycemia and postpartum cortisol spikes.',
          },
          {
            name: 'Brazil Nuts (1–2 Daily) & Sea Veggies',
            note: 'Natural selenium and iodine critical for thyroid T4 to T3 conversion during fourth-trimester fatigue.',
          },
          {
            name: 'Electrolyte Mineral Waters & Coconut Water',
            note: 'Potassium, sodium, and magnesium repletion offsetting fluid depletion from milk production.',
          },
        ],
      },
    ],
  },

  // Stage 4: Functional Stamina & Lifelong Vitality (Weeks 17 - 52+)
  {
    stageNumber: 4,
    stageName: 'Functional Stamina & Vitality',
    weekRangeLabel: 'Weeks 17–52+',
    weekMin: 17,
    weekMax: 52,
    tagline: 'Endurance for active infant mobility, anti-fatigue functional movement, and cellular remineralization.',
    pelvicFloorStage: 'Core & Functional Stamina',
    recoveryStageLabel: 'Graduation & Ongoing Vitality',
    checkpoints: [
      {
        title: 'Uterine & Pelvic Organ Baseline',
        status: 'Restored Dynamic Baseline',
        desc: 'Bladder and uterine support are solid during dynamic loading; pelvic floor reflexes activate automatically during sneezes or steps.',
      },
      {
        title: 'Hormonal & Cycle Rhythm',
        status: 'Lactation / Ovulatory Equilibrium',
        desc: 'Prolactin patterns stabilize as baby begins complementary solids; postpartum menstrual cycles may gently resume.',
      },
      {
        title: 'Scar & Fascia Dynamic Integrity',
        status: 'Resilient Tissue Remodeling',
        desc: 'Healed scar tissue withstands multi-planar shear forces and functional trunk rotation without pulling or numbness.',
      },
    ],
    exercises: [
      {
        id: 's4-ex-1',
        name: 'Offset Stroller / Single-Arm Farmer’s Carries',
        duration: '5m',
        benefit: 'Builds anti-lateral trunk flexion strength, protecting the lower spine when carrying a heavier baby on one hip.',
        reps: '3 walks of 45 seconds each side',
      },
      {
        id: 's4-ex-2',
        name: 'Single-Leg Romanian Deadlift (Unweighted)',
        duration: '5m',
        benefit: 'Restores unilateral hamstring, glute, and pelvic stability as relaxin levels fully dissipate.',
        reps: '8 to 10 reps per leg',
      },
      {
        id: 's4-ex-3',
        name: 'Standing Resistance Band Rows',
        duration: '4m',
        benefit: 'Strengthens rhomboids and posterior deltoids to counteract forward nursing posture and baby rocking slouch.',
        reps: '2 sets of 12 reps',
      },
      {
        id: 's4-ex-4',
        name: 'Child’s Pose with Lateral Lat & Flank Stretch',
        duration: '4m',
        benefit: 'Deeply releases quadratus lumborum and side waist tightness from prolonged toddler holding.',
        reps: '5 deep breaths per side',
      },
    ],
    nutrition: [
      {
        category: 'Cellular Remineralization & Anti-Fatigue',
        accent: 'bg-[#F9EFF6] border-[#ECDDEC] text-[#9E4875]',
        foods: [
          {
            name: 'Slow-Cooked Bone Broth & Sea Salt',
            note: 'Restores trace minerals and intracellular hydration drained through extended months of lactation.',
          },
          {
            name: 'Sprouted Chickpeas & Tahini',
            note: 'Bioavailable calcium and plant-based protein supporting sustained skeletal bone mineral density.',
          },
          {
            name: 'Fermented Kimchi, Kefir, & Yogurt',
            note: 'Diverse probiotic colonies repairing the maternal gut microbiome after birth interventions.',
          },
        ],
      },
      {
        category: 'Sustained Energy & Hormonal Equilibrium',
        accent: 'bg-[#FFF3EC] border-[#FCE2D6] text-[#A65431]',
        foods: [
          {
            name: 'Grass-Fed Ghee & Cold-Pressed Olive Oil',
            note: 'Short- and medium-chain fatty acids fueling steady energy without triggering glucose instability.',
          },
          {
            name: 'Warm Adaptogenic Ashwagandha / Golden Milk',
            note: 'Nourishing evening tonic that moderates evening cortisol spikes and deepens sleep architecture.',
          },
          {
            name: 'Steamed Cruciferous Greens with Lemon',
            note: 'Sulforaphane and DIM aiding gentle phase-2 liver detox of metabolized pregnancy estrogen.',
          },
        ],
      },
    ],
  },
];

/**
 * Returns the active recovery phase based on the baby's postpartum week.
 */
export function getMaternalRecoveryPhase(weeksPostpartum: number): MaternalRecoveryPhase {
  const wk = Math.max(1, weeksPostpartum || 1);
  if (wk <= 3) return MATERNAL_RECOVERY_PHASES[0];
  if (wk <= 7) return MATERNAL_RECOVERY_PHASES[1];
  if (wk <= 16) return MATERNAL_RECOVERY_PHASES[2];
  return MATERNAL_RECOVERY_PHASES[3];
}
