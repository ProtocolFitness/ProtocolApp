import { SQLiteDatabase } from 'expo-sqlite';

export type ProtocolReferenceCategory = 'TRT' | 'Peptide' | 'Supplement';
export type ProtocolFrequencyType = 'daily' | 'weekly' | 'every_x_days';

export interface ProtocolReferenceEntry {
  slug: string;
  name: string;
  compound: string;
  category: ProtocolReferenceCategory;
  default_dosage: number;
  unit: string;
  frequency_type: ProtocolFrequencyType;
  frequency_value: number;
  route: string;
  description: string;
  dose_note: string;
  sort_order: number;
}

type RawEntry = [
  slug: string,
  name: string,
  compound: string,
  dosage: number,
  unit: string,
  frequencyType: ProtocolFrequencyType,
  frequencyValue: number,
  route: string,
  description: string,
  doseNote: string,
];

function buildEntries(
  category: ProtocolReferenceCategory,
  startSortOrder: number,
  rows: RawEntry[]
): ProtocolReferenceEntry[] {
  return rows.map((row, index) => ({
    slug: row[0],
    name: row[1],
    compound: row[2],
    category,
    default_dosage: row[3],
    unit: row[4],
    frequency_type: row[5],
    frequency_value: row[6],
    route: row[7],
    description: row[8],
    dose_note: row[9],
    sort_order: startSortOrder + index,
  }));
}

const TRT_REFERENCE_ROWS: RawEntry[] = [
  ['testosterone-cypionate', 'Testosterone Cypionate', 'Testosterone Cypionate', 120, 'mg', 'weekly', 7, 'IM', 'Long-acting testosterone ester commonly used for TRT protocols.', 'Common TRT reference range: 100-200 mg weekly, often split into 1-2 injections.'],
  ['testosterone-enanthate', 'Testosterone Enanthate', 'Testosterone Enanthate', 120, 'mg', 'weekly', 7, 'IM', 'Long-acting testosterone ester with a profile similar to cypionate.', 'Common TRT reference range: 100-200 mg weekly, often split into 1-2 injections.'],
  ['testosterone-propionate', 'Testosterone Propionate', 'Testosterone Propionate', 25, 'mg', 'every_x_days', 2, 'IM', 'Shorter-acting testosterone ester sometimes used in more frequent injection schedules.', 'Community reference protocols often use 20-30 mg every other day.'],
  ['testosterone-undecanoate', 'Testosterone Undecanoate', 'Testosterone Undecanoate', 1000, 'mg', 'weekly', 70, 'IM', 'Very long-acting testosterone ester used in specific prescription regimens.', 'Prescription interval is product-specific and clinician-directed.'],
  ['hcg', 'hCG', 'Human Chorionic Gonadotropin', 500, 'IU', 'every_x_days', 3, 'SubQ', 'Often paired with TRT to support testicular function.', 'Common reference range: 250-500 IU two to three times weekly.'],
  ['anastrozole', 'Anastrozole', 'Anastrozole', 0.25, 'mg', 'every_x_days', 3, 'Oral', 'Aromatase inhibitor sometimes used when estradiol management is required.', 'Dose is highly individualized and should be clinician-guided.'],
  ['exemestane', 'Exemestane', 'Exemestane', 12.5, 'mg', 'every_x_days', 3, 'Oral', 'Steroidal aromatase inhibitor used in some estradiol-management protocols.', 'Dose is highly individualized and should be clinician-guided.'],
  ['letrozole', 'Letrozole', 'Letrozole', 0.25, 'mg', 'weekly', 7, 'Oral', 'Potent aromatase inhibitor occasionally discussed in high-estradiol contexts.', 'Typically avoided without careful clinician supervision due to potency.'],
  ['pregnenolone', 'Pregnenolone', 'Pregnenolone', 25, 'mg', 'daily', 1, 'Oral', 'Neurosteroid precursor sometimes used in hormone-support stacks.', 'Common supplemental range: 10-50 mg daily.'],
  ['dhea', 'DHEA', 'DHEA', 25, 'mg', 'daily', 1, 'Oral', 'Adrenal hormone precursor sometimes used when labs support replacement.', 'Common supplemental range: 10-50 mg daily, ideally guided by labs.'],
];

