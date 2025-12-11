'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMainHelpTopics } from '@/data/help-content';
import { ChevronRight, HelpCircle } from 'lucide-react';

const faqCategories = [
  {
    title: 'Getting Started',
    questions: [
      {
        question: 'What is rock tumbling?',
        answer: 'Rock tumbling is the hobby of smoothing and polishing rough rocks using a rotating barrel filled with abrasive grit and water. Over several weeks, the rocks are gradually ground down and polished to reveal their natural beauty. The process mimics the natural action of water and sand on rocks in rivers and oceans, but in a fraction of the time.',
      },
      {
        question: 'What equipment do I need to start?',
        answer: 'To start rock tumbling, you need: (1) A rock tumbler - either rotary or vibratory, (2) Tumbling grit in various sizes (coarse, medium, fine, and polish), (3) Suitable rocks to tumble, (4) Plastic pellets for cushioning (optional but recommended), and (5) A water source. Most beginners start with a rotary tumbler as they are more affordable and forgiving.',
      },
      {
        question: 'How long does it take to tumble rocks?',
        answer: 'A complete tumbling cycle typically takes 4-6 weeks for a rotary tumbler. Each stage (coarse, medium, fine, polish) runs for about 7 days. Vibratory tumblers are faster, often completing the process in 2-3 weeks. The actual time depends on the hardness of your rocks and the results you want.',
      },
      {
        question: 'What rocks are best for beginners?',
        answer: 'Great rocks for beginners include: Jasper, Agate, Petrified Wood, and Quartz varieties. These have a Mohs hardness of 6.5-7, which is ideal for tumbling. Avoid mixing rocks of different hardnesses in the same batch, as softer rocks will be ground down before harder ones are polished.',
      },
    ],
  },
  {
    title: 'Tumbling Process',
    questions: [
      {
        question: 'What are the stages of tumbling?',
        answer: 'The standard 4-stage process is: (1) Coarse Grind (60/90 grit) - shapes the rocks and removes rough edges, (2) Medium Grind (120/220 grit) - smooths the surface, (3) Fine Grind (500 grit) - prepares for polishing, (4) Polish (aluminum oxide or cerium oxide) - brings out the shine. Some tumblers add a 5th burnishing stage with soap for extra luster.',
      },
      {
        question: 'How much grit should I use?',
        answer: 'A general rule is 2 tablespoons of grit per pound of rocks. For a typical 3-pound tumbler barrel, use about 6 tablespoons of grit. The grit should coat the rocks but not create a thick paste. Too much grit wastes material; too little slows the process.',
      },
      {
        question: 'How full should my barrel be?',
        answer: 'Fill your barrel 2/3 to 3/4 full with rocks. This allows proper tumbling action. If the barrel is too empty, rocks will drop and chip. If too full, rocks won\'t move properly. Add plastic pellets to fill gaps if you don\'t have enough rocks of similar hardness.',
      },
      {
        question: 'How much water should I add?',
        answer: 'Add water until it just reaches the bottom of the top layer of rocks. You should not see water pooling on top. Too much water dilutes the grit and reduces effectiveness. Check and adjust water levels every few days as needed.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    questions: [
      {
        question: 'Why aren\'t my rocks getting shiny?',
        answer: 'Common causes include: (1) Not running each stage long enough, (2) Contamination from previous stage grit, (3) Rocks not suitable for polishing (porous or too soft), (4) Scratches from earlier stages not being removed. Make sure to thoroughly clean rocks between stages and consider running stages longer.',
      },
      {
        question: 'My rocks have a frosted appearance. What went wrong?',
        answer: 'Frosting usually happens when: (1) Rocks are contaminated with coarser grit during polishing, (2) The polish stage wasn\'t run long enough, or (3) The rocks have microscopic fractures. Try re-running the polish stage after thorough cleaning, or run an extra fine grind stage first.',
      },
      {
        question: 'Why do my rocks have pits or chips?',
        answer: 'Pitting and chipping occur when: (1) Rocks of different hardnesses are mixed, (2) Barrel isn\'t full enough (rocks drop instead of roll), (3) Rocks have internal fractures or vugs. Sort rocks by hardness and fill barrels properly. Some rocks with natural pits may never achieve a smooth finish.',
      },
      {
        question: 'The barrel is making loud noises. Is this normal?',
        answer: 'Some noise is normal, but loud clunking or grinding sounds indicate problems. Causes include: (1) Not enough material in barrel, (2) Rocks are too large, (3) Water level is wrong. Add more rocks, plastic pellets, or adjust water. Rotary tumblers should have a consistent rumbling sound.',
      },
    ],
  },
  {
    title: 'Materials & Grits',
    questions: [
      {
        question: 'What is the difference between silicon carbide and aluminum oxide?',
        answer: 'Silicon carbide is harder (9.5 Mohs) and cuts faster, making it ideal for coarse and medium grinding stages. Aluminum oxide is slightly softer (9 Mohs) and produces a smoother finish, making it better for polishing. Some tumblers use aluminum oxide for all stages, while others use silicon carbide for grinding and aluminum oxide for polishing.',
      },
      {
        question: 'What are plastic pellets used for?',
        answer: 'Plastic pellets (ceramic or plastic media) serve multiple purposes: (1) They cushion rocks to prevent chipping, (2) They help fill the barrel to the proper level, (3) They carry grit into crevices, and (4) They improve the tumbling action. They\'re especially useful in the polish and burnish stages.',
      },
      {
        question: 'Can I reuse grit?',
        answer: 'No, grit should not be reused. As grit does its job, the particles break down and become less effective. Used grit can also contaminate later stages. Always start each stage with fresh grit. Dispose of used grit slurry properly - never pour it down the drain as it can clog pipes.',
      },
      {
        question: 'What polish should I use?',
        answer: 'Common polishes include: Aluminum oxide (general purpose, works on most rocks), Cerium oxide (excellent for quartz and obsidian), Tin oxide (premium polish for best shine), and Chrome oxide (for jade and other tough materials). Aluminum oxide is the best starting point for beginners.',
      },
    ],
  },
  {
    title: 'Maintenance & Care',
    questions: [
      {
        question: 'How do I clean my barrel between stages?',
        answer: 'Thoroughly clean rocks and barrel between each stage: (1) Remove rocks and rinse under running water, (2) Scrub each rock with an old toothbrush, (3) Wash the barrel and lid with dish soap, (4) Check for grit trapped in crevices. Even a small amount of coarse grit can ruin a polish stage.',
      },
      {
        question: 'How often should I check my tumbler?',
        answer: 'Check your tumbler daily: (1) Listen for unusual sounds, (2) Verify it\'s running properly, (3) Check for leaks. Every 2-3 days: (1) Open and check water levels, (2) Look for rocks that need to be removed, (3) Ensure proper tumbling action. Keep a log of your observations.',
      },
      {
        question: 'How do I dispose of tumbling slurry?',
        answer: 'Never pour slurry down the drain - it will harden and clog pipes. Instead: (1) Let slurry settle in a bucket, (2) Pour off clear water, (3) Let remaining sludge dry completely, (4) Dispose of dried material in trash. Some tumblers dig a hole in their yard to pour slurry, but check local regulations first.',
      },
    ],
  },
];

export default function FAQPage() {
  const helpTopics = getMainHelpTopics();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Get help with MyUglyRocks features and learn about rock tumbling
        </p>
      </div>

      {/* Topic Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Feature Guides</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link key={topic.slug} href={`/learn/faq/${topic.slug}`}>
                <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {topic.description}
                    </CardDescription>
                    <div className="flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                      Learn more
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <p className="text-muted-foreground mb-6">
          General questions about rock tumbling
        </p>

        <div className="space-y-6">
          {faqCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle>{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
