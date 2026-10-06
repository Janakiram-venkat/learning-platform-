import { Lightbulb, AlertTriangle } from 'lucide-react';
import Markdown from './Markdown';

// Tip and Warning are the same box with different intent, so they're one
// component. Tip matches the existing Python lesson page's tip treatment
// (pcb green, left rule); Warning uses wire red, reserved in this course for
// "here is the mistake everybody makes".

const VARIANTS = {
  tip: {
    label: 'Tip',
    Icon: Lightbulb,
    wrap: 'border-pcb bg-pcb/8',
    head: 'text-pcb',
  },
  warning: {
    label: 'Watch out',
    Icon: AlertTriangle,
    wrap: 'border-wire bg-wire/8',
    head: 'text-wire',
  },
};

/**
 * @param {{ variant: 'tip'|'warning', md: string, title?: string }} props
 */
export default function Callout({ variant, md, title }) {
  const { label, Icon, wrap, head } = VARIANTS[variant] || VARIANTS.tip;
  return (
    <div className={`rounded-r-lg border-l-4 p-5 ${wrap}`} role="note">
      <p className={`font-lab mb-2 flex items-center gap-2 font-bold ${head}`}>
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {title || label}
      </p>
      <Markdown md={md} className="text-ink" />
    </div>
  );
}
