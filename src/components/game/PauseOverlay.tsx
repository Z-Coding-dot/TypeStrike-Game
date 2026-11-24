"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Home, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/hooks/useI18n";

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onRestart, onQuit }: PauseOverlayProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-bg-base/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      data-testid="pause-overlay"
    >
      <Card className="my-auto w-full max-w-sm p-6 text-center">
        <h2 id="pause-title" className="text-xl font-bold text-fg">
          {t("pause")}
        </h2>
        <div className="mt-5 flex flex-col gap-2">
          <Button type="button" data-testid="resume-game" onClick={onResume}>
            <Play className="size-4" aria-hidden="true" />
            {t("resume")}
          </Button>
          <Button type="button" variant="secondary" data-testid="restart-game" onClick={onRestart}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("restart")}
          </Button>
          <Button type="button" variant="danger" data-testid="quit-game" onClick={onQuit}>
            <Home className="size-4" aria-hidden="true" />
            {t("quit")}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
