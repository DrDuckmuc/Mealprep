import type { Kategorie } from './typen'

// Reihenfolge zählt: Der erste Treffer gewinnt, deshalb stehen Sonderfälle wie
// "Tomatenmark" oder "Paprikapulver" vor den allgemeinen Begriffen.
const REGELN: [Kategorie, string[]][] = [
  ['Trockenware', ['brühe', 'fond', 'tomatenmark', 'passierte', 'gehackte tomaten', 'stückige tomaten', 'dosentomaten', 'kokosmilch', 'preiselbeer']],
  ['Gewürze', ['paprikapulver', 'pfeffer', 'salz', 'curry', 'kreuzkümmel', 'kümmel', 'oregano', 'thymian', 'rosmarin', 'muskat', 'zimt', 'chili', 'lorbeer', 'kurkuma', 'majoran', 'gewürz', 'vanille']],
  ['Fleisch/Fisch', ['hähnchen', 'huhn', 'hühner', 'pute', 'rind', 'schwein', 'hackfleisch', 'hack', 'speck', 'schinken', 'wurst', 'salami', 'lachs', 'thunfisch', 'fisch', 'garnele', 'lamm', 'steak']],
  ['Kühlregal', ['milch', 'sahne', 'butter', 'käse', 'quark', 'joghurt', 'schmand', 'crème', 'creme', 'mozzarella', 'feta', 'parmesan', 'gouda', 'tofu', 'mascarpone', 'hefe', 'margarine']],
  ['Obst & Gemüse', ['zwiebel', 'knoblauch', 'tomate', 'karotte', 'möhre', 'paprika', 'zucchini', 'gurke', 'salat', 'kartoffel', 'lauch', 'porree', 'brokkoli', 'blumenkohl', 'spinat', 'pilz', 'champignon', 'aubergine', 'kürbis', 'apfel', 'äpfel', 'banane', 'zitrone', 'limette', 'orange', 'beere', 'ingwer', 'petersilie', 'basilikum', 'schnittlauch', 'koriander', 'avocado', 'sellerie', 'kohl', 'rucola', 'fenchel', 'mais', 'erbsen']],
  ['Trockenware', ['nudel', 'spaghetti', 'penne', 'fusilli', 'lasagne', 'reis', 'mehl', 'zucker', 'linsen', 'bohnen', 'kichererbsen', 'haferflocken', 'couscous', 'bulgur', 'quinoa', 'öl', 'essig', 'senf', 'sojasauce', 'sojasoße', 'honig', 'semmelbrösel', 'paniermehl', 'backpulver', 'natron', 'stärke', 'nüsse', 'mandeln']],
]

export function rateKategorie(name: string): Kategorie {
  const text = name.toLowerCase()
  if (/^eier?\b/.test(text)) return 'Kühlregal'
  for (const [kategorie, begriffe] of REGELN) {
    if (begriffe.some((begriff) => text.includes(begriff))) return kategorie
  }
  return 'Sonstiges'
}
