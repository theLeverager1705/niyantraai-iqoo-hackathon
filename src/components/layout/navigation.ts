import {
  Activity,
  Award,
  Compass,
  FileBarChart,
  FolderGit2,
  LayoutDashboard,
  MessageSquareCode,
  Plug,
  Settings,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  end?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  {
    to: '/app',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    description: 'Balance score and today at a glance',
    end: true,
  },
  {
    to: '/app/analytics',
    label: 'AI Analytics',
    shortLabel: 'Analytics',
    icon: Activity,
    description: 'Usage, request mix and authorship',
  },
  {
    to: '/app/prompts',
    label: 'Prompt Intelligence',
    shortLabel: 'Prompts',
    icon: MessageSquareCode,
    description: 'How you ask, not how often',
  },
  {
    to: '/app/project',
    label: 'Project Understanding',
    shortLabel: 'Project',
    icon: FolderGit2,
    description: 'Do you understand what you built?',
  },
  {
    to: '/app/assessment',
    label: 'Adaptive Assessment',
    shortLabel: 'Assess',
    icon: Target,
    description: 'Questions that adjust to your answers',
  },
  {
    to: '/app/coach',
    label: 'Your AI Coach',
    shortLabel: 'Coach',
    icon: Compass,
    description: 'What to change next, and why',
  },
  {
    to: '/app/report',
    label: 'Weekly Report',
    shortLabel: 'Report',
    icon: FileBarChart,
    description: 'Growth over the last seven days',
  },
];

export const SECONDARY_NAV: NavItem[] = [
  {
    to: '/app/achievements',
    label: 'Achievements',
    shortLabel: 'Awards',
    icon: Award,
    description: 'Benchmarks earned from behaviour',
  },
  {
    to: '/app/integrations',
    label: 'Integrations',
    shortLabel: 'Connect',
    icon: Plug,
    description: 'Where AI activity comes from',
  },
  {
    to: '/app/settings',
    label: 'Privacy & Settings',
    shortLabel: 'Profile',
    icon: Settings,
    description: 'Your data, your controls',
  },
];

/** Five destinations for the mobile tab bar. */
export const MOBILE_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  PRIMARY_NAV[4],
  PRIMARY_NAV[5],
  SECONDARY_NAV[2],
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
