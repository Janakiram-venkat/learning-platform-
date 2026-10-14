import { CheckCircle2, AlertTriangle } from 'lucide-react';
import RichText from './RichText';
import LessonSimulation from './LessonSimulation';
import LessonWidget from './LessonWidget';
import LessonImage from './LessonImage';
import CodeBlock from './blocks/CodeBlock';
import Points from './blocks/Points';
import Analogy from './blocks/Analogy';
import Diagram from './blocks/Diagram';
import QuickCheck from './blocks/QuickCheck';
import CodeStepper from './blocks/CodeStepper';

/**
 * One teaching block from a lesson's `content` array.
 *
 * Text blocks: paragraph, tip, warning, points, analogy.
 * Visual blocks: code, diagram, image, simulation, widget, stepper.
 * Interactive pauses: check.
 *
 * `onTry` loads a snippet into the lesson editor; it is undefined on courses
 * without one. An unknown type renders nothing rather than breaking the page.
 */
export default function LessonBlock({ block, language, onTry }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="text-ink/75 leading-relaxed text-lg"><RichText value={block.value} /></p>;
    case 'tip':
      return (
        <div className="bg-pcb/8 border-l-4 border-pcb p-6 rounded-r-lg text-ink">
          <strong className="font-lab flex items-center mb-2 text-pcb"><CheckCircle2 className="w-5 h-5 mr-2" />{block.title || 'Tip'}</strong>
          <span className="text-lg"><RichText value={block.value} /></span>
        </div>
      );
    case 'warning':
      return (
        <div className="bg-wire/8 border-l-4 border-wire p-6 rounded-r-lg text-ink">
          <strong className="font-lab flex items-center mb-2 text-wire"><AlertTriangle className="w-5 h-5 mr-2" />{block.title || 'Watch out'}</strong>
          <span className="text-lg"><RichText value={block.value} /></span>
        </div>
      );
    case 'code': return <CodeBlock block={block} language={language} onTry={onTry} />;
    case 'points': return <Points block={block} />;
    case 'analogy': return <Analogy block={block} language={language} />;
    case 'diagram': return <Diagram block={block} language={language} />;
    case 'check': return <QuickCheck block={block} language={language} />;
    case 'stepper': return <CodeStepper block={block} language={language} onTry={onTry} />;
    case 'simulation': return <LessonSimulation sim={block} />;
    case 'widget': return <LessonWidget block={block} />;
    case 'image': return <LessonImage block={block} />;
    default: return null;
  }
}