const SUPPLEMENT_REFERENCE_ROWS: RawEntry[] = [
  ['creatine-monohydrate', 'Creatine Monohydrate', 'Creatine Monohydrate', 5, 'g', 'daily', 1, 'Oral', 'Supports power output, muscle performance, and training recovery.', 'Common maintenance dose: 3-5 g daily.'],
  ['vitamin-d3', 'Vitamin D3', 'Vitamin D3', 2000, 'IU', 'daily', 1, 'Oral', 'Often used to support vitamin D status when sun exposure is limited.', 'A common maintenance range is 1000-4000 IU daily, adjusted to labs.'],
  ['omega-3', 'Omega-3 Fish Oil', 'EPA/DHA Fish Oil', 2000, 'mg', 'daily', 1, 'Oral', 'Used to support omega-3 intake and cardiovascular health markers.', 'Common reference target: 1000-2000 mg combined EPA/DHA daily.'],
  ['magnesium-glycinate', 'Magnesium Glycinate', 'Magnesium Glycinate', 200, 'mg', 'daily', 1, 'Oral', 'Frequently used for magnesium intake, sleep support, and muscle relaxation.', 'Common reference range: 200-400 mg elemental magnesium daily.'],
  ['zinc', 'Zinc', 'Zinc', 15, 'mg', 'daily', 1, 'Oral', 'Supports overall micronutrient intake and immune function.', 'Common supplemental range: 10-30 mg daily.'],
  ['vitamin-k2', 'Vitamin K2 MK-7', 'Vitamin K2 MK-7', 100, 'mcg', 'daily', 1, 'Oral', 'Commonly paired with vitamin D in bone-health stacks.', 'Common reference range: 90-200 mcg daily.'],
  ['coq10', 'CoQ10', 'Coenzyme Q10', 100, 'mg', 'daily', 1, 'Oral', 'Used to support mitochondrial energy production.', 'Common reference range: 100-200 mg daily.'],
  ['nac', 'NAC', 'N-Acetyl Cysteine', 600, 'mg', 'daily', 1, 'Oral', 'Often used in antioxidant and liver-support stacks.', 'Common reference range: 600-1200 mg daily.'],
  ['curcumin', 'Curcumin', 'Curcumin', 500, 'mg', 'daily', 1, 'Oral', 'Common anti-inflammatory support supplement.', 'Common reference range: 500-1000 mg daily with a bioavailability enhancer.'],
  ['berberine', 'Berberine', 'Berberine', 500, 'mg', 'daily', 1, 'Oral', 'Frequently used to support blood glucose and metabolic health.', 'Common reference range: 500 mg one to three times daily with meals.'],
  ['ashwagandha', 'Ashwagandha', 'Ashwagandha', 300, 'mg', 'daily', 1, 'Oral', 'Adaptogenic herb commonly used for stress management support.', 'Common reference range: 300-600 mg daily of a standardized extract.'],
  ['rhodiola', 'Rhodiola Rosea', 'Rhodiola Rosea', 200, 'mg', 'daily', 1, 'Oral', 'Often used to support fatigue resistance and stress tolerance.', 'Common reference range: 200-400 mg daily.'],
  ['l-theanine', 'L-Theanine', 'L-Theanine', 200, 'mg', 'daily', 1, 'Oral', 'Used for calm focus and smoother caffeine response.', 'Common reference range: 100-200 mg once or twice daily.'],
  ['melatonin', 'Melatonin', 'Melatonin', 0.5, 'mg', 'daily', 1, 'Oral', 'Used as sleep-timing support in the evening.', 'A conservative starting dose is often 0.3-1 mg before bed.'],
  ['glycine', 'Glycine', 'Glycine', 3, 'g', 'daily', 1, 'Oral', 'Commonly used in sleep and recovery stacks.', 'Common reference dose: 3 g before bed.'],
  ['taurine', 'Taurine', 'Taurine', 1000, 'mg', 'daily', 1, 'Oral', 'Used for hydration, recovery, and cardiovascular support stacks.', 'Common reference range: 1000-2000 mg daily.'],
  ['citrulline-malate', 'Citrulline Malate', 'Citrulline Malate', 6000, 'mg', 'daily', 1, 'Oral', 'Common pre-workout ingredient for pumps and endurance.', 'Common pre-workout reference range: 6000-8000 mg.'],
  ['alpha-lipoic-acid', 'Alpha Lipoic Acid', 'Alpha Lipoic Acid', 300, 'mg', 'daily', 1, 'Oral', 'Antioxidant support often used in glucose-support stacks.', 'Common reference range: 300-600 mg daily.'],
  ['acetyl-l-carnitine', 'Acetyl-L-Carnitine', 'Acetyl-L-Carnitine', 500, 'mg', 'daily', 1, 'Oral', 'Often used in cognition and energy-support stacks.', 'Common reference range: 500-2000 mg daily.'],
  ['vitamin-c', 'Vitamin C', 'Vitamin C', 500, 'mg', 'daily', 1, 'Oral', 'General antioxidant and micronutrient support.', 'Common supplemental range: 250-1000 mg daily.'],
  ['selenium', 'Selenium', 'Selenium', 100, 'mcg', 'daily', 1, 'Oral', 'Trace mineral support often discussed with thyroid-focused stacks.', 'Common reference range: 100-200 mcg daily.'],
  ['boron', 'Boron', 'Boron', 3, 'mg', 'daily', 1, 'Oral', 'Trace mineral often included in general wellness stacks.', 'Common reference range: 3-6 mg daily.'],
  ['collagen-peptides', 'Collagen Peptides', 'Collagen Peptides', 10, 'g', 'daily', 1, 'Oral', 'Protein supplement commonly used for connective tissue support.', 'Common reference range: 10-20 g daily.'],
  ['glucosamine-sulfate', 'Glucosamine Sulfate', 'Glucosamine Sulfate', 1500, 'mg', 'daily', 1, 'Oral', 'Joint-support supplement often paired with chondroitin.', 'Common reference dose: 1500 mg daily.'],
  ['chondroitin', 'Chondroitin', 'Chondroitin', 1200, 'mg', 'daily', 1, 'Oral', 'Often paired with glucosamine for joint support.', 'Common reference dose: 800-1200 mg daily.'],
  ['psyllium-husk', 'Psyllium Husk', 'Psyllium Husk', 5, 'g', 'daily', 1, 'Oral', 'Soluble fiber supplement used for digestion and cholesterol support.', 'Common reference dose: 5-10 g daily with adequate fluid intake.'],
  ['inositol', 'Myo-Inositol', 'Myo-Inositol', 2000, 'mg', 'daily', 1, 'Oral', 'Commonly used in metabolic and mood-support stacks.', 'Common reference range: 2000-4000 mg daily.'],
  ['electrolytes', 'Electrolytes', 'Electrolyte Blend', 1, 'g', 'daily', 1, 'Oral', 'General hydration support blend usually containing sodium and potassium.', 'Amount varies by product and sodium needs.'],
  ['potassium', 'Potassium', 'Potassium', 99, 'mg', 'daily', 1, 'Oral', 'Low-dose supplemental potassium as found in many OTC products.', 'OTC products are often limited to 99 mg per serving.'],
  ['vitamin-b12', 'Vitamin B12', 'Methylcobalamin', 1000, 'mcg', 'daily', 1, 'Oral', 'Commonly used when B12 intake or labs are low.', 'Common oral supplemental range: 500-1000 mcg daily.'],
  ['folate', 'Folate', 'Methylfolate', 400, 'mcg', 'daily', 1, 'Oral', 'Often paired with B12 in methylation-focused stacks.', 'Common supplemental range: 400-800 mcg daily.'],
  ['b-complex', 'B-Complex', 'B-Complex', 1, 'g', 'daily', 1, 'Oral', 'Multi-B supplement for general micronutrient support.', 'Follow product-specific serving size.'],
  ['niacinamide', 'Niacinamide', 'Niacinamide', 500, 'mg', 'daily', 1, 'Oral', 'Vitamin B3 form often used in skin and general wellness stacks.', 'Common reference range: 250-500 mg daily.'],
  ['p5p', 'P5P', 'Pyridoxal-5-Phosphate', 25, 'mg', 'daily', 1, 'Oral', 'Active vitamin B6 form used in some hormone-support stacks.', 'Common reference range: 25-50 mg daily.'],
  ['calcium', 'Calcium', 'Calcium', 500, 'mg', 'daily', 1, 'Oral', 'Mineral support when dietary calcium intake is low.', 'Common supplemental range: 500-600 mg daily as needed.'],
  ['iron', 'Iron', 'Iron', 18, 'mg', 'daily', 1, 'Oral', 'Iron replacement should generally be lab-guided.', 'Use only with clinician guidance when iron deficiency is documented.'],
  ['copper', 'Copper', 'Copper', 2, 'mg', 'daily', 1, 'Oral', 'Trace mineral sometimes paired with zinc balance strategies.', 'Common reference range: 1-2 mg daily.'],
  ['manganese', 'Manganese', 'Manganese', 2, 'mg', 'daily', 1, 'Oral', 'Trace mineral support used in some multi-mineral stacks.', 'Common reference range: 1-5 mg daily.'],
  ['chromium', 'Chromium', 'Chromium Picolinate', 200, 'mcg', 'daily', 1, 'Oral', 'Used in some metabolic support stacks.', 'Common reference range: 200-400 mcg daily.'],
  ['molybdenum', 'Molybdenum', 'Molybdenum', 100, 'mcg', 'daily', 1, 'Oral', 'Trace mineral support occasionally used in sulfur-metabolism discussions.', 'Common reference range: 75-150 mcg daily.'],
  ['iodine', 'Iodine', 'Iodine', 150, 'mcg', 'daily', 1, 'Oral', 'Thyroid-relevant micronutrient best approached carefully.', 'Dose should reflect dietary intake and thyroid context.'],
  ['probiotic', 'Probiotic', 'Probiotic Blend', 1, 'g', 'daily', 1, 'Oral', 'Digestive support supplement varying widely by strain and CFU count.', 'Follow product-specific serving and strain guidance.'],
  ['digestive-enzymes', 'Digestive Enzymes', 'Digestive Enzyme Blend', 1, 'g', 'daily', 1, 'Oral', 'Meal-time digestive support blend.', 'Follow product-specific serving size, usually with meals.'],
  ['beetroot-powder', 'Beetroot Powder', 'Beetroot Powder', 5, 'g', 'daily', 1, 'Oral', 'Nitric-oxide support supplement often used pre-workout.', 'Common reference range: 3-6 g before training.'],
  ['beta-alanine', 'Beta-Alanine', 'Beta-Alanine', 3200, 'mg', 'daily', 1, 'Oral', 'Performance supplement used to raise muscle carnosine.', 'Common reference range: 3200-6400 mg daily in divided doses.'],
  ['betaine-anhydrous', 'Betaine Anhydrous', 'Betaine Anhydrous', 2500, 'mg', 'daily', 1, 'Oral', 'Performance supplement sometimes included in strength stacks.', 'Common reference range: 2500 mg daily.'],
  ['betaine-hcl', 'Betaine HCl', 'Betaine HCl', 500, 'mg', 'daily', 1, 'Oral', 'Digestive support supplement used with meals by some users.', 'Follow product-specific serving guidance.'],
  ['hmb', 'HMB', 'HMB', 3000, 'mg', 'daily', 1, 'Oral', 'Leucine metabolite used in some recovery-focused stacks.', 'Common reference range: 3000 mg daily.'],
  ['eaas', 'EAAs', 'Essential Amino Acids', 10, 'g', 'daily', 1, 'Oral', 'Amino acid blend used around training or low-protein meals.', 'Common reference range: 5-15 g daily depending on diet.'],
  ['bcaa', 'BCAAs', 'Branched Chain Amino Acids', 10, 'g', 'daily', 1, 'Oral', 'Amino acid blend commonly used around training.', 'Common reference range: 5-10 g around training.'],
  ['whey-protein', 'Whey Protein', 'Whey Protein', 25, 'g', 'daily', 1, 'Oral', 'Protein supplement used to support total daily intake.', 'Typical serving: 20-30 g protein per shake.'],
  ['casein-protein', 'Casein Protein', 'Casein Protein', 30, 'g', 'daily', 1, 'Oral', 'Slow-digesting protein often used later in the day.', 'Typical serving: 25-40 g protein.'],
  ['pea-protein', 'Pea Protein', 'Pea Protein', 25, 'g', 'daily', 1, 'Oral', 'Plant protein supplement used to support total protein intake.', 'Typical serving: 20-30 g protein.'],
  ['l-carnitine', 'L-Carnitine', 'L-Carnitine', 1000, 'mg', 'daily', 1, 'Oral', 'Energy and recovery support supplement.', 'Common reference range: 1000-2000 mg daily.'],
  ['agmatine', 'Agmatine Sulfate', 'Agmatine Sulfate', 1000, 'mg', 'daily', 1, 'Oral', 'Pump and nitric-oxide support supplement used in some pre-workout stacks.', 'Common reference range: 500-1000 mg daily.'],
  ['quercetin', 'Quercetin', 'Quercetin', 500, 'mg', 'daily', 1, 'Oral', 'Flavonoid antioxidant used in general wellness stacks.', 'Common reference range: 500-1000 mg daily.'],
  ['resveratrol', 'Resveratrol', 'Resveratrol', 250, 'mg', 'daily', 1, 'Oral', 'Polyphenol supplement often used in longevity-oriented stacks.', 'Common reference range: 100-500 mg daily.'],
  ['pqq', 'PQQ', 'PQQ', 20, 'mg', 'daily', 1, 'Oral', 'Mitochondrial support supplement sometimes paired with CoQ10.', 'Common reference range: 10-20 mg daily.'],
  ['apigenin', 'Apigenin', 'Apigenin', 50, 'mg', 'daily', 1, 'Oral', 'Flavonoid often used in sleep-oriented stacks.', 'Common reference range: 50-100 mg in the evening.'],
  ['gaba', 'GABA', 'GABA', 500, 'mg', 'daily', 1, 'Oral', 'Supplement sometimes used for relaxation or pre-sleep routines.', 'Common reference range: 250-750 mg daily.'],
  ['5-htp', '5-HTP', '5-HTP', 100, 'mg', 'daily', 1, 'Oral', 'Serotonin precursor supplement often used in mood or sleep stacks.', 'Use caution with serotonergic medications. Common reference range: 50-200 mg daily.'],
  ['mucuna', 'Mucuna Pruriens', 'Mucuna Pruriens', 300, 'mg', 'daily', 1, 'Oral', 'L-DOPA-containing supplement used in some focus and libido stacks.', 'Product potency varies; use caution with dopaminergic effects.'],
  ['tongkat-ali', 'Tongkat Ali', 'Tongkat Ali', 200, 'mg', 'daily', 1, 'Oral', 'Botanical supplement often used in testosterone-support stacks.', 'Common reference range: 200-400 mg daily of a standardized extract.'],
  ['fadogia', 'Fadogia Agrestis', 'Fadogia Agrestis', 300, 'mg', 'daily', 1, 'Oral', 'Botanical occasionally used in testosterone-support stacks.', 'Human data is limited; use caution.'],
  ['tribulus', 'Tribulus Terrestris', 'Tribulus Terrestris', 750, 'mg', 'daily', 1, 'Oral', 'Botanical supplement commonly used in performance stacks.', 'Common reference range: 500-1500 mg daily.'],
  ['fenugreek', 'Fenugreek', 'Fenugreek', 500, 'mg', 'daily', 1, 'Oral', 'Botanical supplement sometimes used in metabolic and libido stacks.', 'Common reference range: 500-600 mg daily.'],
  ['saw-palmetto', 'Saw Palmetto', 'Saw Palmetto', 320, 'mg', 'daily', 1, 'Oral', 'Botanical supplement commonly used in prostate-focused stacks.', 'Common reference dose: 320 mg daily.'],
  ['milk-thistle', 'Milk Thistle', 'Milk Thistle', 300, 'mg', 'daily', 1, 'Oral', 'Botanical supplement used in liver-support stacks.', 'Common reference range: 150-300 mg once or twice daily.'],
  ['cissus', 'Cissus Quadrangularis', 'Cissus Quadrangularis', 500, 'mg', 'daily', 1, 'Oral', 'Botanical supplement often used in joint-support stacks.', 'Common reference range: 500-1000 mg daily.'],
  ['boswellia', 'Boswellia', 'Boswellia Serrata', 300, 'mg', 'daily', 1, 'Oral', 'Botanical anti-inflammatory support supplement.', 'Common reference range: 300-500 mg one to two times daily.'],
  ['garlic', 'Aged Garlic Extract', 'Aged Garlic Extract', 600, 'mg', 'daily', 1, 'Oral', 'Supplement often used in cardiovascular health stacks.', 'Common reference range: 600-1200 mg daily.'],
  ['cinnamon', 'Cinnamon Extract', 'Cinnamon Extract', 500, 'mg', 'daily', 1, 'Oral', 'Supplement used in some blood-sugar support stacks.', 'Common reference range: 500-1000 mg daily.'],
  ['ginger', 'Ginger', 'Ginger', 1000, 'mg', 'daily', 1, 'Oral', 'Digestive and anti-inflammatory support supplement.', 'Common reference range: 1000-2000 mg daily.'],
  ['olive-leaf', 'Olive Leaf Extract', 'Olive Leaf Extract', 500, 'mg', 'daily', 1, 'Oral', 'Botanical antioxidant support supplement.', 'Common reference range: 500-1000 mg daily.'],
  ['grape-seed', 'Grape Seed Extract', 'Grape Seed Extract', 200, 'mg', 'daily', 1, 'Oral', 'Polyphenol supplement used in vascular-support stacks.', 'Common reference range: 100-300 mg daily.'],
  ['spirulina', 'Spirulina', 'Spirulina', 3, 'g', 'daily', 1, 'Oral', 'Algae-based nutrient supplement.', 'Common reference range: 1-5 g daily.'],
  ['chlorella', 'Chlorella', 'Chlorella', 3, 'g', 'daily', 1, 'Oral', 'Algae-based supplement used in some detox and nutrient stacks.', 'Common reference range: 2-5 g daily.'],
  ['lutein', 'Lutein', 'Lutein', 20, 'mg', 'daily', 1, 'Oral', 'Eye-health support supplement often paired with zeaxanthin.', 'Common reference range: 10-20 mg daily.'],
  ['zeaxanthin', 'Zeaxanthin', 'Zeaxanthin', 4, 'mg', 'daily', 1, 'Oral', 'Eye-health support supplement often paired with lutein.', 'Common reference range: 2-10 mg daily.'],
  ['sam-e', 'SAM-e', 'SAM-e', 400, 'mg', 'daily', 1, 'Oral', 'Supplement sometimes used in mood and joint-support stacks.', 'Common reference range: 400-800 mg daily.'],
  ['alpha-gpc', 'Alpha-GPC', 'Alpha-GPC', 300, 'mg', 'daily', 1, 'Oral', 'Choline donor often used in focus-oriented stacks.', 'Common reference range: 300-600 mg daily.'],
  ['citicoline', 'Citicoline', 'Citicoline', 250, 'mg', 'daily', 1, 'Oral', 'Choline donor used in cognition-oriented stacks.', 'Common reference range: 250-500 mg daily.'],
  ['phosphatidylserine', 'Phosphatidylserine', 'Phosphatidylserine', 100, 'mg', 'daily', 1, 'Oral', 'Supplement used in stress and cognition-oriented stacks.', 'Common reference range: 100-300 mg daily.'],
  ['l-tyrosine', 'L-Tyrosine', 'L-Tyrosine', 500, 'mg', 'daily', 1, 'Oral', 'Amino acid used in focus and stress-response stacks.', 'Common reference range: 500-2000 mg daily.'],
  ['green-tea-extract', 'Green Tea Extract', 'Green Tea Extract', 500, 'mg', 'daily', 1, 'Oral', 'Polyphenol supplement often used in general wellness stacks.', 'Follow product EGCG content and use with meals when appropriate.'],
  ['black-seed-oil', 'Black Seed Oil', 'Black Seed Oil', 1000, 'mg', 'daily', 1, 'Oral', 'Oil supplement commonly used in general wellness stacks.', 'Common reference range: 500-1000 mg daily.'],
];

