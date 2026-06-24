'use client';

import { motion } from 'framer-motion';

interface StatusChipProps {
  label: string;
  active: boolean;
  delay?: number;
}

export default function StatusChip({ label, active, delay = 0 }: StatusChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: delay * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="status-pill"
    >
      {label}
    </motion.div>
  );
}
