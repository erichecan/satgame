// Content script: re-seed paraphrase + trim, and append the enhanced read_the_green / closer demo items.
// English content. Preserves re-annotated difficulty for paraphrase/trim. Does NOT touch existing
// keyword/trapType backfill (owned by seed-p1) or closer clues (already in DB). Idempotent.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ParaOption = { t: string; correct?: boolean; why: string };
type ParaItem = { source: string; options: ParaOption[] };

// 40 paraphrase items. The correct option restates the meaning; distractors: same-word swap / widen-narrow / reversal / not-stated.
const PARAPHRASE_ITEMS: ParaItem[] = [
  { source: "The new policy was met with widespread skepticism from local farmers.", options: [
    { t: "Many farmers in the area doubted the new policy.", correct: true, why: "widespread skepticism → many...doubted; same meaning." },
    { t: "Local farmers widely welcomed the new policy.", why: "Reversal—skepticism is doubt, not welcome." },
    { t: "The new policy met local farmers.", why: "Same words piled up, dropping the core idea of skepticism." },
    { t: "Every farmer in the country rejected the policy.", why: "Widened—the passage says local and doubtful, not a total rejection." } ] },
  { source: "Her argument, though elegant, ultimately rested on a flawed assumption.", options: [
    { t: "Despite its polish, her argument depended on a mistaken premise.", correct: true, why: "elegant→polish, flawed assumption→mistaken premise." },
    { t: "Her elegant argument rested well.", why: "Copies the words but drops the key 'flawed' turn." },
    { t: "Her argument was both elegant and completely sound.", why: "Reversal—the passage says it rests on a flawed assumption." },
    { t: "She refused to make any assumptions in her argument.", why: "Not in the passage." } ] },
  { source: "The committee postponed the decision until further data could be gathered.", options: [
    { t: "The committee decided immediately without any data.", why: "Reversal—the passage says it postponed." },
    { t: "The committee delayed deciding until it had more data.", correct: true, why: "postponed→delayed, further data→more data." },
    { t: "The committee gathered the decision and the data.", why: "Same words scrambled; doesn't make sense." },
    { t: "The committee canceled the decision permanently.", why: "Widened—postpone is to delay, not cancel." } ] },
  { source: "Critics praised the film for its restraint rather than its spectacle.", options: [
    { t: "Critics praised the film's spectacle above all.", why: "Reversal—the praise was for restraint." },
    { t: "Critics restrained their praise for the film.", why: "Reuses 'restraint' with a totally changed meaning." },
    { t: "Reviewers admired the movie's understatement over its flashiness.", correct: true, why: "restraint→understatement, spectacle→flashiness." },
    { t: "Audiences hated the film's quiet tone.", why: "Not in the passage." } ] },
  { source: "Sleep deprivation impairs memory far more than most people realize.", options: [
    { t: "Lack of sleep damages memory more than people generally think.", correct: true, why: "deprivation→lack, impairs→damages, realize→think." },
    { t: "Most people realize how sleep helps memory.", why: "Reuses realize/memory with the opposite meaning." },
    { t: "Sleep deprivation slightly affects memory.", why: "Narrowed—the passage says far more." },
    { t: "People who sleep well have poor memory.", why: "Not in the passage and logically flipped." } ] },
  { source: "The bridge, once a symbol of progress, now stands as a warning.", options: [
    { t: "What was once seen as advancement is now a cautionary sign.", correct: true, why: "symbol of progress→advancement, warning→cautionary sign." },
    { t: "The bridge is still a proud symbol of progress.", why: "Reversal—now it's a warning." },
    { t: "The bridge progressed into a warning symbol quickly.", why: "Same words stitched together, distorting the time contrast." },
    { t: "Engineers built a new warning bridge.", why: "Not in the passage." } ] },
  { source: "Few inventions have transformed daily life as thoroughly as the smartphone.", options: [
    { t: "Many inventions transformed daily life more than the smartphone.", why: "Reversal—'few...as' means almost none can match it." },
    { t: "Almost no invention has changed everyday life as completely as the smartphone.", correct: true, why: "few→almost no, thoroughly→completely." },
    { t: "The smartphone transformed few inventions.", why: "Same words misplaced; subject/object confused." },
    { t: "The smartphone had little effect on daily life.", why: "Reverses the meaning." } ] },
  { source: "The author deliberately leaves the ending ambiguous.", options: [
    { t: "The writer intentionally makes the conclusion unclear.", correct: true, why: "deliberately→intentionally, ambiguous→unclear." },
    { t: "The author accidentally confused the ending.", why: "Reversal—deliberately means on purpose." },
    { t: "The author leaves deliberately at the ending.", why: "Same words misused; meaning falls apart." },
    { t: "The ending explains everything clearly.", why: "Reverses 'ambiguous.'" } ] },
  { source: "Rising sea levels threaten coastal cities across the globe.", options: [
    { t: "Coastal cities threaten the rising sea.", why: "Same words, subject/object flipped." },
    { t: "A few coastal cities face minor sea-level changes.", why: "Narrowed." },
    { t: "Sea levels are falling near most cities.", why: "Reverses 'rising.'" },
    { t: "Cities along coasts worldwide are endangered by higher seas.", correct: true, why: "rising sea levels→higher seas, across the globe→worldwide." } ] },
  { source: "The experiment's results were promising but far from conclusive.", options: [
    { t: "The findings looked encouraging yet were not yet definitive.", correct: true, why: "promising→encouraging, far from conclusive→not definitive." },
    { t: "The results were both promising and fully conclusive.", why: "Reversal—it's far from settled." },
    { t: "The experiment promised conclusive results.", why: "Same-word swap that erases the reservation." },
    { t: "The results were disappointing and useless.", why: "Reverses 'promising.'" } ] },
  { source: "Unlike her predecessors, she embraced change instead of resisting it.", options: [
    { t: "Like her predecessors, she resisted change.", why: "Reverses 'unlike.'" },
    { t: "She welcomed change, whereas those before her fought it.", correct: true, why: "embraced→welcomed, predecessors→those before her." },
    { t: "She embraced her predecessors and their changes.", why: "Same words stitched together; the object changed." },
    { t: "She ignored change entirely.", why: "Not in the passage." } ] },
  { source: "The report understated the scale of the environmental damage.", options: [
    { t: "The report exaggerated the environmental damage.", why: "Reverses 'understated.'" },
    { t: "The report made the environmental harm seem smaller than it was.", correct: true, why: "understated→made seem smaller, damage→harm." },
    { t: "The report stated the damage under a tree.", why: "Misreads 'understate.'" },
    { t: "The environment suffered no real damage.", why: "Not in the passage." } ] },
  { source: "His theory gained acceptance only after decades of resistance.", options: [
    { t: "It took many years of opposition before his theory was embraced.", correct: true, why: "decades→many years, resistance→opposition." },
    { t: "His theory was accepted immediately.", why: "Reversal—it faced decades of resistance." },
    { t: "His theory resisted acceptance for decades.", why: "Same words misplaced; the subject is flipped." },
    { t: "No one ever accepted his theory.", why: "Reverses the outcome." } ] },
  { source: "The novel captures the quiet tension of small-town life.", options: [
    { t: "The novel captures a loud, dramatic city.", why: "Reverses quiet/small-town." },
    { t: "Small-town life captures the tense novel.", why: "Same words, subject/object flipped." },
    { t: "The book conveys the subtle unease of life in a small town.", correct: true, why: "captures→conveys, quiet tension→subtle unease." },
    { t: "The town in the novel is perfectly peaceful.", why: "Narrowed, erasing 'tension.'" } ] },
  { source: "Economists disagree about whether the tax will help or hurt growth.", options: [
    { t: "Experts are divided over the tax's effect on growth.", correct: true, why: "economists→experts, disagree→divided." },
    { t: "Economists agree the tax will help growth.", why: "Reverses 'disagree.'" },
    { t: "Growth disagrees with the economists' tax.", why: "Same words scrambled." },
    { t: "The tax will definitely destroy the economy.", why: "Invents a certainty not in the passage." } ] },
  { source: "The medication relieves symptoms without addressing the underlying cause.", options: [
    { t: "The medication cures the underlying cause completely.", why: "Reversal—it doesn't treat the cause." },
    { t: "The drug eases symptoms but does not treat the root problem.", correct: true, why: "relieves→eases, underlying cause→root problem." },
    { t: "The medication relieves the underlying cause.", why: "Same-word swap of the object." },
    { t: "The symptoms have no known cause.", why: "Not in the passage." } ] },
  { source: "She spoke with a confidence that belied her inexperience.", options: [
    { t: "Her confidence clearly showed her inexperience.", why: "Reverses 'belied' (to hide, not reveal)." },
    { t: "She spoke confidently about her experience.", why: "Misreads the words." },
    { t: "She was too nervous to speak at all.", why: "Reverses 'confidence.'" },
    { t: "Her assured tone hid how new she was.", correct: true, why: "confidence→assured tone, belied→hid, inexperience→how new." } ] },
  { source: "The city invested heavily in public transit to curb congestion.", options: [
    { t: "To reduce traffic, the city put major funding into public transportation.", correct: true, why: "invested heavily→major funding, curb congestion→reduce traffic." },
    { t: "The city spent little on transit and ignored congestion.", why: "Reverses 'heavily.'" },
    { t: "Public transit invested in the congested city.", why: "Same words, subject/object flipped." },
    { t: "The city banned all cars downtown.", why: "Not in the passage." } ] },
  { source: "Although widely admired, the plan proved impractical in practice.", options: [
    { t: "The plan was disliked and impractical.", why: "Reverses 'admired.'" },
    { t: "In practice, the plan practiced admiration.", why: "Same words spinning in place." },
    { t: "The plan was popular but did not work when carried out.", correct: true, why: "widely admired→popular, impractical→did not work." },
    { t: "The plan worked perfectly once tried.", why: "Reverses 'impractical.'" } ] },
  { source: "The discovery challenged assumptions that had gone unquestioned for centuries.", options: [
    { t: "The finding disputed beliefs no one had doubted for hundreds of years.", correct: true, why: "challenged→disputed, unquestioned for centuries→no one had doubted." },
    { t: "The discovery confirmed centuries-old assumptions.", why: "Reverses 'challenged.'" },
    { t: "For centuries, assumptions questioned the discovery.", why: "Same words with the roles inverted." },
    { t: "Scientists had always doubted these ideas.", why: "Reverses 'unquestioned.'" } ] },
  { source: "The lecture was informative but far too long.", options: [
    { t: "The lecture was short and uninformative.", why: "Reverses both parts." },
    { t: "The talk taught a lot yet went on excessively.", correct: true, why: "informative→taught a lot, far too long→went on excessively." },
    { t: "The long lecture informed the far.", why: "Same words scrambled." },
    { t: "The audience left before it began.", why: "Not in the passage." } ] },
  { source: "Volunteers, motivated by compassion, rebuilt the flooded village.", options: [
    { t: "The village rebuilt the compassionate volunteers.", why: "Same words, subject/object flipped." },
    { t: "Driven by sympathy, helpers restored the village hit by floods.", correct: true, why: "compassion→sympathy, rebuilt→restored." },
    { t: "Paid workers ignored the flooded village.", why: "Reverses the motive and the action." },
    { t: "Volunteers flooded the village out of anger.", why: "Not in the passage and flips the emotion." } ] },
  { source: "The startup's rapid growth masked deep financial problems.", options: [
    { t: "Fast expansion hid the company's serious money troubles.", correct: true, why: "rapid growth→fast expansion, masked→hid." },
    { t: "The startup's slow growth revealed its stability.", why: "Reverses several parts." },
    { t: "Financial problems masked the startup's growth.", why: "Same words, subject/object flipped." },
    { t: "The startup had no money problems at all.", why: "Reverses 'deep problems.'" } ] },
  { source: "He conceded the point, though reluctantly.", options: [
    { t: "He eagerly agreed with the point.", why: "Reverses 'reluctantly.'" },
    { t: "He refused to concede anything.", why: "Reverses 'conceded.'" },
    { t: "He admitted it, but unwillingly.", correct: true, why: "conceded→admitted, reluctantly→unwillingly." },
    { t: "He conceded reluctantly to a new job.", why: "Invents an object not in the passage." } ] },
  { source: "The findings apply only to a narrow range of conditions.", options: [
    { t: "The results hold true just for a limited set of situations.", correct: true, why: "apply→hold true, narrow range→limited set." },
    { t: "The findings apply to nearly all conditions.", why: "Reverses narrow/only." },
    { t: "A narrow range applied the findings.", why: "Same words, subject/object flipped." },
    { t: "The findings cannot be applied anywhere.", why: "Widens the negation." } ] },
  { source: "Rather than dictating solutions, the coach asked guiding questions.", options: [
    { t: "The coach dictated every solution to the team.", why: "Reverses 'rather than.'" },
    { t: "Instead of handing out answers, the coach posed questions to steer thinking.", correct: true, why: "dictating solutions→handing out answers." },
    { t: "The coach questioned the guiding dictator.", why: "Same words scrambled." },
    { t: "The coach stayed silent the whole session.", why: "Not in the passage." } ] },
  { source: "The two accounts of the event differ in almost every detail.", options: [
    { t: "The two accounts match on every detail.", why: "Reverses 'differ.'" },
    { t: "Every detail accounts for the two events.", why: "Same words spinning in place." },
    { t: "The two versions of what happened disagree on nearly everything.", correct: true, why: "accounts→versions, differ in almost every detail→disagree on nearly everything." },
    { t: "There is only one account of the event.", why: "Not in the passage." } ] },
  { source: "Technology has made information abundant but attention scarce.", options: [
    { t: "Because of technology, information is plentiful while focus is rare.", correct: true, why: "abundant→plentiful, attention scarce→focus is rare." },
    { t: "Technology made both information and attention abundant.", why: "Reverses 'scarce.'" },
    { t: "Scarce technology made abundant attention.", why: "Same words scrambled." },
    { t: "Technology destroyed all available information.", why: "Reverses 'abundant.'" } ] },
  { source: "The museum's collection, vast as it is, represents only a fraction of the artist's work.", options: [
    { t: "The museum owns nearly all of the artist's work.", why: "Reverses 'only a fraction.'" },
    { t: "Huge though it is, the museum's holdings show just a small part of what the artist made.", correct: true, why: "vast→huge, only a fraction→just a small part." },
    { t: "A fraction of the museum represents the vast artist.", why: "Same words scrambled." },
    { t: "The artist made very few works.", why: "Not in the passage." } ] },
  { source: "Her explanation clarified what had confused the class for weeks.", options: [
    { t: "Her explanation confused the class even more.", why: "Reverses 'clarified.'" },
    { t: "The confused class clarified her explanation.", why: "Same words, subject/object flipped." },
    { t: "Her account cleared up what had puzzled the students for a long time.", correct: true, why: "clarified→cleared up, confused→puzzled." },
    { t: "The class had understood everything from the start.", why: "Reverses 'confused.'" } ] },
  { source: "The reforms benefited the wealthy while doing little for the poor.", options: [
    { t: "The changes helped rich people but offered scarcely anything to the poor.", correct: true, why: "reforms→changes, little→scarcely anything." },
    { t: "The reforms mainly helped the poor.", why: "Reverses who benefits." },
    { t: "The poor benefited the wealthy reforms.", why: "Same words scrambled." },
    { t: "The reforms hurt everyone equally.", why: "Not in the passage." } ] },
  { source: "Skeptical at first, the jury was gradually won over by the evidence.", options: [
    { t: "Convinced from the start, the jury ignored the evidence.", why: "Reverses 'skeptical.'" },
    { t: "The jury won over the skeptical evidence.", why: "Same words, subject/object flipped." },
    { t: "The evidence was never presented to the jury.", why: "Not in the passage." },
    { t: "Doubtful in the beginning, the jury was slowly persuaded by the proof.", correct: true, why: "skeptical→doubtful, won over→persuaded." } ] },
  { source: "The species survives in only a handful of isolated valleys.", options: [
    { t: "The animal lives on in just a few remote valleys.", correct: true, why: "survives→lives on, a handful→a few, isolated→remote." },
    { t: "The species thrives across many connected valleys.", why: "Reverses handful/isolated." },
    { t: "A handful of valleys survive the species.", why: "Same words, subject/object flipped." },
    { t: "The species has completely died out.", why: "Reverses 'survives.'" } ] },
  { source: "His memoir is honest about his failures as well as his triumphs.", options: [
    { t: "His memoir hides his failures and lists only wins.", why: "Reverses 'honest about failures.'" },
    { t: "His autobiography frankly discusses both his defeats and his successes.", correct: true, why: "memoir→autobiography, honest→frankly." },
    { t: "His triumphs failed to write the memoir.", why: "Same words scrambled." },
    { t: "He never experienced any failures.", why: "Not in the passage." } ] },
  { source: "The drought forced farmers to abandon crops they could no longer water.", options: [
    { t: "The drought helped farmers grow more crops.", why: "Reverses 'forced to abandon.'" },
    { t: "The crops watered the abandoned farmers.", why: "Same words scrambled." },
    { t: "Unable to irrigate them, farmers gave up crops because of the drought.", correct: true, why: "abandon→gave up, no longer water→unable to irrigate." },
    { t: "Farmers had plenty of water for their crops.", why: "Reverses 'no longer water.'" } ] },
  { source: "The proposal, ambitious yet vague, drew both excitement and doubt.", options: [
    { t: "Bold but unclear, the plan sparked both enthusiasm and uncertainty.", correct: true, why: "ambitious→bold, vague→unclear." },
    { t: "The clear, modest proposal drew only calm.", why: "Reverses ambitious/vague." },
    { t: "Excitement and doubt proposed the vague plan.", why: "Same words scrambled." },
    { t: "No one reacted to the proposal at all.", why: "Reverses 'both...and.'" } ] },
  { source: "Even seasoned climbers underestimate how quickly the weather can turn.", options: [
    { t: "Experienced climbers always predict the weather perfectly.", why: "Reverses 'underestimate.'" },
    { t: "The weather underestimates seasoned climbers.", why: "Same words, subject/object flipped." },
    { t: "Experienced climbers still misjudge how fast conditions can change.", correct: true, why: "seasoned→experienced, underestimate→misjudge." },
    { t: "Only beginners are affected by the weather.", why: "Reverses 'even seasoned.'" } ] },
  { source: "The law was intended to protect consumers, but loopholes weakened it.", options: [
    { t: "Meant to safeguard buyers, the law was undermined by gaps in it.", correct: true, why: "protect consumers→safeguard buyers, loopholes weakened→gaps undermined." },
    { t: "The law strengthened protections through its loopholes.", why: "Reverses 'weakened.'" },
    { t: "Consumers protected the weakened loopholes.", why: "Same words scrambled." },
    { t: "The law had no purpose at all.", why: "Reverses 'intended to.'" } ] },
  { source: "She valued substance over style in everything she wrote.", options: [
    { t: "She always chose style over substance.", why: "Reverses the priority." },
    { t: "Her style valued the substance of writing.", why: "Same words spinning in place." },
    { t: "In her writing she cared more about content than about flair.", correct: true, why: "substance→content, style→flair." },
    { t: "She rarely wrote anything at all.", why: "Not in the passage." } ] },
  { source: "The verdict set a precedent that would shape future cases.", options: [
    { t: "The ruling established a model that later cases would follow.", correct: true, why: "verdict→ruling, precedent→model, shape future→later cases follow." },
    { t: "The verdict had no effect on any future case.", why: "Reverses 'shape future.'" },
    { t: "Future cases set the verdict's precedent.", why: "Same words, subject/object flipped." },
    { t: "The court refused to reach a verdict.", why: "Not in the passage." } ] },
];