const PEPTIDE_REFERENCE_ROWS: RawEntry[] = [
  ['bpc-157', 'BPC-157', 'BPC-157', 250, 'mcg', 'daily', 1, 'SubQ', 'Research peptide frequently discussed for recovery support.', 'Common reference range in community protocols: 250-500 mcg daily. Human dosing is not FDA-established.'],
  ['tb-500', 'TB-500', 'TB-500', 2, 'mg', 'weekly', 7, 'SubQ', 'Research peptide often paired with BPC-157 in recovery protocols.', 'Common community reference range: 2-5 mg weekly. Human dosing is not FDA-established.'],
  ['ipamorelin', 'Ipamorelin', 'Ipamorelin', 200, 'mcg', 'daily', 1, 'SubQ', 'Growth hormone secretagogue used in some peptide stacks.', 'Common community reference range: 100-300 mcg daily. Human dosing is not FDA-established.'],
  ['cjc-1295-no-dac', 'CJC-1295 (No DAC)', 'CJC-1295 (No DAC)', 100, 'mcg', 'daily', 1, 'SubQ', 'Shorter-acting GHRH analog often paired with ipamorelin.', 'Common community reference range: 100-200 mcg daily. Human dosing is not FDA-established.'],
  ['cjc-1295-dac', 'CJC-1295 DAC', 'CJC-1295 DAC', 2, 'mg', 'weekly', 7, 'SubQ', 'Longer-acting GHRH analog used in some weekly protocols.', 'Common community reference range: 1-2 mg weekly. Human dosing is not FDA-established.'],
  ['tesamorelin', 'Tesamorelin', 'Tesamorelin', 2, 'mg', 'daily', 1, 'SubQ', 'GHRH analog with prescription use in specific clinical contexts.', 'Prescription dosing is indication-specific and should remain clinician-directed.'],
  ['aod-9604', 'AOD-9604', 'AOD-9604', 300, 'mcg', 'daily', 1, 'SubQ', 'Research peptide often discussed in body-composition stacks.', 'Common community reference range: 300-500 mcg daily. Human dosing is not FDA-established.'],
  ['ghk-cu', 'GHK-Cu', 'GHK-Cu', 2, 'mg', 'daily', 1, 'Topical', 'Copper peptide commonly used in skin and hair-support products.', 'Topical concentration and application vary widely by product.'],
  ['thymosin-alpha-1', 'Thymosin Alpha-1', 'Thymosin Alpha-1', 1.5, 'mg', 'every_x_days', 3, 'SubQ', 'Peptide sometimes discussed in immune-support contexts.', 'Protocols vary substantially and should be clinician-directed where used.'],
  ['thymosin-beta-4', 'Thymosin Beta-4', 'Thymosin Beta-4', 2, 'mg', 'weekly', 7, 'SubQ', 'Research peptide sometimes used in recovery-oriented stacks.', 'Common community reference range: 2-5 mg weekly. Human dosing is not FDA-established.'],
  ['mots-c', 'MOTS-c', 'MOTS-c', 5, 'mg', 'every_x_days', 3, 'SubQ', 'Research peptide often discussed in metabolic support circles.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['epitalon', 'Epitalon', 'Epitalon', 5, 'mg', 'daily', 1, 'SubQ', 'Research peptide often used in short cycles in longevity circles.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['selank', 'Selank', 'Selank', 300, 'mcg', 'daily', 1, 'Nasal', 'Peptide commonly discussed for calm-focus support.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['semax', 'Semax', 'Semax', 300, 'mcg', 'daily', 1, 'Nasal', 'Peptide commonly discussed in nootropic-oriented stacks.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['dsip', 'DSIP', 'DSIP', 100, 'mcg', 'daily', 1, 'SubQ', 'Peptide sometimes discussed for sleep-oriented protocols.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['sermorelin', 'Sermorelin', 'Sermorelin', 200, 'mcg', 'daily', 1, 'SubQ', 'GHRH analog used in some anti-aging and GH-support clinics.', 'Prescription use is clinician-directed; community protocols vary.'],
  ['hexarelin', 'Hexarelin', 'Hexarelin', 100, 'mcg', 'daily', 1, 'SubQ', 'Growth hormone secretagogue peptide.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['ghrp-2', 'GHRP-2', 'GHRP-2', 100, 'mcg', 'daily', 1, 'SubQ', 'Growth hormone secretagogue used in older peptide stacks.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['ghrp-6', 'GHRP-6', 'GHRP-6', 100, 'mcg', 'daily', 1, 'SubQ', 'Growth hormone secretagogue often discussed with hunger effects.', 'Community protocols vary widely. Human dosing is not FDA-established.'],
  ['igf-1-lr3', 'IGF-1 LR3', 'IGF-1 LR3', 20, 'mcg', 'daily', 1, 'SubQ', 'Research peptide analog discussed in performance circles.', 'Human dosing is not FDA-established and carries meaningful risk.'],
  ['igf-1-des', 'IGF-1 DES', 'IGF-1 DES', 20, 'mcg', 'daily', 1, 'SubQ', 'Shorter-acting IGF analog discussed in localized protocols.', 'Human dosing is not FDA-established and carries meaningful risk.'],
  ['peg-mgf', 'PEG-MGF', 'PEG-MGF', 200, 'mcg', 'every_x_days', 3, 'SubQ', 'Research peptide discussed in recovery and growth-factor stacks.', 'Human dosing is not FDA-established.'],
  ['mgf', 'MGF', 'Mechano Growth Factor', 200, 'mcg', 'daily', 1, 'SubQ', 'Research peptide discussed in training-recovery contexts.', 'Human dosing is not FDA-established.'],
  ['ara-290', 'ARA-290', 'ARA-290', 4, 'mg', 'daily', 1, 'SubQ', 'Peptide analog discussed for nerve and inflammatory research.', 'Human dosing is not FDA-established outside research settings.'],
  ['pt-141', 'PT-141', 'Bremelanotide', 1.75, 'mg', 'every_x_days', 7, 'SubQ', 'Prescription peptide in specific sexual health contexts.', 'Use should remain clinician-directed where prescribed.'],
  ['kisspeptin-10', 'Kisspeptin-10', 'Kisspeptin-10', 100, 'mcg', 'every_x_days', 3, 'SubQ', 'Peptide discussed in fertility and HPTA-focused circles.', 'Use is highly specialized and should be clinician-guided.'],
  ['gonadorelin', 'Gonadorelin', 'Gonadorelin', 100, 'mcg', 'every_x_days', 3, 'SubQ', 'GnRH analog used in specialized hormone-management protocols.', 'Use should remain clinician-directed.'],
  ['bpc-157-tb-500-blend', 'BPC-157 / TB-500 Blend', 'BPC-157 + TB-500', 500, 'mcg', 'daily', 1, 'SubQ', 'Recovery-oriented peptide blend commonly discussed for soft tissue support.', 'Blend concentration varies by vial. A common community reference target is 250-500 mcg combined daily or product-equivalent dosing. Human dosing is not FDA-established.'],
  ['bpc-157-ghk-cu-blend', 'BPC-157 / GHK-Cu Blend', 'BPC-157 + GHK-Cu', 500, 'mcg', 'daily', 1, 'SubQ', 'Recovery and tissue-support peptide blend sometimes used in repair-focused stacks.', 'Blend concentration varies by product. Community reference use often targets 250-500 mcg combined daily. Human dosing is not FDA-established.'],
  ['cjc-1295-ipamorelin-blend', 'CJC-1295 / Ipamorelin Blend', 'CJC-1295 + Ipamorelin', 200, 'mcg', 'daily', 1, 'SubQ', 'Popular GH-support blend pairing a GHRH analog with a ghrelin mimetic.', 'Common community reference use is 100-200 mcg of each peptide once nightly or as product-equivalent dosing. Human dosing is not FDA-established.'],
  ['sermorelin-ipamorelin-blend', 'Sermorelin / Ipamorelin Blend', 'Sermorelin + Ipamorelin', 300, 'mcg', 'daily', 1, 'SubQ', 'Secretagogue blend used in some clinic-directed GH-support protocols.', 'Product ratios vary. Community and clinic protocols often total 200-300 mcg nightly. Use should be clinician-directed where prescribed.'],
  ['semax-selank-blend', 'Semax / Selank Blend', 'Semax + Selank', 300, 'mcg', 'daily', 1, 'Nasal', 'Nootropic peptide blend commonly discussed for focus with calmer tone.', 'Community reference use often targets 200-400 mcg per dose intranasally depending on product concentration. Human dosing is not FDA-established.'],
  ['aod-9604-mots-c-blend', 'AOD-9604 / MOTS-c Blend', 'AOD-9604 + MOTS-c', 5, 'mg', 'every_x_days', 3, 'SubQ', 'Metabolic-support blend discussed in body-composition and mitochondrial stacks.', 'Blend ratios vary significantly by product. Community protocols often use low-mg total dosing two to three times weekly. Human dosing is not FDA-established.'],
  ['tirzepatide-cagrilintide-blend', 'Tirzepatide / Cagrilintide Blend', 'Tirzepatide + Cagrilintide', 1, 'mg', 'weekly', 7, 'SubQ', 'Combination incretin and amylin-style blend discussed in weight-management circles.', 'This is highly product-specific and should be clinician-directed. Start low only according to the exact compounded concentration and tolerability plan.'],
  ['glow-blend', 'Glow Blend', 'GHK-Cu + BPC-157 + TB-500', 500, 'mcg', 'daily', 1, 'SubQ', 'Aesthetic and recovery-focused peptide blend name commonly used by clinics and compounders.', 'Blend ingredients and ratios vary by pharmacy. Use the exact vial concentration to calculate dosing; community use is often low-dose daily or near-daily. Human dosing is not FDA-established.'],
  ['klow-blend', 'Klow Blend', 'Kisspeptin-10 + PT-141 + Oxytocin', 500, 'mcg', 'every_x_days', 3, 'SubQ', 'Libido and intimacy-oriented blend name used in some wellness clinics.', 'This is highly product-specific and should be clinician-directed. Ingredient ratios and per-dose potency vary significantly by compounder.'],
  ['lean-blend', 'Lean Blend', 'AOD-9604 + MOTS-c + L-Carnitine', 5, 'mg', 'every_x_days', 3, 'SubQ', 'Body-composition blend name commonly used for metabolic-support protocols.', 'Product ratios vary significantly. Start only from the exact label concentration and product instructions where prescribed or dispensed.'],
  ['shred-blend', 'Shred Blend', 'Tesamorelin + Ipamorelin + AOD-9604', 300, 'mcg', 'daily', 1, 'SubQ', 'GH-axis and body-composition blend name seen in peptide clinics.', 'This category of blend is highly clinic- and pharmacy-specific. Dosing should be based on the exact peptide ratio and label concentration.'],
  ['repair-blend', 'Repair Blend', 'BPC-157 + TB-500 + KPV', 500, 'mcg', 'daily', 1, 'SubQ', 'Soft-tissue and gut-recovery blend name used by some compounders.', 'Ratios and concentration vary by product. Community-style use often targets low-dose daily administration, but human dosing is not FDA-established.'],
  ['focus-blend', 'Focus Blend', 'Semax + Selank + Dihexa', 300, 'mcg', 'daily', 1, 'Nasal', 'Nootropic blend name used in some cognitive-performance product lines.', 'Ingredient ratios vary and some components may be investigational. Use should be cautious and product-specific.'],
  ['sleep-blend', 'Sleep Blend', 'DSIP + Epitalon + Selank', 300, 'mcg', 'daily', 1, 'SubQ', 'Sleep-support peptide blend name used in some longevity and recovery stacks.', 'Product-specific concentration matters. Community protocols vary widely and human dosing is not FDA-established.'],
  ['glp-1-blend', 'GLP-1 Blend', 'Tirzepatide + Cagrilintide + Cyanocobalamin', 1, 'mg', 'weekly', 7, 'SubQ', 'Weight-management blend name used for compounded incretin products.', 'This is highly pharmacy-specific and should be clinician-directed. Base dosing on the exact compounded concentration and titration plan.'],
  ['tirzepatide', 'Tirzepatide', 'Tirzepatide', 2.5, 'mg', 'weekly', 7, 'SubQ', 'Prescription incretin medication used for weight and glycemic management.', 'Typical product initiation starts at 2.5 mg weekly and titrates clinically.'],
  ['semaglutide', 'Semaglutide', 'Semaglutide', 0.25, 'mg', 'weekly', 7, 'SubQ', 'Prescription incretin medication used for weight and glycemic management.', 'Typical product initiation starts at 0.25 mg weekly and titrates clinically.'],
  ['retatrutide', 'Retatrutide', 'Retatrutide', 1, 'mg', 'weekly', 7, 'SubQ', 'Investigational triple-agonist compound discussed in weight-management circles.', 'Investigational compound; dosing is not established for self-directed use.'],
  ['cagrilintide', 'Cagrilintide', 'Cagrilintide', 0.3, 'mg', 'weekly', 7, 'SubQ', 'Amylin analog under investigation in weight-management contexts.', 'Investigational use only; dosing depends on study/product context.'],
];

export const PROTOCOL_REFERENCE_LIBRARY: ProtocolReferenceEntry[] = [
  ...buildEntries('TRT', 1, TRT_REFERENCE_ROWS),
  ...buildEntries('Supplement', 1000, SUPPLEMENT_REFERENCE_ROWS),
  ...buildEntries('Peptide', 2000, PEPTIDE_REFERENCE_ROWS),
];

export async function seedProtocolReferenceLibrary(db: SQLiteDatabase): Promise<void> {
  for (const entry of PROTOCOL_REFERENCE_LIBRARY) {
    await db.runAsync(
      `INSERT OR REPLACE INTO protocol_reference_library
        (id, slug, name, compound, category, default_dosage, unit, frequency_type, frequency_value, route, description, dose_note, sort_order)
       VALUES (
         COALESCE((SELECT id FROM protocol_reference_library WHERE slug = ?), NULL),
         ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       )`,
      [
        entry.slug,
        entry.slug,
        entry.name,
        entry.compound,
        entry.category,
        entry.default_dosage,
        entry.unit,
        entry.frequency_type,
        entry.frequency_value,
        entry.route,
        entry.description,
        entry.dose_note,
        entry.sort_order,
      ]
    );
  }
}
