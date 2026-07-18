import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function TextGenerateEffect({
  words,
  className,
}: {
  words: string;
  className?: string;
}) {
  const parts = words.split(' ');
  return (
    <motion.h1
      className={cn('font-bold leading-tight', className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.04 } },
        hidden: {},
      }}
    >
      {parts.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="mr-[0.3em] inline-block"
          variants={{
            hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
          }}
          transition={{ duration: 0.35 }}
        >
          {w}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export function FlipWords({
  words,
  className,
}: {
  words: string[];
  className?: string;
}) {
  return (
    <span className={cn('inline-block text-[#c4a574]', className)}>
      <motion.span
        key={words[0]}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {words[0]}
      </motion.span>
    </span>
  );
}