type TrimToken = { text: string; core: boolean };
type TrimItem = { tokens: TrimToken[]; gloss: string };

// 40 trim items. The core=true tokens joined form the subject-verb-object skeleton.
const TRIM_ITEMS: TrimItem[] = [
  { tokens: [ { text: "The scientist", core: true }, { text: ", who had studied otters for decades,", core: false }, { text: "finally", core: false }, { text: "published", core: true }, { text: "her findings.", core: true } ], gloss: "Core: The scientist published her findings. The relative clause and 'finally' are modifiers." },
  { tokens: [ { text: "Exhausted after the long march,", core: false }, { text: "the soldiers", core: true }, { text: "collapsed", core: true }, { text: "onto the cold ground.", core: false } ], gloss: "Core: The soldiers collapsed. The leading participle phrase and the prepositional phrase can go." },
  { tokens: [ { text: "The report", core: true }, { text: "that the committee released last week", core: false }, { text: "sparked", core: true }, { text: "a heated debate.", core: true } ], gloss: "Core: The report sparked a debate. The relative clause is a modifier." },
  { tokens: [ { text: "In the middle of the storm,", core: false }, { text: "the pilot", core: true }, { text: "calmly", core: false }, { text: "landed", core: true }, { text: "the plane.", core: true } ], gloss: "Core: The pilot landed the plane. The adverbial and 'calmly' are modifiers." },
  { tokens: [ { text: "The novel,", core: true }, { text: "praised by critics and loved by readers,", core: false }, { text: "became", core: true }, { text: "an instant classic.", core: true } ], gloss: "Core: The novel became a classic. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "Because the bridge was unsafe,", core: false }, { text: "engineers", core: true }, { text: "closed", core: true }, { text: "it", core: true }, { text: "to all traffic.", core: false } ], gloss: "Core: Engineers closed it. The reason clause and the prepositional phrase can go." },
  { tokens: [ { text: "The students", core: true }, { text: ", eager to impress their teacher,", core: false }, { text: "prepared", core: true }, { text: "for hours.", core: false } ], gloss: "Core: The students prepared. The aside and the time phrase are modifiers." },
  { tokens: [ { text: "Rising steadily since 1950,", core: false }, { text: "global temperatures", core: true }, { text: "have alarmed", core: true }, { text: "climate scientists.", core: true } ], gloss: "Core: Temperatures have alarmed scientists. The leading participle phrase is a modifier." },
  { tokens: [ { text: "The company", core: true }, { text: ", despite its early success,", core: false }, { text: "ultimately", core: false }, { text: "failed.", core: true } ], gloss: "Core: The company failed. The concessive aside and 'ultimately' are modifiers." },
  { tokens: [ { text: "Hidden beneath layers of paint,", core: false }, { text: "the original portrait", core: true }, { text: "surprised", core: true }, { text: "the restorers.", core: true } ], gloss: "Core: The portrait surprised the restorers. The leading participle phrase is a modifier." },
  { tokens: [ { text: "The theory", core: true }, { text: "that light behaves as both wave and particle", core: false }, { text: "puzzled", core: true }, { text: "early physicists.", core: true } ], gloss: "Core: The theory puzzled physicists. The appositive clause is a modifier." },
  { tokens: [ { text: "When the results came in,", core: false }, { text: "the researchers", core: true }, { text: "immediately", core: false }, { text: "revised", core: true }, { text: "their model.", core: true } ], gloss: "Core: The researchers revised their model. The time clause and 'immediately' can go." },
  { tokens: [ { text: "The ancient city,", core: true }, { text: "buried by ash for centuries,", core: false }, { text: "remained", core: true }, { text: "remarkably", core: false }, { text: "intact.", core: true } ], gloss: "Core: The city remained intact. The inserted participle phrase and 'remarkably' are modifiers." },
  { tokens: [ { text: "To protect the coral reefs,", core: false }, { text: "the government", core: true }, { text: "banned", core: true }, { text: "certain fishing methods.", core: true } ], gloss: "Core: The government banned methods. The purpose phrase is a modifier." },
  { tokens: [ { text: "The author's latest book,", core: true }, { text: "which took nearly ten years to write,", core: false }, { text: "explores", core: true }, { text: "themes of memory.", core: true } ], gloss: "Core: The book explores themes. The nonrestrictive relative clause is a modifier." },
  { tokens: [ { text: "Frustrated by the delays,", core: false }, { text: "passengers", core: true }, { text: "demanded", core: true }, { text: "a refund.", core: true } ], gloss: "Core: Passengers demanded a refund. The leading participle phrase is a modifier." },
  { tokens: [ { text: "The medicine,", core: true }, { text: "although expensive,", core: false }, { text: "saved", core: true }, { text: "countless lives.", core: true } ], gloss: "Core: The medicine saved lives. The concessive aside is a modifier." },
  { tokens: [ { text: "Standing at the edge of the cliff,", core: false }, { text: "she", core: true }, { text: "felt", core: true }, { text: "a rush of fear.", core: true } ], gloss: "Core: She felt fear. The leading participle phrase is a modifier." },
  { tokens: [ { text: "The data", core: true }, { text: "collected over three field seasons", core: false }, { text: "confirmed", core: true }, { text: "the hypothesis.", core: true } ], gloss: "Core: The data confirmed the hypothesis. The past-participle phrase as modifier can go." },
  { tokens: [ { text: "After decades of neglect,", core: false }, { text: "the theater", core: true }, { text: "was", core: true }, { text: "beautifully", core: false }, { text: "restored.", core: true } ], gloss: "Core: The theater was restored. The time phrase and 'beautifully' are modifiers." },
  { tokens: [ { text: "The teacher,", core: true }, { text: "known for her patience,", core: false }, { text: "explained", core: true }, { text: "the problem again.", core: false } ], gloss: "Core: The teacher explained the problem. The aside and 'again' are modifiers." },
  { tokens: [ { text: "Though small in size,", core: false }, { text: "the device", core: true }, { text: "stores", core: true }, { text: "enormous amounts of data.", core: true } ], gloss: "Core: The device stores data. The concessive adverbial is a modifier." },
  { tokens: [ { text: "The river,", core: true }, { text: "swollen by weeks of rain,", core: false }, { text: "flooded", core: true }, { text: "the nearby farms.", core: true } ], gloss: "Core: The river flooded the farms. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "Determined to finish,", core: false }, { text: "the runner", core: true }, { text: "pushed", core: true }, { text: "through the pain.", core: false } ], gloss: "Core: The runner pushed. The leading participle phrase and the prepositional phrase can go." },
  { tokens: [ { text: "The proposal", core: true }, { text: "that the board approved yesterday", core: false }, { text: "will change", core: true }, { text: "everything.", core: true } ], gloss: "Core: The proposal will change everything. The relative clause is a modifier." },
  { tokens: [ { text: "In her groundbreaking study,", core: false }, { text: "the biologist", core: true }, { text: "described", core: true }, { text: "a new species.", core: true } ], gloss: "Core: The biologist described a species. The leading prepositional phrase is a modifier." },
  { tokens: [ { text: "The letters,", core: true }, { text: "written during the war,", core: false }, { text: "reveal", core: true }, { text: "her private fears.", core: true } ], gloss: "Core: The letters reveal her fears. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "Surrounded by reporters,", core: false }, { text: "the senator", core: true }, { text: "refused", core: true }, { text: "to comment.", core: true } ], gloss: "Core: The senator refused to comment. The leading participle phrase is a modifier." },
  { tokens: [ { text: "The factory,", core: true }, { text: "once the largest in the region,", core: false }, { text: "now", core: false }, { text: "stands", core: true }, { text: "empty.", core: true } ], gloss: "Core: The factory stands empty. The appositive aside and 'now' are modifiers." },
  { tokens: [ { text: "Having lost the map,", core: false }, { text: "the hikers", core: true }, { text: "wandered", core: true }, { text: "for hours.", core: false } ], gloss: "Core: The hikers wandered. The leading perfect-participle phrase and the time phrase can go." },
  { tokens: [ { text: "The vaccine,", core: true }, { text: "developed in record time,", core: false }, { text: "reached", core: true }, { text: "millions of people.", core: true } ], gloss: "Core: The vaccine reached people. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "Unless conditions improve,", core: false }, { text: "the crops", core: true }, { text: "will fail.", core: true } ], gloss: "Core: The crops will fail. The conditional clause is a modifier." },
  { tokens: [ { text: "The painting,", core: true }, { text: "long thought to be a forgery,", core: false }, { text: "turned out", core: true }, { text: "to be genuine.", core: true } ], gloss: "Core: The painting turned out to be genuine. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "Working late into the night,", core: false }, { text: "the team", core: true }, { text: "met", core: true }, { text: "the deadline.", core: true } ], gloss: "Core: The team met the deadline. The leading participle phrase is a modifier." },
  { tokens: [ { text: "The witness", core: true }, { text: ", nervous but determined,", core: false }, { text: "described", core: true }, { text: "what she had seen.", core: true } ], gloss: "Core: The witness described what she had seen. The inserted adjective phrase is a modifier." },
  { tokens: [ { text: "Because funding ran out,", core: false }, { text: "the project", core: true }, { text: "was", core: true }, { text: "quietly", core: false }, { text: "abandoned.", core: true } ], gloss: "Core: The project was abandoned. The reason clause and 'quietly' are modifiers." },
  { tokens: [ { text: "The mountain,", core: true }, { text: "shrouded in mist most mornings,", core: false }, { text: "attracts", core: true }, { text: "thousands of climbers.", core: true } ], gloss: "Core: The mountain attracts climbers. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "To everyone's surprise,", core: false }, { text: "the quiet student", core: true }, { text: "won", core: true }, { text: "the debate.", core: true } ], gloss: "Core: The student won the debate. The leading prepositional phrase is a modifier." },
  { tokens: [ { text: "The instructions,", core: true }, { text: "printed in tiny letters,", core: false }, { text: "confused", core: true }, { text: "most users.", core: true } ], gloss: "Core: The instructions confused users. The inserted participle phrase is a modifier." },
  { tokens: [ { text: "While the orchestra tuned their instruments,", core: false }, { text: "the audience", core: true }, { text: "waited", core: true }, { text: "in silence.", core: false } ], gloss: "Core: The audience waited. The time clause and the prepositional phrase can go." },
];

type RtgOption = { t: string; correct?: boolean; trap?: string; trapType?: "same-word" | "opposite" | "out-of-scope" | "wrong-logic" };
type RtgItem = { sentences: string[]; question: string; options: RtgOption[]; evidenceIndex: number; evidenceWhy: string; keywords?: string[] };

// 8 enhanced read_the_green items with keyword-locating + trap classification (appended, doesn't wipe existing)
const RTG_ENHANCED: RtgItem[] = [
  { sentences: [ "Dr. Alvarez spent years mapping the migration of monarch butterflies.", "Her team tagged thousands of insects across three countries.", "The data showed a single population traveling farther than anyone had thought possible.", "Alvarez argued that protecting even one stopover site could safeguard the whole journey." ],
    question: "According to the passage, what did Alvarez's data reveal about the monarch population?",
    keywords: ["Alvarez", "data", "reveal", "population"],
    options: [
      { t: "One group of monarchs migrated a greater distance than expected.", correct: true },
      { t: "Alvarez tagged butterflies in three countries.", trap: "Copies 'three countries,' but that's the method, not the data finding.", trapType: "same-word" },
      { t: "Monarch populations were declining rapidly.", trap: "The passage never mentions a decline.", trapType: "out-of-scope" },
      { t: "Protecting one site would harm the migration.", trap: "Opposite of 'safeguard.'", trapType: "opposite" } ],
    evidenceIndex: 2, evidenceWhy: "Sentence 3 directly states a single population traveling farther than anyone had thought possible." },
  { sentences: [ "The city council voted to replace the old streetlights with LED bulbs.", "Supporters pointed to lower energy bills and reduced carbon emissions.", "Critics worried the bright white light would disturb residents at night.", "The council promised to test dimmer models before a full rollout." ],
    question: "According to the passage, why did critics oppose the new streetlights?",
    keywords: ["critics", "oppose", "streetlights"],
    options: [
      { t: "They feared the harsh light would bother people while sleeping.", correct: true },
      { t: "They wanted lower energy bills.", trap: "That's the supporters' reason.", trapType: "opposite" },
      { t: "The council voted to replace the streetlights.", trap: "Reuses replace/streetlights but answers the wrong thing.", trapType: "same-word" },
      { t: "They opposed all forms of new technology.", trap: "The passage makes no such sweeping claim.", trapType: "out-of-scope" } ],
    evidenceIndex: 2, evidenceWhy: "Sentence 3: Critics worried the bright white light would disturb residents at night." },
  { sentences: [ "For most of his career, the composer wrote for small chamber groups.", "Late in life, he suddenly turned to enormous symphonies.", "Some scholars link the shift to his growing deafness.", "Others say he simply wanted a bigger canvas for his ideas." ],
    question: "The passage indicates that the composer's late works differed from his earlier ones in that they were:",
    keywords: ["late", "works", "differed", "earlier"],
    options: [
      { t: "written for much larger ensembles.", correct: true },
      { t: "caused by his deafness.", trap: "That's only some scholars' explanation, not the difference itself.", trapType: "wrong-logic" },
      { t: "written for small chamber groups.", trap: "Same words, but that describes the early works.", trapType: "same-word" },
      { t: "unpopular with audiences.", trap: "The passage never mentions popularity.", trapType: "out-of-scope" } ],
    evidenceIndex: 1, evidenceWhy: "Sentence 2 ('turned to enormous symphonies') contrasts with the opening 'small chamber groups.'" },
  { sentences: [ "The startup promised to deliver groceries within ten minutes.", "To do so, it built tiny warehouses in dense neighborhoods.", "Analysts questioned whether the model could ever turn a profit.", "Within a year, the company quietly raised its delivery times." ],
    question: "According to the passage, what did analysts doubt about the startup?",
    keywords: ["analysts", "doubt", "startup"],
    options: [
      { t: "Whether it could ever become profitable.", correct: true },
      { t: "Whether it could build warehouses.", trap: "Reuses 'warehouses,' but that's not what analysts questioned.", trapType: "same-word" },
      { t: "Whether customers wanted fast delivery.", trap: "The passage never mentions customer demand.", trapType: "out-of-scope" },
      { t: "That the model was already profitable.", trap: "Opposite of 'questioned...profit.'", trapType: "opposite" } ],
    evidenceIndex: 2, evidenceWhy: "Sentence 3: Analysts questioned whether the model could ever turn a profit." },
  { sentences: [ "Ancient Roman concrete has survived two thousand years of waves and storms.", "Modern concrete, by contrast, often crumbles within decades.", "Researchers recently found that seawater actually strengthens the Roman mix.", "They hope to copy the recipe for longer-lasting sea walls." ],
    question: "The passage most strongly suggests that seawater affects Roman concrete by:",
    keywords: ["seawater", "Roman concrete"],
    options: [
      { t: "making it more durable over time.", correct: true },
      { t: "causing it to crumble within decades.", trap: "That describes modern concrete.", trapType: "wrong-logic" },
      { t: "surviving two thousand years of storms.", trap: "Same words, but answers the wrong thing.", trapType: "same-word" },
      { t: "making it cheaper to produce.", trap: "The passage never mentions cost.", trapType: "out-of-scope" } ],
    evidenceIndex: 2, evidenceWhy: "Sentence 3: seawater actually strengthens the Roman mix." },
  { sentences: [ "The librarian noticed that students avoided the top-floor reading room.", "It was quiet, but the lighting was dim and the chairs were stiff.", "After new lamps and cushions arrived, the room filled up quickly.", "Attendance data confirmed the change was no coincidence." ],
    question: "According to the passage, why had students originally avoided the reading room?",
    keywords: ["students", "avoided", "reading room"],
    options: [
      { t: "It was poorly lit and uncomfortable.", correct: true },
      { t: "It was too noisy to study in.", trap: "Opposite of 'It was quiet.'", trapType: "opposite" },
      { t: "The room was on the top floor.", trap: "Reuses 'top-floor,' but that's not the reason.", trapType: "same-word" },
      { t: "It was too far from the library entrance.", trap: "The passage never mentions distance.", trapType: "out-of-scope" } ],
    evidenceIndex: 1, evidenceWhy: "Sentence 2 spells out that the lighting was dim and the chairs were stiff." },
  { sentences: [ "The coach benched his star player during the championship game.", "Reporters assumed the two had argued.", "In fact, the player had a minor injury the coach wanted to protect.", "The team went on to win without him." ],
    question: "According to the passage, why did the coach bench the star player?",
    keywords: ["coach", "bench", "player"],
    options: [
      { t: "To avoid worsening the player's injury.", correct: true },
      { t: "Because the two had argued.", trap: "That's the reporters' assumption; the passage says 'In fact' the reason was different.", trapType: "wrong-logic" },
      { t: "The coach benched his star player.", trap: "Repeats the prompt without answering why.", trapType: "same-word" },
      { t: "Because the player performed poorly all season.", trap: "The passage never mentions season-long performance.", trapType: "out-of-scope" } ],
    evidenceIndex: 2, evidenceWhy: "Sentence 3: the player had a minor injury the coach wanted to protect." },
  { sentences: [ "Early maps of the coastline were riddled with errors.", "Sailors relied on them anyway, having nothing better.", "A young surveyor spent a decade correcting the charts foot by foot.", "Her revised maps cut shipwrecks in the region dramatically." ],
    question: "The passage indicates that the surveyor's maps had which effect?",
    keywords: ["surveyor", "maps", "effect"],
    options: [
      { t: "They greatly reduced shipwrecks in the area.", correct: true },
      { t: "They were riddled with errors.", trap: "Same words, but that describes the early maps.", trapType: "same-word" },
      { t: "They made sailors stop using maps.", trap: "The passage says no such thing.", trapType: "out-of-scope" },
      { t: "They increased the number of wrecks.", trap: "Opposite of 'cut shipwrecks.'", trapType: "opposite" } ],
    evidenceIndex: 3, evidenceWhy: "Sentence 4: Her revised maps cut shipwrecks in the region dramatically." },
];

type CloserItem = { word: string; pos: string; def: string; ex: string; contextClues?: string[] };
// 12 enhanced closer words with context clues (appended)
const CLOSER_ENHANCED: CloserItem[] = [
  { word: "ephemeral", pos: "adjective", def: "lasting for a very short time", ex: "The cherry blossoms were {word}, gone within a week of blooming.", contextClues: ["short", "gone", "within", "week"] },
  { word: "meticulous", pos: "adjective", def: "showing great attention to detail; very careful", ex: "Her {word} notes recorded every measurement down to the last decimal.", contextClues: ["notes", "every", "detail", "careful"] },
  { word: "gregarious", pos: "adjective", def: "fond of company; sociable", ex: "Unlike his shy brother, Leo was {word} and thrived at parties.", contextClues: ["Unlike", "shy", "parties", "sociable"] },
  { word: "candid", pos: "adjective", def: "truthful and straightforward; frank", ex: "In a rare {word} moment, the usually guarded senator admitted his mistake.", contextClues: ["truthful", "admitted", "guarded", "frank"] },
  { word: "prudent", pos: "adjective", def: "acting with or showing care and thought for the future", ex: "It was {word} to save money, since the winter ahead looked uncertain.", contextClues: ["save", "future", "uncertain", "careful"] },
  { word: "tenacious", pos: "adjective", def: "holding firmly to a purpose; persistent", ex: "The {word} lawyer refused to give up even after three losses.", contextClues: ["refused", "give up", "persistent", "firmly"] },
  { word: "opaque", pos: "adjective", def: "not able to be seen through; hard to understand", ex: "The instructions were so {word} that no one could follow them.", contextClues: ["no one", "follow", "understand", "unclear"] },
  { word: "abate", pos: "verb", def: "to become less intense or widespread", ex: "Only when the storm began to {word} did the ships leave the harbor.", contextClues: ["storm", "less", "intense", "leave"] },
  { word: "novel", pos: "adjective", def: "new and unusual; original", ex: "Her {word} approach solved a problem others had missed for years.", contextClues: ["new", "original", "others", "missed"] },
  { word: "scrutinize", pos: "verb", def: "to examine closely and critically", ex: "The auditor would {word} every receipt before approving the budget.", contextClues: ["examine", "every", "closely", "auditor"] },
  { word: "reticent", pos: "adjective", def: "not revealing one's thoughts readily; reserved", ex: "He stayed {word} about his plans, sharing details with no one.", contextClues: ["no one", "reserved", "sharing", "thoughts"] },
  { word: "lucid", pos: "adjective", def: "expressed clearly; easy to understand", ex: "Her {word} explanation made the hardest topic suddenly clear.", contextClues: ["clearly", "clear", "understand", "explanation"] },
];

// Fetch existing difficulty keyed by a natural key, so re-seeding preserves the re-annotated grade.
async function difficultyMap(gameType: string, keyOf: (payload: any) => string) {
  const rows = await prisma.gameItem.findMany({ where: { gameType }, select: { difficulty: true, payload: true } });
  const m = new Map<string, number>();
  for (const r of rows) m.set(keyOf(r.payload), r.difficulty);
  return m;
}

async function main() {
  const paraDiff = await difficultyMap("paraphrase", (p) => p.source);
  await prisma.gameItem.deleteMany({ where: { gameType: "paraphrase" } });
  for (const item of PARAPHRASE_ITEMS) {
    await prisma.gameItem.create({ data: { gameType: "paraphrase", domain: "info_ideas", difficulty: paraDiff.get(item.source) ?? 2, payload: item } });
  }
  console.log(`paraphrase: ${PARAPHRASE_ITEMS.length}`);

  const trimKey = (p: any) => (p.tokens ?? []).map((t: any) => t.text).join("|");
  const trimDiff = await difficultyMap("trim", trimKey);
  await prisma.gameItem.deleteMany({ where: { gameType: "trim" } });
  for (const item of TRIM_ITEMS) {
    await prisma.gameItem.create({ data: { gameType: "trim", domain: "craft_structure", difficulty: trimDiff.get(trimKey(item)) ?? 2, payload: item } });
  }
  console.log(`trim: ${TRIM_ITEMS.length}`);

  // Refresh the appended [enh] demo items (identified by explanation prefix). Does not touch other read_the_green/closer.
  await prisma.gameItem.deleteMany({ where: { gameType: "read_the_green", explanation: { startsWith: "[enh]" } } });
  await prisma.gameItem.deleteMany({ where: { gameType: "closer", explanation: { startsWith: "[enh]" } } });
  for (const item of RTG_ENHANCED) {
    await prisma.gameItem.create({ data: { gameType: "read_the_green", domain: "info_ideas", difficulty: 2, payload: item, explanation: `[enh] ${item.evidenceWhy}` } });
  }
  for (const w of CLOSER_ENHANCED) {
    await prisma.gameItem.create({ data: { gameType: "closer", domain: "words_in_context", difficulty: 2, payload: w, explanation: "[enh] context-clue word" } });
  }
  console.log(`rtg enhanced: ${RTG_ENHANCED.length}, closer enhanced: ${CLOSER_ENHANCED.length}`);

  console.log("Methodology seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
