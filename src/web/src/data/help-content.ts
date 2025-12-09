import { Cylinder, RotateCcw, Layers } from 'lucide-react';

export interface HelpField {
  name: string;
  description: string;
  tips?: string[];
  required?: boolean;
}

export interface HelpSection {
  title: string;
  description?: string;
  fields?: HelpField[];
  tips?: string[];
}

export interface HelpTopic {
  slug: string;
  title: string;
  description: string;
  icon: typeof Cylinder;
  sections: HelpSection[];
  relatedTopics?: string[];
}

export const helpTopics: Record<string, HelpTopic> = {
  tumblers: {
    slug: 'tumblers',
    title: 'My Tumblers',
    description: 'Learn how to set up and manage your rock tumblers in MyUglyRocks.',
    icon: Cylinder,
    sections: [
      {
        title: 'What is a Tumbler?',
        description: 'A tumbler in MyUglyRocks represents your physical rock tumbling machine. You can track multiple tumblers, each with their own barrels and settings.',
      },
      {
        title: 'Adding a New Tumbler',
        description: 'When adding a tumbler, you\'ll provide information about your machine to help track your tumbling cycles.',
        fields: [
          {
            name: 'Brand',
            description: 'The manufacturer of your tumbler (e.g., National Geographic, Lortone, Harbor Freight).',
            tips: [
              'Select "Generic" or "Other" if your brand isn\'t listed',
              'The brand helps auto-populate other settings'
            ],
            required: true,
          },
          {
            name: 'Model',
            description: 'The specific model of your tumbler. This is auto-populated based on the brand you select.',
            tips: [
              'Models determine default barrel count and capacity',
              'If your exact model isn\'t listed, choose the closest match'
            ],
            required: true,
          },
          {
            name: 'Type',
            description: 'The tumbling mechanism: Rotary (barrel spins) or Vibratory (barrel vibrates).',
            tips: [
              'Rotary tumblers are most common for beginners',
              'Vibratory tumblers are faster but work differently',
              'This is auto-set based on the model you select'
            ],
          },
          {
            name: 'Motor Capacity (lbs)',
            description: 'The maximum total weight your tumbler motor can handle across all barrels.',
            tips: [
              'This is set by the manufacturer for most tumblers',
              'Only editable for Generic, Other, DIY, and MJR Tumblers brands',
              'Don\'t exceed this weight to avoid motor burnout'
            ],
          },
          {
            name: 'Notes',
            description: 'Any additional information about this tumbler.',
            tips: [
              'Record purchase date, modifications, or quirks',
              'Note any issues or maintenance performed'
            ],
          },
        ],
      },
      {
        title: 'Managing Barrels',
        description: 'Each tumbler can have multiple barrels. Barrels are the containers that hold your rocks during tumbling.',
        fields: [
          {
            name: 'Barrel Number',
            description: 'A sequential number identifying each barrel on this tumbler.',
            tips: [
              'Automatically assigned when you add barrels',
              'Helps identify which barrel a cycle is running in'
            ],
          },
          {
            name: 'Nickname',
            description: 'An optional friendly name for the barrel.',
            tips: [
              'Click the refresh icon to get a random fun name',
              'Useful when you have multiple identical barrels',
              'Examples: "Big Blue", "The Crusher", "Old Faithful"'
            ],
          },
          {
            name: 'Capacity (lbs)',
            description: 'The weight capacity of this specific barrel.',
            tips: [
              'Usually 3 lbs for small barrels, 6 lbs for large',
              'This is the weight of rocks + grit + water combined',
              'Don\'t fill more than 2/3 full with rocks'
            ],
          },
        ],
        tips: [
          'Add all barrels you might use with this tumbler',
          'You can run different barrel sizes on the same motor',
          'Some tumblers support running multiple barrels at once'
        ],
      },
      {
        title: 'Tips for Success',
        tips: [
          'Keep your tumbler in a place where noise won\'t be an issue - they run 24/7',
          'Place tumblers on a rubber mat to reduce vibration and noise',
          'Check your tumbler daily for leaks or unusual sounds',
          'Clean barrels thoroughly between grit stages to avoid contamination',
          'Label your barrels if you have multiples to track which is which'
        ],
      },
    ],
    relatedTopics: ['cycles', 'stages'],
  },

  cycles: {
    slug: 'cycles',
    title: 'Tumbling Cycles',
    description: 'Learn how to create and track your rock tumbling cycles from start to finish.',
    icon: RotateCcw,
    sections: [
      {
        title: 'What is a Cycle?',
        description: 'A cycle represents one complete tumbling project - taking rough rocks through multiple stages to produce polished stones. Each cycle tracks your progress from start to finish.',
      },
      {
        title: 'Creating a New Cycle',
        description: 'When starting a new batch of rocks, create a cycle to track your progress.',
        fields: [
          {
            name: 'Cycle Name',
            description: 'A descriptive name for this batch of rocks.',
            tips: [
              'Include the rock type or source (e.g., "Beach Agates - July 2024")',
              'Make it easy to identify later in your history',
              'You can always rename it later'
            ],
            required: true,
          },
          {
            name: 'Tumbler',
            description: 'Which tumbler you\'re using for this cycle.',
            tips: [
              'Add your tumbler first if you haven\'t already',
              'This links the cycle to track run time on that machine'
            ],
            required: true,
          },
          {
            name: 'Barrel',
            description: 'Which specific barrel on the tumbler is being used.',
            tips: [
              'Important for tracking what\'s in each barrel',
              'Helps if you\'re running multiple cycles on one tumbler'
            ],
            required: true,
          },
          {
            name: 'Recipe',
            description: 'The tumbling recipe (sequence of stages) to follow.',
            tips: [
              'Recipes define which stages and how long to run each',
              'Start with a standard recipe, adjust based on results',
              'Different rock types may need different recipes'
            ],
            required: true,
          },
          {
            name: 'Description',
            description: 'Details about the rocks in this cycle.',
            tips: [
              'Note where rocks came from',
              'Describe the rock types and sizes',
              'Record starting condition and quantity'
            ],
          },
          {
            name: 'Specimens',
            description: 'Tag specific rock types in this cycle.',
            tips: [
              'Helps track which rocks polish well together',
              'Builds your experience database over time',
              'Useful for sharing results with the community'
            ],
          },
        ],
      },
      {
        title: 'Cycle Status',
        description: 'Cycles progress through different statuses as you work on them.',
        tips: [
          'Not Started - Cycle created but first stage hasn\'t begun',
          'In Progress - Currently tumbling in one of the stages',
          'Paused - Temporarily stopped (e.g., waiting for supplies)',
          'Completed - All stages finished, rocks are polished!',
          'Abandoned - Stopped before completion (rocks broke, etc.)'
        ],
      },
      {
        title: 'Tips for Success',
        tips: [
          'Sort rocks by hardness - similar Mohs scale rocks tumble best together',
          'Sort by size - rocks within 1/2" of each other work better',
          'Don\'t mix soft rocks (fluorite, calcite) with hard rocks (agate, jasper)',
          'Take before photos! You\'ll be amazed at the transformation',
          'Keep notes on each cycle to learn what works',
          'Be patient - good results take 4-6 weeks typically'
        ],
      },
    ],
    relatedTopics: ['tumblers', 'stages'],
  },

  stages: {
    slug: 'stages',
    title: 'Tumbling Stages',
    description: 'Understanding the stages of rock tumbling and how to track them.',
    icon: Layers,
    sections: [
      {
        title: 'What are Stages?',
        description: 'Rock tumbling happens in stages, each using progressively finer grit to shape and polish your rocks. A typical cycle has 4 stages, though some recipes have more.',
      },
      {
        title: 'Standard Tumbling Stages',
        tips: [
          'Stage 1: Coarse Grind (60/90 grit) - Shapes rocks, removes rough edges. 7-10 days.',
          'Stage 2: Medium Grind (120/220 grit) - Smooths surface, removes scratches from Stage 1. 7-10 days.',
          'Stage 3: Pre-Polish (500/600 grit) - Prepares surface for polish. 7 days.',
          'Stage 4: Polish (aluminum oxide or cerium oxide) - Creates the final shine. 7 days.',
          'Optional: Burnish (soap flakes) - Cleans and adds extra shine. 1-2 days.'
        ],
      },
      {
        title: 'Starting a Stage',
        description: 'When you begin a stage, you\'ll record important information.',
        fields: [
          {
            name: 'Start Date/Time',
            description: 'When you started running this stage.',
            tips: [
              'Recorded automatically when you click "Start Stage"',
              'Helps track total tumbling time'
            ],
          },
          {
            name: 'Grit/Media',
            description: 'What tumbling media you\'re using for this stage.',
            tips: [
              'Pre-filled based on the recipe',
              'Can be adjusted if using different media',
              'Common media: silicon carbide grit, aluminum oxide, ceramic pellets'
            ],
          },
          {
            name: 'Amount',
            description: 'How much grit or polish you added.',
            tips: [
              'Typical: 2 tablespoons per pound of rocks',
              'Too little = slow progress, too much = wasted grit',
              'Adjust based on your barrel size'
            ],
          },
          {
            name: 'Notes',
            description: 'Any observations when starting this stage.',
            tips: [
              'Note rock condition from previous stage',
              'Record any rocks you removed',
              'Note if you added filler/ceramic media'
            ],
          },
        ],
      },
      {
        title: 'Completing a Stage',
        description: 'When a stage is done, you\'ll record results before moving to the next.',
        fields: [
          {
            name: 'End Date/Time',
            description: 'When you stopped running this stage.',
            tips: [
              'Click "Complete Stage" to record the end time',
              'System calculates total run time automatically'
            ],
          },
          {
            name: 'Results Rating',
            description: 'How well this stage turned out (1-5 stars).',
            tips: [
              'Be honest - helps you learn what works',
              '5 = Perfect results',
              '3 = Acceptable, could be better',
              '1 = Poor results, problems occurred'
            ],
          },
          {
            name: 'Completion Notes',
            description: 'Observations about the results.',
            tips: [
              'Note any scratches remaining',
              'Record rocks that cracked or were removed',
              'Describe the overall surface quality'
            ],
          },
          {
            name: 'Photos',
            description: 'Progress photos of your rocks.',
            tips: [
              'Take photos with good lighting',
              'Wet rocks show true polish level better',
              'Compare to previous stage photos'
            ],
          },
        ],
      },
      {
        title: 'Tips for Each Stage',
        tips: [
          'ALWAYS clean rocks and barrel thoroughly between stages',
          'Even tiny amounts of coarse grit will ruin your polish',
          'Check rocks daily - remove any that crack or break',
          'Keep barrel 2/3 full - add ceramic filler if needed',
          'Water should just cover the rocks',
          'If you hear clunking, add more filler media',
          'Extend stage time if rocks aren\'t ready to progress'
        ],
      },
      {
        title: 'Troubleshooting',
        tips: [
          'Rocks not shaping (Stage 1): Run longer, check grit amount, ensure proper tumbling action',
          'Scratches remaining: Run longer in current stage before progressing',
          'Dull polish: May have grit contamination - re-run previous stages with clean barrel',
          'Rocks breaking: They may have internal fractures or be too soft for tumbling',
          'Sludge leaking: Check barrel seal, don\'t overfill with water'
        ],
      },
    ],
    relatedTopics: ['cycles', 'tumblers'],
  },

  dashboard: {
    slug: 'dashboard',
    title: 'Dashboard',
    description: 'Overview of your MyUglyRocks activity and quick access to your tumbling projects.',
    icon: Cylinder,
    sections: [
      {
        title: 'Dashboard Overview',
        description: 'The dashboard gives you a quick view of your active cycles, recent activity, and statistics.',
      },
      {
        title: 'Active Cycles',
        description: 'Shows cycles currently in progress. Click on any cycle to view details or update progress.',
      },
      {
        title: 'Quick Actions',
        tips: [
          'Start a new cycle from the dashboard',
          'Check on running stages',
          'View recent completions'
        ],
      },
    ],
    relatedTopics: ['cycles', 'tumblers'],
  },

  gallery: {
    slug: 'gallery',
    title: 'Photo Gallery',
    description: 'Browse and share photos of your tumbling results.',
    icon: Cylinder,
    sections: [
      {
        title: 'Gallery Overview',
        description: 'The gallery shows photos from your completed cycles and other community members.',
      },
      {
        title: 'Sharing Photos',
        tips: [
          'Photos are uploaded during cycle stages',
          'Best lighting shows true polish quality',
          'Wet rocks photograph better than dry',
          'Include before/after comparisons'
        ],
      },
    ],
    relatedTopics: ['cycles', 'stages'],
  },

  settings: {
    slug: 'settings',
    title: 'Settings',
    description: 'Configure your MyUglyRocks account and preferences.',
    icon: Cylinder,
    sections: [
      {
        title: 'Profile Settings',
        description: 'Update your display name, avatar, and public profile information.',
      },
      {
        title: 'Account Settings',
        description: 'Manage your email, password, and account security.',
      },
      {
        title: 'Preferences',
        description: 'Customize your MyUglyRocks experience.',
        tips: [
          'Set your preferred measurement units',
          'Configure notification preferences',
          'Choose your default recipe settings'
        ],
      },
    ],
  },
};

// Map pathname prefixes to help topics
export function getHelpTopicFromPath(pathname: string): string {
  const pathParts = pathname.split('/').filter(Boolean);

  // Handle protected routes (remove "protected" prefix if present)
  const relevantPart = pathParts[0];

  // Map paths to topics
  const pathToTopic: Record<string, string> = {
    'tumblers': 'tumblers',
    'cycles': 'cycles',
    'dashboard': 'dashboard',
    'gallery': 'gallery',
    'settings': 'settings',
    'learn': 'dashboard', // Default for learn section
    'admin': 'dashboard', // Default for admin
  };

  return pathToTopic[relevantPart] || 'dashboard';
}

// Get all topics as array for listing
export function getAllHelpTopics(): HelpTopic[] {
  return Object.values(helpTopics);
}

// Get main topics (excluding dashboard, settings, gallery for the cards)
export function getMainHelpTopics(): HelpTopic[] {
  return ['tumblers', 'cycles', 'stages'].map(slug => helpTopics[slug]);
}
